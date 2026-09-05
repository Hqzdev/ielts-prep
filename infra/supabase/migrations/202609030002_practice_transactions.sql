create function public.save_attempt(p_user uuid,p_id uuid,p_revision integer,p_answer jsonb,p_pause boolean default false,p_resume boolean default false) returns public.attempts language plpgsql security definer set search_path=public as $$
declare a public.attempts;
begin
  select * into a from public.attempts where id=p_id and user_id=p_user for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if a.status not in ('in_progress','paused') then raise exception 'ATTEMPT_LOCKED'; end if;
  if a.mode='strict' and a.deadline_at<=now() then raise exception 'DEADLINE_EXPIRED'; end if;
  if a.revision<>p_revision then raise exception 'REVISION_CONFLICT'; end if;
  if a.mode='strict' and (p_pause or p_resume) then raise exception 'STRICT_PAUSE'; end if;
  update public.attempts set
    answer=p_answer,
    revision=revision+1,
    elapsed_seconds=elapsed_seconds+case when p_pause and active_since is not null then greatest(0,extract(epoch from now()-active_since)::integer) else 0 end,
    active_since=case when p_pause then null when p_resume then now() else active_since end,
    status=case when p_pause then 'paused' when p_resume then 'in_progress' else status end,
    updated_at=now()
    where id=p_id returning * into a;
  return a;
end;
$$;

create function public.submit_attempt(p_user uuid,p_id uuid,p_available boolean,p_daily_limit integer default 5) returns public.assessments language plpgsql security definer set search_path=public as $$
declare a public.attempts; result public.assessments; reading_task boolean;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text));
  select * into a from public.attempts where id=p_id and user_id=p_user for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into result from public.assessments where attempt_id=p_id;
  if result.id is not null then return result; end if;
  reading_task=a.task_snapshot->>'skill'='reading';
  if not reading_task and p_available then
    if exists(select 1 from public.assessments where user_id=p_user and status in ('queued','processing')) then raise exception 'ASSESSMENT_ACTIVE'; end if;
    if (select count(*) from public.usage_events where user_id=p_user and kind='assessment' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=p_daily_limit then raise exception 'DAILY_LIMIT'; end if;
    insert into public.usage_events(user_id,kind,reference_id) values(p_user,'assessment',p_id::text);
  end if;
  update public.attempts set status='submitted',submitted_at=case when mode='strict' then least(now(),deadline_at) else now() end,
    elapsed_seconds=case when mode='strict' then greatest(0,extract(epoch from least(now(),deadline_at)-started_at)::integer)
    else elapsed_seconds+case when active_since is not null then greatest(0,extract(epoch from now()-active_since)::integer) else 0 end end,
    active_since=null,updated_at=now() where id=p_id;
  insert into public.assessments(attempt_id,user_id,status) values(p_id,p_user,case when reading_task or p_available then 'queued' else 'unavailable' end) returning * into result;
  if not reading_task and p_available then insert into public.assessment_jobs(assessment_id) values(result.id); end if;
  return result;
end;
$$;

create function public.retry_assessment(p_user uuid,p_attempt uuid,p_daily_limit integer default 5) returns public.assessments language plpgsql security definer set search_path=public as $$
declare result public.assessments;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text));
  select * into result from public.assessments where attempt_id=p_attempt and user_id=p_user for update;
  if result.id is null then raise exception 'NOT_FOUND'; end if;
  if result.status in ('ready','insufficient_evidence','queued','processing') then return result; end if;
  if exists(select 1 from public.assessments where user_id=p_user and status in ('queued','processing')) then raise exception 'ASSESSMENT_ACTIVE'; end if;
  if (select count(*) from public.usage_events where user_id=p_user and kind='assessment' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=p_daily_limit then raise exception 'DAILY_LIMIT'; end if;
  insert into public.usage_events(user_id,kind,reference_id) values(p_user,'assessment',p_attempt::text);
  update public.assessments set status='queued',error_code=null,completed_at=null where id=result.id returning * into result;
  insert into public.assessment_jobs(assessment_id) values(result.id) on conflict(assessment_id) do update set state='pending',tries=0,leased_until=null,workflow_run_id=null,updated_at=now();
  return result;
end;
$$;

create function public.reserve_usage(p_user uuid,p_kind text,p_limit integer,p_reference text) returns boolean language plpgsql security definer set search_path=public as $$
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text));
  if (select count(*) from public.usage_events where user_id=p_user and kind=p_kind and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=p_limit then raise exception 'DAILY_LIMIT'; end if;
  insert into public.usage_events(user_id,kind,reference_id) values(p_user,p_kind,p_reference);
  return true;
end;
$$;

create function public.claim_assessment_jobs() returns setof public.assessment_jobs language sql security definer set search_path=public as $$
  update public.assessment_jobs set leased_until=now()+interval '2 minutes',updated_at=now()
  where id in (select id from public.assessment_jobs where state='pending' and (leased_until is null or leased_until<now()) order by created_at for update skip locked limit 10)
  returning *;
$$;

revoke execute on function public.save_attempt(uuid,uuid,integer,jsonb,boolean,boolean) from public,anon,authenticated;
revoke execute on function public.submit_attempt(uuid,uuid,boolean,integer) from public,anon,authenticated;
revoke execute on function public.retry_assessment(uuid,uuid,integer) from public,anon,authenticated;
revoke execute on function public.reserve_usage(uuid,text,integer,text) from public,anon,authenticated;
revoke execute on function public.claim_assessment_jobs() from public,anon,authenticated;
grant execute on function public.save_attempt(uuid,uuid,integer,jsonb,boolean,boolean) to service_role;
grant execute on function public.submit_attempt(uuid,uuid,boolean,integer) to service_role;
grant execute on function public.retry_assessment(uuid,uuid,integer) to service_role;
grant execute on function public.reserve_usage(uuid,text,integer,text) to service_role;
grant execute on function public.claim_assessment_jobs() to service_role;
