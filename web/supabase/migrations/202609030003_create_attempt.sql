create function public.create_attempt(p_user uuid,p_task text,p_mode text,p_parent uuid default null) returns public.attempts language plpgsql security definer set search_path=public as $$
declare existing public.attempts; parent public.attempts; content jsonb; version integer; initial_answer jsonb;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text||p_task||coalesce(p_parent::text,'')));
  if p_mode not in ('practice','strict') then raise exception 'INVALID_MODE'; end if;
  select * into existing from public.attempts where user_id=p_user and task_id=p_task and parent_attempt_id is not distinct from p_parent and status in ('in_progress','paused') order by created_at desc limit 1;
  if existing.id is not null then return existing; end if;
  initial_answer='{"text":"","reading":{},"audioIds":[]}'::jsonb;
  if p_parent is not null then
    select * into parent from public.attempts where id=p_parent and user_id=p_user and task_id=p_task and status in ('submitted','completed');
    if parent.id is null then raise exception 'NOT_FOUND'; end if;
    content=parent.task_snapshot;
    version=parent.task_version;
    if content->>'skill'='writing' then initial_answer=jsonb_set(initial_answer,'{text}',parent.answer->'text'); end if;
  else
    select t.current_version,v.content into version,content from public.tasks t join public.task_versions v on v.task_id=t.id and v.version=t.current_version where t.id=p_task and t.published=true;
    if content is null then raise exception 'NOT_FOUND'; end if;
  end if;
  insert into public.attempts(user_id,task_id,task_version,task_snapshot,mode,answer,parent_attempt_id,deadline_at)
  values(p_user,p_task,version,content,p_mode,initial_answer,p_parent,case when p_mode='strict' then now()+make_interval(secs=>(content->>'durationSeconds')::integer) else null end) returning * into existing;
  return existing;
end;
$$;
revoke execute on function public.create_attempt(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.create_attempt(uuid,text,text,uuid) to service_role;
