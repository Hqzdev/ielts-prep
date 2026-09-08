create function public.normalize_sprint_answer(value text)
returns text language sql immutable strict set search_path=public as $$
  select lower(trim(regexp_replace(replace(replace(normalize(value,NFKC),'’',chr(39)),'‘',chr(39)),'[[:space:]]+',' ','g')));
$$;

create or replace function public.answer_word_sprint(p_user uuid,p_id uuid,p_question text,p_answer text)
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
    where result.answers ? (item->>'questionId') and public.normalize_sprint_answer(result.answers->>(item->>'questionId'))=public.normalize_sprint_answer(item->>'expected');
  answered=answered+1;
  update public.word_sprints set answers=result.answers,
    finished_at=case when answered>=jsonb_array_length(quiz.questions) or answered-correct_count>=3 then now() else null end
    where id=p_id returning * into result;
  return result;
end;
$$;

revoke execute on function public.normalize_sprint_answer(text) from public,anon,authenticated;
grant execute on function public.normalize_sprint_answer(text) to service_role;
