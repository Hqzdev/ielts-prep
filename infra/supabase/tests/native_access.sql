begin;

do $$
declare
  learner uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  task_id text;
  attempt public.attempts;
  again public.attempts;
  profile public.native_profiles;
  lease_one uuid := gen_random_uuid();
  lease_two uuid := gen_random_uuid();
  answers jsonb := '{"startingLevel":"unknown","targetBand":7,"examStatus":"not_booked","examDate":null,"focus":["reading"],"barrier":"private"}';
begin
  insert into auth.users(id,email) values(learner,learner||'@example.test'),(stranger,stranger||'@example.test');
  if exists(select 1 from public.profiles where id=learner and beta_access) then raise exception 'Unverified email received access'; end if;
  update auth.users set email_confirmed_at=now() where id in (learner,stranger);
  if not exists(select 1 from public.profiles where id=learner and beta_access and daily_minutes=10) then raise exception 'Verified learner defaults are incorrect'; end if;
  profile=public.save_native_onboarding(learner,0,5,answers,true);
  profile=public.save_native_onboarding(learner,0,5,answers,true);
  if profile.revision<>1 then raise exception 'Duplicate onboarding completion changed revision'; end if;
  if (select count(*) from public.native_events where user_id=learner and event='onboarding_completed')<>1 then raise exception 'Completion event was not recorded exactly once'; end if;
  if (select self_reported_band from public.profiles where id=learner) is not null then raise exception 'Unknown level invented a score'; end if;
  select id into task_id from public.tasks where skill='writing' and published limit 1;
  attempt=public.create_native_attempt(learner,task_id,'practice','model-one');
  again=public.create_native_attempt(learner,task_id,'practice','model-two');
  if attempt.id<>again.id or again.requested_model<>'model-one' then raise exception 'Existing attempt changed requested model'; end if;
  insert into public.native_attempt_notes(attempt_id,user_id) values(attempt.id,learner);
  perform public.save_native_onboarding(stranger,0,0,'{"startingLevel":null,"targetBand":null,"examStatus":"unanswered","examDate":null,"focus":[],"barrier":null}',false);

  perform set_config('request.jwt.claim.sub', learner::text, true);
  set local role authenticated;
  if (select count(*) from public.native_profiles)<>1 then raise exception 'Native profiles RLS leaked another user'; end if;
  if exists(select 1 from public.native_events) then raise exception 'Analytics leaked to the client'; end if;
  if has_function_privilege('authenticated','public.create_native_attempt(uuid,text,text,text,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.acquire_ai_lease(text,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.answer_word_sprint(uuid,uuid,text,text)','EXECUTE') then
    raise exception 'Client can mutate server-owned state directly';
  end if;
  reset role;

  if public.normalize_sprint_answer('  Ｓｔｕｄｅｎｔ’ｓ   book ')<>concat('student',chr(39),'s book') then raise exception 'Sprint normalization differs from vocabulary rules'; end if;

  update public.ai_provider_leases set owner=null,expires_at=null where provider='gigachat';
  if not public.acquire_ai_lease('gigachat',lease_one) then raise exception 'Could not acquire free provider'; end if;
  if public.acquire_ai_lease('gigachat',lease_two) then raise exception 'Provider concurrency exceeded'; end if;
  perform public.release_ai_lease('gigachat',lease_two);
  if public.acquire_ai_lease('gigachat',lease_two) then raise exception 'Another owner released the lease'; end if;
  perform public.release_ai_lease('gigachat',lease_one);
  if not public.acquire_ai_lease('gigachat',lease_two) then raise exception 'Provider lease was not released'; end if;
end;
$$;

rollback;
