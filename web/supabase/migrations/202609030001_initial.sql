create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'student' check (role in ('student','admin')),
  beta_access boolean not null default false,
  onboarded boolean not null default false,
  target_band numeric not null default 7 check (target_band between 1 and 9),
  self_reported_band numeric check (self_reported_band between 1 and 9),
  exam_date date,
  daily_minutes integer not null default 30 check (daily_minutes between 10 and 180),
  study_days integer[] not null default '{1,2,3,4,5}',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create function public.create_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,email,name) values (new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'name',new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;
create trigger create_user_profile after insert on auth.users for each row execute function public.create_profile();

create function public.has_beta_access() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select beta_access from public.profiles where id = auth.uid()),false);
$$;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create function public.accept_invitation(p_token_hash text, p_limit integer default 50) returns boolean language plpgsql security definer set search_path = public as $$
declare
  invitation public.invitations;
  user_email text;
  verified boolean;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  perform pg_advisory_xact_lock(9103001);
  select email, email_confirmed_at is not null into user_email, verified from auth.users where id=auth.uid();
  if not verified then raise exception 'EMAIL_NOT_VERIFIED'; end if;
  select * into invitation from public.invitations where token_hash=p_token_hash for update;
  if invitation.id is null or invitation.expires_at < now() then raise exception 'INVALID_INVITATION'; end if;
  if invitation.accepted_by = auth.uid() then return true; end if;
  if invitation.accepted_at is not null or lower(invitation.email) <> lower(user_email) then raise exception 'INVALID_INVITATION'; end if;
  if (select count(*) from public.profiles where beta_access) >= least(p_limit,50) then raise exception 'BETA_FULL'; end if;
  update public.profiles set beta_access=true where id=auth.uid();
  update public.invitations set accepted_by=auth.uid(),accepted_at=now() where id=invitation.id;
  return true;
end;
$$;

create table public.tasks (
  id text primary key,
  skill text not null check (skill in ('writing','speaking','reading')),
  current_version integer not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.task_versions (
  task_id text not null references public.tasks(id),
  version integer not null,
  content jsonb not null,
  content_hash text not null,
  created_at timestamptz not null default now(),
  primary key(task_id,version)
);

create table public.reading_keys (
  task_id text not null,
  task_version integer not null,
  answers jsonb not null,
  primary key(task_id,task_version),
  foreign key(task_id,task_version) references public.task_versions(task_id,version)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  task_version integer not null,
  task_snapshot jsonb not null,
  mode text not null check (mode in ('practice','strict')),
  status text not null default 'in_progress' check (status in ('in_progress','paused','submitted','completed')),
  answer jsonb not null default '{"text":"","reading":{},"audioIds":[]}',
  revision integer not null default 0,
  parent_attempt_id uuid references public.attempts(id) on delete cascade,
  started_at timestamptz not null default now(),
  deadline_at timestamptz,
  submitted_at timestamptz,
  elapsed_seconds integer not null default 0,
  active_since timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(task_id,task_version) references public.task_versions(task_id,version)
);
create index attempts_user_updated on public.attempts(user_id,updated_at desc);
create unique index attempts_active_original on public.attempts(user_id,task_id) where parent_attempt_id is null and status in ('in_progress','paused');

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('unavailable','queued','processing','ready','failed','insufficient_evidence')),
  band numeric check (band between 1 and 9),
  grade jsonb,
  reading jsonb,
  transcripts jsonb not null default '[]',
  model text,
  rubric_version text not null default '2026-09-03.1',
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.assessment_jobs (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments(id) on delete cascade,
  state text not null default 'pending' check (state in ('pending','dispatched','processing','completed','failed')),
  workflow_run_id text,
  tries integer not null default 0,
  leased_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid references public.attempts(id) on delete cascade,
  question_index integer not null default 0,
  storage_path text not null unique,
  mime_type text not null default 'audio/wav',
  duration_seconds numeric not null check (duration_seconds > 0 and duration_seconds <= 600),
  byte_size integer not null check (byte_size > 0 and byte_size <= 20971520),
  status text not null default 'pending' check (status in ('pending','ready','deleted')),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

create table public.speech_assets (
  cache_key text primary key,
  storage_path text not null,
  model text not null,
  created_at timestamptz not null default now()
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  reference_id text,
  created_at timestamptz not null default now()
);
create index usage_user_day on public.usage_events(user_id,kind,created_at);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  scheduled_date date not null,
  task_id text references public.tasks(id),
  planned_minutes integer not null,
  status text not null default 'planned' check(status in ('planned','started','completed','skipped')),
  attempt_id uuid references public.attempts(id) on delete set null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id,week_start,position)
);

