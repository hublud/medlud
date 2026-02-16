
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function generateFix() {
    console.log('Detected issue: Patients cannot view Doctor profiles due to RLS.');
    console.log('\nPlease run the following SQL in your Supabase SQL Editor to fix the "Medical Staff" name issue:\n');

    console.log(`
-- Allow any authenticated user to read profile names and roles
-- This is necessary specific assignment details (e.g. "Dr. James")

-- 1. Enable RLS on profiles (if not already)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to view profiles
-- Note: You might want to restrict columns in the API if sensitive data exists, 
-- but RLS usually applies to rows.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Alternatively, if you want to be stricter and only allow viewing staff:
-- CREATE POLICY "Users can view staff profiles"
-- ON profiles FOR SELECT
-- TO authenticated
-- USING (role IN ('doctor', 'nurse', 'mental-health', 'nurse-assistant') OR auth.uid() = id);
`);
}

generateFix();
