drop function public.accept_invitation(text, integer);

create function public.redeem_invitation(p_user uuid, p_token_hash text, p_limit integer) returns boolean language plpgsql security definer set search_path=public as $$
declare
  invitation public.invitations;
  user_email text;
  verified boolean;
begin
  perform pg_advisory_xact_lock(9103001);
  select email, email_confirmed_at is not null into user_email, verified from auth.users where id=p_user;
  if user_email is null or not verified then raise exception 'EMAIL_NOT_VERIFIED'; end if;
  select * into invitation from public.invitations where token_hash=p_token_hash for update;
  if invitation.id is null then raise exception 'INVALID_INVITATION'; end if;
  if invitation.accepted_by=p_user then return true; end if;
  if invitation.expires_at<now() or invitation.accepted_at is not null or lower(invitation.email)<>lower(user_email) then raise exception 'INVALID_INVITATION'; end if;
  if not exists(select 1 from public.profiles where id=p_user and beta_access) and (select count(*) from public.profiles where beta_access)>=greatest(p_limit,0) then raise exception 'BETA_FULL'; end if;
  update public.profiles set beta_access=true where id=p_user;
  update public.invitations set accepted_by=p_user,accepted_at=now() where id=invitation.id;
  return true;
end;
$$;

revoke execute on function public.redeem_invitation(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.redeem_invitation(uuid,text,integer) to service_role;
