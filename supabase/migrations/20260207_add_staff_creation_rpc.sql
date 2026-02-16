-- Migration: Secure Staff Creation RPC
-- This allows admins to create a user and their profile in one step
-- Using SECURITY DEFINER to bypass standard RLS for administrative tasks

CREATE OR REPLACE FUNCTION create_staff_user(
  staff_email TEXT,
  staff_password TEXT,
  staff_full_name TEXT,
  staff_role TEXT,
  staff_phone TEXT DEFAULT NULL
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
  -- 1. Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can create staff users';
  END IF;

  -- 2. Create the user in auth.users
  -- Warning: This uses the internal auth.users table directly, which is generally discouraged 
  -- in favor of the Management API, but since we are in a limited environment, 
  -- we use the SQL approach for demo-ability.
  
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
    staff_email,
    crypt(staff_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    format('{"full_name": "%s"}', staff_full_name)::jsonb,
    FALSE,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- 3. Create the profile row
  -- Usually, a trigger handles this, but we force it here to be sure it matches immediately
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    phone,
    is_staff_verified,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    staff_email,
    staff_full_name,
    staff_role,
    staff_phone,
    TRUE, -- Admin-created staff are pre-verified
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = staff_role,
    is_staff_verified = TRUE,
    full_name = staff_full_name;

  result := jsonb_build_object(
    'success', true,
    'user_id', new_user_id
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
