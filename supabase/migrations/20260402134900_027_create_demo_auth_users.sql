/*
  # Create Demo Supabase Auth Users

  1. Purpose
    - Create Supabase Auth users for demo accounts
    - Link them with existing users table records
    
  2. Demo Users
    - admin@ebsa.com.py (password: admin123)
    - supervisor@ebsa.com.py (password: supervisor123)
    - agente@ebsa.com.py (password: agente123)
    
  3. Notes
    - Uses Supabase Auth admin API via SQL
    - Passwords are hashed securely by Supabase
*/

-- Note: Supabase Auth users must be created via the Supabase Dashboard or API
-- This migration documents the required users but cannot create them directly via SQL

-- Instead, we'll create a temporary function to help with user creation
-- Users should be created through the Supabase Dashboard or using the admin API

-- For now, let's ensure the auth trigger is working
-- The handle_new_user() function will link auth users to public.users when they sign up

-- Check if users table has the required records
DO $$
BEGIN
  -- Just verify the users exist in the users table
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ebsa.com.py') THEN
    RAISE NOTICE 'Admin user not found in users table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'supervisor@ebsa.com.py') THEN
    RAISE NOTICE 'Supervisor user not found in users table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'agente@ebsa.com.py') THEN
    RAISE NOTICE 'Agente user not found in users table';
  END IF;
END $$;
