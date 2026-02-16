
-- COMPREHENSIVE RLS FIX FOR APPOINTMENTS
-- Copy and paste this into the Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Enable RLS on the appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can update appointments" ON appointments;

-- 3. Policy: Allow staff (admin, doctor, nurse, etc.) to view all appointments
CREATE POLICY "Staff can view all appointments" ON appointments
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN 
  ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant')
);

-- 4. Policy: Allow patients to view only their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 5. Policy: Allow patients to create their own appointments
CREATE POLICY "Users can create appointments" ON appointments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 6. Policy: Allow staff to update appointments (e.g., set status to Responded)
CREATE POLICY "Staff can update appointments" ON appointments
FOR UPDATE TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN 
  ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant')
);

-- Note: Ensure you have a 'profiles' table and the role in auth.jwt() matches your app's roles.
