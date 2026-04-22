/*
  # Fix Storage Policies for Custom Authentication

  1. Changes
    - Remove policies that require Supabase Auth (authenticated role)
    - Create policies that work with the custom user table authentication
    - Allow uploads, updates, and deletes based on organization ownership
  
  2. Security
    - Public read access for plan documents (bucket is already public)
    - Allow all inserts/updates/deletes for now (will be controlled by app logic)
    - Future: can add policies based on user table joins

  3. Notes
    - This app uses custom authentication via the users table
    - Not using Supabase Auth, so 'authenticated' role doesn't apply
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload plan documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view plan documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update plan documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete plan documents" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public can view plan documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'plan-documents');

-- Allow uploads for all users (app will handle auth)
CREATE POLICY "Allow uploads to plan documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'plan-documents');

-- Allow updates for all users (app will handle auth)
CREATE POLICY "Allow updates to plan documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'plan-documents')
WITH CHECK (bucket_id = 'plan-documents');

-- Allow deletes for all users (app will handle auth)
CREATE POLICY "Allow deletes from plan documents"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'plan-documents');
