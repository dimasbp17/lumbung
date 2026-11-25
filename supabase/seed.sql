-- =============================================================================
-- Seed for local development (`supabase db reset`).
-- Only creates a demo account so you can sign in right away:
--   email    : demo@lumbung.test
--   password : lumbung123
-- Trigger on_auth_user_created automatically prepares members, "Dompet Tunai",
-- default categories, and settings — without transactions.
-- =============================================================================

do $$
declare
  v_user uuid := '00000000-0000-4000-8000-000000000001';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user, 'authenticated', 'authenticated',
    'demo@lumbung.test', extensions.crypt('lumbung123', extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user, v_user::text, 'email',
    jsonb_build_object('sub', v_user::text, 'email', 'demo@lumbung.test', 'email_verified', true),
    now(), now(), now()
  );
end;
$$;
