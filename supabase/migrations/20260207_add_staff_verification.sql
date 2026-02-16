-- Migration: Add is_staff_verified column to profiles table
-- This allows admins to manually verify medical staff roles

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_staff_verified BOOLEAN DEFAULT FALSE;

-- Optional: Update existing admins to be 'verified' (though they aren't staff by default)
-- UPDATE profiles SET is_staff_verified = TRUE WHERE role = 'admin';
