-- Add admin_role column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS admin_role text CHECK (admin_role IN ('super_admin', 'manager', 'viewer'));

-- Set default admin_role for existing admins
UPDATE profiles 
SET admin_role = 'super_admin' 
WHERE role = 'admin' AND admin_role IS NULL;

-- Create user_activity table for engagement metrics
CREATE TABLE IF NOT EXISTS user_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    action text NOT NULL,
    feature text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
