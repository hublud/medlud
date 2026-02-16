-- Create health_tips table
CREATE TABLE IF NOT EXISTS health_tips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    icon_name text NOT NULL DEFAULT 'Apple',
    bg_color text NOT NULL DEFAULT 'bg-blue-500',
    text_color text NOT NULL DEFAULT 'text-blue-50',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE health_tips ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything
CREATE POLICY "Admins can manage health tips"
ON health_tips
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Everyone can read
CREATE POLICY "Everyone can read health tips"
ON health_tips
FOR SELECT
TO authenticated
USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_tips_created_at ON health_tips(created_at DESC);
