-- Migration: Storage bucket for quiz images
-- Run this in the Supabase SQL Editor

-- Create storage bucket for quiz images (public bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-images', 'quiz-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public access
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'quiz-images');

CREATE POLICY "Allow Uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'quiz-images');

CREATE POLICY "Allow Updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'quiz-images');

CREATE POLICY "Allow Deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'quiz-images');
