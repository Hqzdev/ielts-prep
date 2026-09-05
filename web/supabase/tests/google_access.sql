begin;

do $$
declare
  google_user uuid := gen_random_uuid();
  email_user uuid := gen_random_uuid();
begin
  if exists (
    select 1 from public.profiles p
    join auth.identities i on i.user_id = p.id
    where i.provider = 'google' and not p.beta_access
  ) then
    raise exception 'Existing Google users must have access';
  end if;

  insert into auth.users (id, email, raw_user_meta_data) values
    (google_user, google_user || '@example.test', '{}'::jsonb),
    (email_user, email_user || '@example.test', '{"provider":"google","providers":["google"]}'::jsonb);

  insert into auth.identities (user_id, provider_id, provider, identity_data) values
    (google_user, google_user::text, 'google', jsonb_build_object('sub', google_user)),
    (email_user, email_user::text, 'email', jsonb_build_object('sub', email_user));

  if not exists (
    select 1 from public.profiles
    where id = google_user and beta_access and role = 'student' and not onboarded
  ) then
    raise exception 'New Google users must receive student access before onboarding';
  end if;

  if exists (select 1 from public.profiles where id = email_user and beta_access) then
    raise exception 'User metadata must not grant Google access';
  end if;

  perform set_config('request.jwt.claim.sub', google_user::text, true);
  set local role authenticated;

  if not public.has_beta_access() then
    raise exception 'Google users must pass the database access check';
  end if;

  if exists (select 1 from public.profiles where id = email_user) then
    raise exception 'Google users must not read other profiles';
  end if;

  reset role;

  insert into auth.identities (user_id, provider_id, provider, identity_data)
  values (email_user, email_user::text, 'google', jsonb_build_object('sub', email_user));

  if not exists (select 1 from public.profiles where id = email_user and beta_access) then
    raise exception 'Linking Google to an existing account must grant access';
  end if;

  if has_function_privilege('authenticated', 'public.grant_google_access()', 'EXECUTE')
    or has_table_privilege('authenticated', 'auth.identities', 'INSERT') then
    raise exception 'Users must not be able to grant themselves access';
  end if;
end;
$$;

rollback;
