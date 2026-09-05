create table public.learning_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  timezone text not null,
  source_kind text not null check (source_kind in ('practice', 'vocabulary', 'arcade', 'conversation')),
  source_id uuid not null,
  earned_at timestamptz not null,
  primary key (user_id, activity_date)
);

create table public.arcade_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('challenge', 'survival', 'runner')),
  target_seconds integer not null check (target_seconds in (30, 60)),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  elapsed_seconds numeric not null default 0 check (elapsed_seconds between 0 and 61),
  speech_seconds numeric not null default 0 check (speech_seconds between 0 and 61),
  answers integer not null default 0 check (answers between 0 and 8),
  completed boolean not null default false
);

alter table public.learning_days enable row level security;
alter table public.arcade_rounds enable row level security;
revoke all on public.learning_days, public.arcade_rounds from anon, authenticated;
grant select on public.learning_days, public.arcade_rounds to authenticated;
grant all on public.learning_days, public.arcade_rounds to service_role;
create policy learning_days_owner on public.learning_days for select to authenticated using (user_id = auth.uid());
create policy arcade_rounds_owner on public.arcade_rounds for select to authenticated using (user_id = auth.uid());

create function public.learning_timezone(p_user uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select z.name from public.profiles p join pg_timezone_names z on z.name = p.timezone where p.id = p_user), 'UTC');
$$;

create function public.learning_attempt_has_answer(p_attempt public.attempts) returns boolean
language sql stable set search_path = public as $$
  select btrim(coalesce(p_attempt.answer->>'text', '')) <> ''
    or exists (
      select 1 from jsonb_each(coalesce(p_attempt.answer->'reading', '{}'::jsonb)) r
      cross join lateral jsonb_array_elements_text(case jsonb_typeof(r.value) when 'array' then r.value else jsonb_build_array(r.value) end) choice(value)
      where btrim(choice.value) <> ''
    )
    or exists (
      select 1 from public.audio_assets a
      where a.user_id = p_attempt.user_id and a.attempt_id = p_attempt.id
        and a.state = 'ready' and a.duration > 0
        and coalesce(p_attempt.answer->'audioIds', '[]'::jsonb) ? a.id::text
    );
$$;

create function public.record_learning_day(p_user uuid, p_at timestamptz, p_kind text, p_source uuid) returns void
language plpgsql security definer set search_path = public as $$
declare zone text := public.learning_timezone(p_user);
begin
  if p_at is null or p_at > now() then return; end if;
  insert into public.learning_days (user_id, activity_date, timezone, source_kind, source_id, earned_at)
  values (p_user, (p_at at time zone zone)::date, zone, p_kind, p_source, p_at)
  on conflict (user_id, activity_date) do nothing;
end;
$$;

create function public.capture_learning_day() returns trigger
language plpgsql security definer set search_path = public as $$
declare zone text; day date;
begin
  case tg_table_name
    when 'attempts' then
      if new.status in ('submitted', 'completed') and public.learning_attempt_has_answer(new) then
        perform public.record_learning_day(new.user_id, new.submitted_at, 'practice', new.id);
      end if;
    when 'vocabulary_quizzes' then
      if new.submitted_at is not null and exists (
        select 1 from jsonb_array_elements(new.result) answer where btrim(coalesce(answer->>'given', '')) <> ''
      ) then
        perform public.record_learning_day(new.user_id, new.submitted_at, 'vocabulary', new.id);
      end if;
    when 'arcade_sessions' then
      if new.completed and new.speech_seconds > 0 then
        perform public.record_learning_day(new.user_id, new.finished_at, 'arcade', new.id);
      end if;
    when 'arcade_rounds' then
      if new.completed then
        perform public.record_learning_day(new.user_id, new.finished_at, 'arcade', new.id);
      end if;
    when 'chat_messages' then
      if new.role <> 'user' or new.status <> 'complete' or btrim(new.content) = '' then return new; end if;
      perform pg_advisory_xact_lock(hashtext('learning:' || new.thread_id::text));
      zone := public.learning_timezone(new.user_id);
      day := (new.created_at at time zone zone)::date;
      if (
        select count(*) from public.chat_messages m
        where m.user_id = new.user_id and m.thread_id = new.thread_id
          and m.role = 'user' and m.status = 'complete' and btrim(m.content) <> ''
          and m.created_at >= day::timestamp at time zone zone
          and m.created_at < (day + 1)::timestamp at time zone zone
      ) >= 3 then
        perform public.record_learning_day(new.user_id, new.created_at, 'conversation', new.thread_id);
      end if;
  end case;
  return new;
end;
$$;

create trigger capture_practice_day after insert or update on public.attempts for each row execute function public.capture_learning_day();
create trigger capture_vocabulary_day after insert or update on public.vocabulary_quizzes for each row execute function public.capture_learning_day();
create trigger capture_legacy_arcade_day after insert or update on public.arcade_sessions for each row execute function public.capture_learning_day();
create trigger capture_arcade_day after insert or update on public.arcade_rounds for each row execute function public.capture_learning_day();
create trigger capture_conversation_day after insert or update on public.chat_messages for each row execute function public.capture_learning_day();
create index chat_learning_day on public.chat_messages (user_id, thread_id, created_at) where role = 'user' and status = 'complete';

revoke execute on function public.learning_timezone(uuid), public.learning_attempt_has_answer(public.attempts), public.record_learning_day(uuid,timestamptz,text,uuid), public.capture_learning_day() from public, anon, authenticated;

with events as (
  select a.user_id, a.submitted_at as earned_at, 'practice' as source_kind, a.id as source_id
  from public.attempts a where a.status in ('submitted', 'completed') and a.submitted_at is not null and public.learning_attempt_has_answer(a)
  union all
  select q.user_id, q.submitted_at, 'vocabulary', q.id from public.vocabulary_quizzes q
  where q.submitted_at is not null and exists (select 1 from jsonb_array_elements(q.result) answer where btrim(coalesce(answer->>'given', '')) <> '')
  union all
  select a.user_id, a.finished_at, 'arcade', a.id from public.arcade_sessions a where a.completed and a.speech_seconds > 0 and a.finished_at is not null
  union all
  select m.user_id, (array_agg(m.created_at order by m.created_at, m.id))[3], 'conversation', m.thread_id
  from public.chat_messages m where m.role = 'user' and m.status = 'complete' and btrim(m.content) <> ''
  group by m.user_id, m.thread_id, (m.created_at at time zone public.learning_timezone(m.user_id))::date having count(*) >= 3
), dated as (
  select *, public.learning_timezone(user_id) as zone from events where earned_at <= now()
)
insert into public.learning_days (user_id, activity_date, timezone, source_kind, source_id, earned_at)
select distinct on (user_id, (earned_at at time zone zone)::date)
  user_id, (earned_at at time zone zone)::date, zone, source_kind, source_id, earned_at
from dated order by user_id, (earned_at at time zone zone)::date, earned_at
on conflict (user_id, activity_date) do nothing;
