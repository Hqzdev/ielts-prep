alter table public.profiles alter column daily_minutes set default 10;
alter table public.profiles alter column study_days set default '{0,1,2,3,4,5,6}';
alter table public.chat_messages add column provider text not null default 'gemini';
alter table public.chat_messages add column model text;

create table public.native_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null default 0,
  version integer not null default 1 check (version=1),
  step integer not null default 0 check (step between 0 and 5),
  completed_at timestamptz,
  answers jsonb not null default '{"startingLevel":null,"targetBand":null,"examStatus":"unanswered","examDate":null,"focus":[],"barrier":null}',
  preferences jsonb not null default '{"dailyReminder":false,"reminderHour":19,"soundEffects":true}'
);
alter table public.native_profiles enable row level security;
create policy native_profile_owner on public.native_profiles for select to authenticated using(user_id=auth.uid() and public.has_beta_access());

create function public.grant_verified_email_access() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.email_confirmed_at is not null and (tg_op='INSERT' or old.email_confirmed_at is null) then
    update public.profiles set beta_access=true where id=new.id;
  end if;
  return new;
end;
$$;
revoke execute on function public.grant_verified_email_access() from public,anon,authenticated;
create trigger grant_verified_email_user after insert or update of email_confirmed_at on auth.users for each row execute function public.grant_verified_email_access();

create function public.save_native_onboarding(p_user uuid,p_revision integer,p_step integer,p_answers jsonb,p_complete boolean)
returns public.native_profiles language plpgsql security definer set search_path=public as $$
declare result public.native_profiles;
begin
  insert into public.native_profiles(user_id) values(p_user) on conflict do nothing;
  select * into result from public.native_profiles where user_id=p_user for update;
  if result.revision<>p_revision then
    if result.answers=p_answers and result.step=p_step and (not p_complete or result.completed_at is not null) then return result; end if;
    raise exception 'REVISION_CONFLICT';
  end if;
  update public.native_profiles set answers=p_answers,step=p_step,revision=revision+1,
    completed_at=case when p_complete then coalesce(completed_at,now()) else completed_at end
    where user_id=p_user returning * into result;
  if p_complete then
    update public.profiles set target_band=(p_answers->>'targetBand')::numeric,
      exam_date=nullif(p_answers->>'examDate','')::date,onboarded=true
      where id=p_user;
  end if;
  return result;
end;
$$;
revoke execute on function public.save_native_onboarding(uuid,integer,integer,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_native_onboarding(uuid,integer,integer,jsonb,boolean) to service_role;

alter table public.attempts add column client text not null default 'web' check(client in ('web','ios'));
alter table public.attempts add column requested_model text;
alter table public.assessments add column provider text not null default 'gemini' check(provider in ('gemini','gigachat','deterministic'));
alter table public.assessments add column requested_model text;

create function public.create_native_attempt(p_user uuid,p_task text,p_mode text,p_model text,p_parent uuid default null)
returns public.attempts language plpgsql security definer set search_path=public as $$
declare result public.attempts;
begin
  result=public.create_attempt(p_user,p_task,p_mode,p_parent);
  if not exists(select 1 from public.assessments where attempt_id=result.id) then
    update public.attempts set client='ios',requested_model=p_model where id=result.id returning * into result;
  end if;
  return result;
end;
$$;
revoke execute on function public.create_native_attempt(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.create_native_attempt(uuid,text,text,text,uuid) to service_role;

create function public.assign_assessment_provider() returns trigger language plpgsql security definer set search_path=public as $$
declare attempt public.attempts;
begin
  select * into attempt from public.attempts where id=new.attempt_id;
  new.provider=case when attempt.task_snapshot->>'skill'='reading' then 'deterministic' when attempt.client='ios' then 'gigachat' else 'gemini' end;
  new.requested_model=attempt.requested_model;
  return new;
end;
$$;
revoke execute on function public.assign_assessment_provider() from public,anon,authenticated;
create trigger assign_assessment_provider before insert on public.assessments for each row execute function public.assign_assessment_provider();

create table public.native_attempt_notes (
  attempt_id uuid primary key references public.attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null default 0,
  flagged_questions jsonb not null default '[]',
  highlights jsonb not null default '[]'
);
alter table public.native_attempt_notes enable row level security;
create policy native_notes_owner on public.native_attempt_notes for select to authenticated using(user_id=auth.uid() and public.has_beta_access());

create table public.native_daily_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  task_ids jsonb not null,
  primary key(user_id,date)
);
alter table public.native_daily_plans enable row level security;
create policy native_plan_owner on public.native_daily_plans for select to authenticated using(user_id=auth.uid() and public.has_beta_access());

create table public.native_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null check(event in ('onboarding_started','onboarding_step_viewed','onboarding_answer_saved','onboarding_review_viewed','onboarding_completed')),
  step integer not null check(step between 0 and 5),
  entry text not null check(entry in ('forward','back','resume','review')),
  version integer not null check(version=1),
  created_at timestamptz not null default now()
);
alter table public.native_events enable row level security;
create unique index native_completion_once on public.native_events(user_id,version,event) where event='onboarding_completed';

