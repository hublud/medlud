-- Migration: Advanced Admin User Controls
-- Provides RPCs for creating, updating role, and resetting passwords

-- 1. Generic Admin Create User RPC
CREATE OR REPLACE FUNCTION admin_create_user(
  target_email TEXT,
  target_password TEXT,
  target_full_name TEXT,
  target_role TEXT,
  target_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_user_id UUID;
  result JSONB;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can create users';
  END IF;

  -- Create the user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    target_email,
    crypt(target_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    format('{"full_name": "%s"}', target_full_name)::jsonb,
    FALSE,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Create the profile row
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    target_email,
    target_full_name,
    target_role,
    target_phone,
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object('success', true, 'user_id', new_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Admin Update User RPC (Role and Password)
CREATE OR REPLACE FUNCTION admin_update_user(
  target_user_id UUID,
  new_role TEXT DEFAULT NULL,
  new_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can update users';
  END IF;

  -- Update auth.users if password is provided
  IF new_password IS NOT NULL THEN
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = target_user_id;
  END IF;

  -- Update public.profiles if role is provided
  IF new_role IS NOT NULL THEN
    UPDATE public.profiles
    SET role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
