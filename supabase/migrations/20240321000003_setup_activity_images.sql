-- Create a new storage bucket for activity images
INSERT INTO storage.buckets (id, name, public)
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the activities bucket
-- Allow public read access to all images
CREATE POLICY "Allow public read access to activity images"
ON storage.objects FOR SELECT
USING (bucket_id = 'activities');

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload activity images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'activities'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'activity-images'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Allow users to update their own activity images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'activities'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'activity-images'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete their own activity images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'activities'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'activity-images'
    AND (storage.foldername(name))[2] = auth.uid()::text
); 