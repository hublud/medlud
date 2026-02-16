-- Create user-specific notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'SYSTEM', -- 'APPOINTMENT', 'TELEMEDICINE', 'SYSTEM', 'PRESCRIPTION'
    is_read boolean DEFAULT false,
    action_url text,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz
);

-- Index for fetching a user's notifications quickly
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
