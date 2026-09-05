begin;

do $$
declare
  learner uuid := gen_random_uuid();
  other_learner uuid := gen_random_uuid();
  attempt_id uuid := gen_random_uuid();
  quiz_id uuid := gen_random_uuid();
  thread_id uuid := gen_random_uuid();
  message_id uuid := gen_random_uuid();
  task public.task_versions;
begin
  insert into auth.users (id, email) values (learner, learner || '@example.test'), (other_learner, other_learner || '@example.test');
  update public.profiles set timezone = 'Asia/Yekaterinburg' where id = learner;
  perform public.record_learning_day(learner, '2026-01-05T23:30:00Z', 'practice', attempt_id);
  perform public.record_learning_day(learner, '2026-01-06T01:00:00Z', 'vocabulary', quiz_id);
  perform public.record_learning_day(learner, now() + interval '1 day', 'practice', attempt_id);
  if (select count(*) from public.learning_days where user_id = learner) <> 1
    or not exists (select 1 from public.learning_days where user_id = learner and activity_date = '2026-01-06') then
    raise exception 'Local dates, deduplication or future-date protection failed';
  end if;
  delete from public.learning_days where user_id = learner;

  select * into task from public.task_versions limit 1;
  insert into public.attempts (id, user_id, task_id, task_version, task_snapshot, mode, status, answer, submitted_at)
  values (attempt_id, learner, task.task_id, task.version, task.content, 'practice', 'submitted', '{"text":" ","reading":{"1":[""]},"audioIds":[]}', now());
  if exists(select 1 from public.learning_days where user_id = learner) then raise exception 'Empty submissions must not earn flames'; end if;
  update public.attempts set answer = '{"text":"","reading":{"1":"TRUE"},"audioIds":[]}' where id = attempt_id;
  update public.attempts set status = 'completed' where id = attempt_id;
  if (select count(*) from public.learning_days where user_id = learner) <> 1 then raise exception 'Practice submission must earn exactly one flame'; end if;
  delete from public.learning_days where user_id = learner;

  insert into public.vocabulary_quizzes (id, user_id, questions, answer_key, result, submitted_at)
  values (quiz_id, learner, '[]', '[]', '[{"given":""}]', now());
  if exists(select 1 from public.learning_days where user_id = learner) then raise exception 'Empty vocabulary submissions must not earn flames'; end if;
  update public.vocabulary_quizzes set result = '[{"given":"practice"}]' where id = quiz_id;
  if not exists(select 1 from public.learning_days where user_id = learner and source_kind = 'vocabulary') then raise exception 'Vocabulary completion was not counted'; end if;
  delete from public.learning_days where user_id = learner;

  insert into public.chat_threads (id, user_id, title) values (thread_id, learner, 'Daily speaking test');
  insert into public.chat_messages (user_id, thread_id, role, content, created_at) values
    (learner, thread_id, 'assistant', 'Welcome', now()),
    (learner, thread_id, 'user', ' ', now()),
    (learner, thread_id, 'user', 'I enjoy learning English.', now()),
    (learner, thread_id, 'user', 'I practise each morning.', now());
  if exists(select 1 from public.learning_days where user_id = learner) then raise exception 'Three nonempty learner replies are required'; end if;
  insert into public.chat_messages (id, user_id, thread_id, role, content) values (message_id, learner, thread_id, 'user', 'My goal is a higher IELTS score.');
  update public.chat_messages set status = 'complete' where id = message_id;
  if (select count(*) from public.learning_days where user_id = learner) <> 1 then raise exception 'Conversation completion or retry deduplication failed'; end if;
  delete from public.learning_days where user_id = learner;
  insert into public.chat_messages (user_id, thread_id, role, content, created_at) values (learner, thread_id, 'user', 'One reply on another day.', now() - interval '2 days');
  if exists(select 1 from public.learning_days where user_id = learner) then raise exception 'Replies on different days must not combine'; end if;

  insert into public.arcade_rounds (user_id, game, target_seconds, completed, finished_at) values (learner, 'runner', 30, false, now());
  if exists(select 1 from public.learning_days where user_id = learner) then raise exception 'Incomplete rounds must not earn flames'; end if;
  insert into public.arcade_rounds (user_id, game, target_seconds, answers, completed, finished_at) values (learner, 'runner', 30, 8, true, now());
  if not exists(select 1 from public.learning_days where user_id = learner and source_kind = 'arcade') then raise exception 'Full Arcade round was not counted'; end if;

  perform public.record_learning_day(other_learner, now(), 'practice', gen_random_uuid());
  perform set_config('request.jwt.claim.sub', learner::text, true);
  set local role authenticated;
  if exists(select 1 from public.learning_days where user_id = other_learner) then raise exception 'Learning days must be private'; end if;
  if has_table_privilege('authenticated', 'public.learning_days', 'INSERT')
    or has_function_privilege('authenticated', 'public.record_learning_day(uuid,timestamptz,text,uuid)', 'EXECUTE') then
    raise exception 'Learners must not grant themselves flames';
  end if;
  reset role;
end;
$$;

rollback;
