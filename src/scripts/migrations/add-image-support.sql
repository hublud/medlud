-- Add image_url to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url text;

-- Create a bucket for lab results
-- Note: This might need to be done via the Supabase Dashboard, 
-- but we can provide the SQL for bucket-level RLS.

-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('lab-results', 'lab-results', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'lab-results' bucket

-- Clean up existing policies if they exist to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can upload their own lab results" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view lab results" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own lab results" ON storage.objects;

-- Allow users to upload their own lab results
CREATE POLICY "Users can upload their own lab results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lab-results' AND
    (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow doctors/staff to view lab results
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

-- Allow patients to view their own lab results
CREATE POLICY "Users can view their own lab results"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'lab-results' AND
    (auth.uid())::text = (storage.foldername(name))[1]
);