create table public.ai_provider_leases (
  provider text primary key,
  owner uuid,
  expires_at timestamptz
);
alter table public.ai_provider_leases enable row level security;
insert into public.ai_provider_leases(provider) values('gigachat');

create function public.acquire_ai_lease(p_provider text,p_owner uuid) returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.ai_provider_leases set owner=p_owner,expires_at=now()+interval '100 seconds'
    where provider=p_provider and (owner is null or expires_at<now());
  return found;
end;
$$;
create function public.release_ai_lease(p_provider text,p_owner uuid) returns void language sql security definer set search_path=public as $$
  update public.ai_provider_leases set owner=null,expires_at=null where provider=p_provider and owner=p_owner;
$$;
revoke execute on function public.acquire_ai_lease(text,uuid),public.release_ai_lease(text,uuid) from public,anon,authenticated;
grant execute on function public.acquire_ai_lease(text,uuid),public.release_ai_lease(text,uuid) to service_role;

create table public.word_sprints (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.vocabulary_quizzes(id) on delete cascade,
  answers jsonb not null default '{}',
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.word_sprints enable row level security;
create policy word_sprint_owner on public.word_sprints for select to authenticated using(user_id=auth.uid() and public.has_beta_access());

create function public.answer_word_sprint(p_user uuid,p_id uuid,p_question text,p_answer text)
returns public.word_sprints language plpgsql security definer set search_path=public as $$
declare result public.word_sprints; quiz public.vocabulary_quizzes; correct_count integer; answered integer;
begin
  select * into result from public.word_sprints where id=p_id and user_id=p_user for update;
  if result.id is null then raise exception 'NOT_FOUND'; end if;
  if result.answers ? p_question then
    if result.answers->>p_question<>p_answer then raise exception 'REVISION_CONFLICT'; end if;
    return result;
  end if;
  if result.finished_at is not null then raise exception 'ATTEMPT_LOCKED'; end if;
  select * into quiz from public.vocabulary_quizzes where id=result.quiz_id and user_id=p_user;
  select count(*) into answered from jsonb_object_keys(result.answers);
  if quiz.questions->answered->>'id' is distinct from p_question then raise exception 'REVISION_CONFLICT'; end if;
  result.answers=result.answers||jsonb_build_object(p_question,p_answer);
  select count(*) into correct_count from jsonb_array_elements(quiz.answer_key) item
    where result.answers ? (item->>'questionId') and lower(trim(result.answers->>(item->>'questionId')))=lower(trim(item->>'expected'));
  answered=answered+1;
  update public.word_sprints set answers=result.answers,
    finished_at=case when answered>=jsonb_array_length(quiz.questions) or answered-correct_count>=3 then now() else null end
    where id=p_id returning * into result;
  return result;
end;
$$;
revoke execute on function public.answer_word_sprint(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.answer_word_sprint(uuid,uuid,text,text) to service_role;
