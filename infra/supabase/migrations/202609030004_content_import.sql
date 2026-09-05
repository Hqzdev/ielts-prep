create function public.import_task(p_content jsonb,p_answers jsonb,p_hash text) returns text language plpgsql security definer set search_path=public as $$
declare task_id text=p_content->>'id'; current_task public.tasks; current_hash text; next_version integer; result text;
begin
  perform pg_advisory_xact_lock(hashtext(task_id));
  select * into current_task from public.tasks where id=task_id;
  if current_task.id is null then
    insert into public.tasks(id,skill,current_version,published) values(task_id,p_content->>'skill',1,false);
    next_version=1;result='created';
  else
    select content_hash into current_hash from public.task_versions v where v.task_id=current_task.id and v.version=current_task.current_version;
    if current_hash=p_hash then return 'unchanged'; end if;
    next_version=current_task.current_version+1;result='updated';
  end if;
  insert into public.task_versions(task_id,version,content,content_hash) values(task_id,next_version,jsonb_set(p_content,'{version}',to_jsonb(next_version)),p_hash);
  if p_content->>'skill'='reading' then insert into public.reading_keys(task_id,version,answers) values(task_id,next_version,p_answers); end if;
  update public.tasks set current_version=next_version,published=true where id=task_id;
  return result;
end;
$$;
revoke execute on function public.import_task(jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.import_task(jsonb,jsonb,text) to service_role;
