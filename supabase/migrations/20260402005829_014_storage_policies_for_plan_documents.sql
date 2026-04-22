/*
  # Storage Policies for Plan Documents

  1. Policies
    - Allow authenticated users to upload plan documents
    - Allow anyone to view plan documents (public access)
    - Allow authenticated users to update/delete plan documents
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload plan documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload plan documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'plan-documents');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view plan documents'
  ) THEN
    CREATE POLICY "Anyone can view plan documents"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'plan-documents');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update plan documents'
  ) THEN
    CREATE POLICY "Authenticated users can update plan documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'plan-documents');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete plan documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete plan documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'plan-documents');
  END IF;
END $$;
