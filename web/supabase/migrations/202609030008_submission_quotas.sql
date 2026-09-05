create or replace function public.submit_attempt(p_user uuid,p_id uuid,p_available boolean,p_daily_limit integer default 5) returns public.assessments language plpgsql security definer set search_path=public as $$
declare a public.attempts; result public.assessments; reading_task boolean; unavailable_reason text;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text));
  select * into a from public.attempts where id=p_id and user_id=p_user for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into result from public.assessments where attempt_id=p_id;
  if result.id is not null then return result; end if;
  reading_task=a.task_snapshot->>'skill'='reading';
  if not reading_task and p_available then
    if exists(select 1 from public.assessments where user_id=p_user and status in ('queued','processing')) then p_available=false; unavailable_reason='ASSESSMENT_ACTIVE'; end if;
    if (select count(*) from public.usage_events where user_id=p_user and kind='assessment' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=p_daily_limit then p_available=false; unavailable_reason='DAILY_LIMIT'; end if;
    if p_available then insert into public.usage_events(user_id,kind,reference_id) values(p_user,'assessment',p_id::text); end if;
  end if;
  update public.attempts set status='submitted',submitted_at=case when mode='strict' then least(now(),deadline_at) else now() end,
    elapsed_seconds=case when mode='strict' then greatest(0,extract(epoch from least(now(),deadline_at)-started_at)::integer)
    else elapsed_seconds+case when active_since is not null then greatest(0,extract(epoch from now()-active_since)::integer) else 0 end end,
    active_since=null,updated_at=now() where id=p_id;
  insert into public.assessments(attempt_id,user_id,status,error_code) values(p_id,p_user,case when reading_task or p_available then 'queued' else 'unavailable' end,unavailable_reason) returning * into result;
  if not reading_task and p_available then insert into public.assessment_jobs(assessment_id) values(result.id); end if;
  return result;
end;
$$;

