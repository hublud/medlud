
-- FIX MISSING FOREIGN KEYS ON APPOINTMENTS
-- Copy and paste this into the Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Add foreign key for doctor_id (links to profiles)
-- This is critical for the error: "Could not find a relationship between 'appointments' and 'profiles'"
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

ALTER TABLE appointments
ADD CONSTRAINT appointments_doctor_id_fkey
FOREIGN KEY (doctor_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- 2. Add foreign key for user_id (links to profiles/users)
-- This ensures data integrity for patients
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;

ALTER TABLE appointments
ADD CONSTRAINT appointments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Run a quick check (optional, but good for verification)
SELECT 
    conname AS constraint_name, 
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace 
WHERE n.nspname = 'public' AND conrelid::regclass::text = 'appointments';