create table public.vocabulary_words (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  topic text not null,
  term text not null,
  translation text not null,
  part_of_speech text not null,
  example text not null,
  gap_sentence text,
  alternatives jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create table public.saved_words (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null references public.vocabulary_words(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,word_id)
);
create table public.vocabulary_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null references public.vocabulary_words(id) on delete cascade,
  session_id uuid not null,
  question_type text not null check(question_type in ('translation','gap')),
  correct boolean not null,
  created_at timestamptz not null default now(),
  unique(user_id,session_id,word_id,question_type)
);
create table public.vocabulary_quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  questions jsonb not null,
  answer_key jsonb not null,
  submitted_at timestamptz,
  result jsonb,
  created_at timestamptz not null default now()
);

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  attempt_id uuid references public.attempts(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('user','assistant')),
  content text not null,
  status text not null default 'complete' check(status in ('streaming','complete','failed')),
  created_at timestamptz not null default now()
);
create table public.arcade_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null references public.tasks(id),
  duration_seconds numeric,
  speech_seconds numeric,
  longest_pause numeric,
  completed boolean,
  audio_id uuid references public.audio_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.profiles enable row level security;
create policy profile_owner on public.profiles for select to authenticated using(id=auth.uid());
create policy profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(name,target_band,self_reported_band,exam_date,daily_minutes,study_days,timezone,onboarded) on public.profiles to authenticated;

alter table public.tasks enable row level security;
create policy published_tasks on public.tasks for select to authenticated using(published and public.has_beta_access());
alter table public.task_versions enable row level security;
create policy published_versions on public.task_versions for select to authenticated using(public.has_beta_access() and exists(select 1 from public.tasks t where t.id=task_id and t.published));

do $$
declare tab text;
begin
  foreach tab in array array['attempts','assessments','audio_assets','study_sessions','usage_events','saved_words','vocabulary_results','chat_threads','chat_messages','arcade_sessions'] loop
    execute format('alter table public.%I enable row level security',tab);
    execute format('create policy owner_select on public.%I for select to authenticated using(user_id=auth.uid() and public.has_beta_access())',tab);
    execute format('revoke all on public.%I from anon,authenticated',tab);
    execute format('grant select on public.%I to authenticated',tab);
  end loop;
  foreach tab in array array['invitations','reading_keys','assessment_jobs','speech_assets','vocabulary_quizzes'] loop
    execute format('alter table public.%I enable row level security',tab);
    execute format('revoke all on public.%I from anon,authenticated',tab);
  end loop;
end;
$$;

alter table public.vocabulary_words enable row level security;
create policy visible_words on public.vocabulary_words for select to authenticated using(public.has_beta_access() and (owner_id is null or owner_id=auth.uid()));
revoke all on public.vocabulary_words from anon,authenticated;
grant select on public.vocabulary_words to authenticated;
revoke all on public.tasks,public.task_versions from anon,authenticated;
grant select on public.tasks,public.task_versions to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('speaking','speaking',false,20971520,array['audio/wav']),
('examiner','examiner',false,20971520,array['audio/wav']) on conflict(id) do nothing;

revoke execute on function public.create_profile() from public,anon,authenticated;
revoke execute on function public.accept_invitation(text,integer) from public,anon;
grant execute on function public.accept_invitation(text,integer) to authenticated;
