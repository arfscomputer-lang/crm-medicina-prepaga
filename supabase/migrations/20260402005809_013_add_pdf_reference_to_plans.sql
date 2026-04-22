/*
  # Add PDF Reference Document Field to Plan Catalog

  1. Changes
    - Add `pdf_document_url` column to `plan_catalog` table for storing PDF references
    - This will allow plans from any provider (not just EBSA) to have reference documents
  
  2. Notes
    - PDFs will be stored in Supabase Storage
    - The URL will reference the storage path
*/

-- Add PDF document URL field to plan_catalog
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_catalog' AND column_name = 'pdf_document_url'
  ) THEN
    ALTER TABLE plan_catalog ADD COLUMN pdf_document_url TEXT;
  END IF;
END $$;
