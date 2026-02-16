-- Migration: Admin Dashboard Live Data Support
-- 1. Add is_maternal column to profiles to track maternal setup completion
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_maternal BOOLEAN DEFAULT FALSE;

-- 2. Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    symptoms TEXT,
    duration TEXT,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESPONDED', 'COMPLETED')),
    medication_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on appointments (Optional, but recommended)
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Admins can view all appointments" ON appointments FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
