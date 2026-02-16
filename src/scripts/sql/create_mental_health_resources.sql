-- Mental Health Resources Migration (Safe to run multiple times)
-- This script is idempotent - you can run it multiple times without errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active coping techniques" ON coping_techniques;
DROP POLICY IF EXISTS "Admins can manage coping techniques" ON coping_techniques;
DROP POLICY IF EXISTS "Anyone can view active organizations" ON mental_health_organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON mental_health_organizations;
DROP POLICY IF EXISTS "Anyone can view active self care tips" ON self_care_tips;
DROP POLICY IF EXISTS "Admins can manage self care tips" ON self_care_tips;

-- 1. Coping Techniques Table
CREATE TABLE IF NOT EXISTS coping_techniques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    steps JSONB NOT NULL,
    duration TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE coping_techniques ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Anyone can view active coping techniques" ON coping_techniques
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coping techniques" ON coping_techniques
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- 2. Mental Health Organizations Table
CREATE TABLE IF NOT EXISTS mental_health_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    contact TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE mental_health_organizations ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Anyone can view active organizations" ON mental_health_organizations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage organizations" ON mental_health_organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- 3. Self Care Tips Table
CREATE TABLE IF NOT EXISTS self_care_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tip TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE self_care_tips ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Anyone can view active self care tips" ON self_care_tips
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage self care tips" ON self_care_tips
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Insert default data (only if tables are empty)
INSERT INTO coping_techniques (name, description, steps, duration, category, display_order)
SELECT * FROM (VALUES
    ('4-7-8 Breathing Exercise', 'A calming breathing technique that helps reduce anxiety and promote relaxation', 
     '["Sit comfortably with your back straight", "Breathe in quietly through your nose for 4 counts", "Hold your breath for 7 counts", "Exhale completely through your mouth for 8 counts", "Repeat this cycle 3-4 times"]'::jsonb,
     '2-3 minutes', 'breathing', 1),
    
    ('5-4-3-2-1 Grounding Technique', 'A sensory awareness exercise to help manage anxiety and stay present',
     '["Look around and name 5 things you can see", "Notice and name 4 things you can touch", "Listen for and name 3 things you can hear", "Identify 2 things you can smell", "Notice 1 thing you can taste"]'::jsonb,
     '3-5 minutes', 'grounding', 2),
    
    ('Progressive Muscle Relaxation', 'A technique to release physical tension and promote relaxation',
     '["Find a quiet, comfortable place to sit or lie down", "Starting with your toes, tense the muscles for 5 seconds", "Release the tension and notice the difference", "Move up to your calves, thighs, and continue through your body", "End with your face and head muscles"]'::jsonb,
     '10-15 minutes', 'physical', 3),
    
    ('Gratitude Journaling', 'Writing down things you''re grateful for to shift focus to positive aspects',
     '["Set aside 5-10 minutes in a quiet space", "Write down 3-5 things you''re grateful for today", "Be specific about why you''re grateful for each item", "Reflect on how these things make you feel", "Make this a daily practice"]'::jsonb,
     '5-10 minutes', 'journaling', 4),
    
    ('Body Scan Meditation', 'A mindfulness practice to connect with your body and release tension',
     '["Lie down or sit comfortably", "Close your eyes and take a few deep breaths", "Starting at your toes, notice any sensations without judgment", "Slowly move your attention up through your body", "If you notice tension, breathe into that area and let it soften"]'::jsonb,
     '10-20 minutes', 'sleep', 5)
) AS v(name, description, steps, duration, category, display_order)
WHERE NOT EXISTS (SELECT 1 FROM coping_techniques LIMIT 1);

INSERT INTO mental_health_organizations (name, description, contact, display_order)
SELECT * FROM (VALUES
    ('Mental Health Foundation Nigeria', 'Provides mental health education, advocacy, and support services across Nigeria', 
     'Email: info@mhfnigeria.org | Phone: +234 809 210 6493', 1),
    
    ('Mentally Aware Nigeria Initiative (MANI)', 'Youth-focused organization promoting mental health awareness and reducing stigma',
     'Email: info@mentalawareinitiative.org | Website: www.mentalawareinitiative.org', 2),
    
    ('Asido Foundation', 'Offers free counseling services and mental health support',
     'Phone: +234 803 391 6667 | Email: info@asidofoundation.org', 3)
) AS v(name, description, contact, display_order)
WHERE NOT EXISTS (SELECT 1 FROM mental_health_organizations LIMIT 1);

INSERT INTO self_care_tips (tip, display_order)
SELECT * FROM (VALUES
    ('Maintain a consistent sleep schedule - aim for 7-9 hours per night', 1),
    ('Stay physically active - even a 30-minute walk can boost your mood', 2),
    ('Practice mindfulness or meditation for 10 minutes daily', 3),
    ('Connect with friends or family regularly, even if just by phone', 4),
    ('Set healthy boundaries - it''s okay to say no to protect your mental health', 5),
    ('Limit social media and news consumption if it affects your mood', 6),
    ('Eat nutritious meals and stay hydrated throughout the day', 7),
    ('Engage in hobbies or activities that bring you joy', 8)
) AS v(tip, display_order)
WHERE NOT EXISTS (SELECT 1 FROM self_care_tips LIMIT 1);
