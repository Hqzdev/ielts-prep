create function public.grant_google_access() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set beta_access = true
  where id = new.user_id and not beta_access;
  return new;
end;
$$;

revoke execute on function public.grant_google_access() from public, anon, authenticated;

create trigger grant_google_user_access
after insert or update on auth.identities
for each row when (new.provider = 'google')
execute function public.grant_google_access();

update public.profiles p set beta_access = true
where not p.beta_access and exists (
  select 1 from auth.identities i
  where i.user_id = p.id and i.provider = 'google'
);
