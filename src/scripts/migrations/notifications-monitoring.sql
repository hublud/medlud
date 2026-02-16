-- Create notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL, -- 'appointment', 'user', 'system', 'alert'
    title text NOT NULL,
    message text NOT NULL,
    severity text DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    is_read boolean DEFAULT false,
    action_url text,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz
);

-- Create system activity log
CREATE TABLE IF NOT EXISTS system_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type text NOT NULL, -- 'login', 'appointment', 'user_action', 'system'
    user_id uuid REFERENCES profiles(id),
    description text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create system health metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type text NOT NULL, -- 'database', 'api', 'storage'
    metric_name text NOT NULL,
    metric_value numeric,
    status text DEFAULT 'healthy', -- 'healthy', 'warning', 'critical'
    created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_system_activity_created_at ON system_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_activity_user_id ON system_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_created_at ON system_health_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_type ON system_health_metrics(metric_type);
