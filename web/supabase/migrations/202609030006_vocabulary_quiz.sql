create function public.finish_vocabulary_quiz(p_user uuid,p_id uuid,p_result jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare quiz public.vocabulary_quizzes; answer jsonb;
begin
  select * into quiz from public.vocabulary_quizzes where id=p_id and user_id=p_user for update;
  if quiz.id is null then raise exception 'NOT_FOUND'; end if;
  if quiz.submitted_at is not null then return quiz.result; end if;
  for answer in select * from jsonb_array_elements(p_result) loop
    insert into public.vocabulary_results(user_id,word_id,session_id,question_type,correct) values(p_user,answer->>'wordId',p_id,answer->>'type',(answer->>'correct')::boolean);
  end loop;
  update public.vocabulary_quizzes set result=p_result,submitted_at=now() where id=p_id;
  return p_result;
end;
$$;
revoke execute on function public.finish_vocabulary_quiz(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finish_vocabulary_quiz(uuid,uuid,jsonb) to service_role;
