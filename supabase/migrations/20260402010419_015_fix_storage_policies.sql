/*
  # Fix Storage Policies for Plan Documents

  1. Changes
    - Drop existing policies that were incorrectly created
    - Create correct policies for storage.objects table
    - Ensure authenticated users can upload files
  
  2. Security
    - INSERT policy uses WITH CHECK instead of USING
    - SELECT policy is public for viewing documents
    - UPDATE/DELETE policies are restricted to authenticated users
*/

DROP POLICY IF EXISTS "Authenticated users can upload plan documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view plan documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update plan documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete plan documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload plan documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plan-documents');

CREATE POLICY "Anyone can view plan documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'plan-documents');

CREATE POLICY "Authenticated users can update plan documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'plan-documents')
WITH CHECK (bucket_id = 'plan-documents');

CREATE POLICY "Authenticated users can delete plan documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'plan-documents');
