create or replace function public.create_native_attempt(p_user uuid,p_task text,p_mode text,p_model text,p_parent uuid default null)
returns public.attempts language plpgsql security definer set search_path=public as $$
declare result public.attempts;
begin
  result=public.create_attempt(p_user,p_task,p_mode,p_parent);
  if result.client<>'ios' and not exists(select 1 from public.assessments where attempt_id=result.id) then
    update public.attempts set client='ios',requested_model=p_model where id=result.id returning * into result;
  end if;
  return result;
end;
$$;

create function public.complete_native_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.completed_at is not null then
    update public.profiles set self_reported_band=case new.answers->>'startingLevel'
      when 'below_5_5' then 5 when '5_5_6_0' then 6 when '6_5_7_0' then 6.5 when '7_5_plus' then 7.5 else null end
      where id=new.user_id;
    insert into public.native_events(id,user_id,event,step,entry,version)
      values(gen_random_uuid(),new.user_id,'onboarding_completed',5,'forward',1) on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.complete_native_profile() from public,anon,authenticated;
create trigger complete_native_profile after update on public.native_profiles for each row execute function public.complete_native_profile();

create function public.create_word_sprint(p_user uuid,p_id uuid,p_quiz uuid)
returns public.word_sprints language plpgsql security definer set search_path=public as $$
declare result public.word_sprints;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  select * into result from public.word_sprints where id=p_id;
  if result.id is not null then
    delete from public.vocabulary_quizzes where id=p_quiz and user_id=p_user and id<>result.quiz_id and submitted_at is null;
    if result.user_id<>p_user then raise exception 'NOT_FOUND'; end if;
    return result;
  end if;
  if not exists(select 1 from public.vocabulary_quizzes where id=p_quiz and user_id=p_user) then raise exception 'NOT_FOUND'; end if;
  insert into public.word_sprints(id,user_id,quiz_id) values(p_id,p_user,p_quiz) returning * into result;
  return result;
end;
$$;
revoke execute on function public.create_word_sprint(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_word_sprint(uuid,uuid,uuid) to service_role;
