-- ==========================================
-- MEDLUD CONSOLIDATED IMAGE & STORAGE FIX
-- ==========================================

-- 1. Ensure the messages table has the image_url column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='messages' AND column_name='image_url') THEN
        ALTER TABLE messages ADD COLUMN image_url text;
    END IF;
END $$;

-- 2. Storage Policies for 'lab-results'
-- Note: You MUST create the bucket 'lab-results' in the Supabase Dashboard FIRST!
-- Dashboard -> Storage -> New Bucket -> "lab-results" (Private)

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own lab results" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view lab results" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own lab results" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Lab Results" ON storage.objects;

-- NOTE: If you get "must be owner" error on the policies below, 
-- please use the Supabase Dashboard UI (Storage -> lab-results -> Policies) 
-- to add them manually using the logic in the USING/WITH CHECK clauses.

-- POLICY: Patients can upload to their own folder
-- Folder structure expected: lab-results/{user_id}/{filename}
CREATE POLICY "Users can upload their own lab results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lab-results' AND
    (auth.uid())::text = (storage.foldername(name))[1]
);

-- POLICY: Staff can view all results in the lab-results bucket
CREATE POLICY "Staff can view lab results"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'lab-results' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('doctor', 'nurse', 'nurse-assistant', 'admin')
    )
);

-- POLICY: Patients can view their own results
CREATE POLICY "Users can view their own lab results"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'lab-results' AND
    (auth.uid())::text = (storage.foldername(name))[1]
);
