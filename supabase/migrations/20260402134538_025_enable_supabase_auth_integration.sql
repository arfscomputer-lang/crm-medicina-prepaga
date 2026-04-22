/*
  # Enable Supabase Auth Integration

  1. Changes
    - Add auth_user_id column to users table to link with auth.users
    - Create trigger to automatically create user profile when auth user signs up
    - Create function to sync user metadata
    
  2. Security
    - Will enable RLS policies using auth.uid() in next migration
    - Links custom users table with Supabase Auth system
    
  3. Notes
    - Existing users will need to be migrated manually or via password reset
    - New signups will automatically create linked records
*/

-- Add auth_user_id column to link with Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- When a new auth.user is created, create corresponding users record if email exists
  UPDATE public.users
  SET auth_user_id = NEW.id,
      email_verified = true
  WHERE email = NEW.email
    AND auth_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync auth.users with public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user's org_id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id 
    FROM public.users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get user's role from auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  user_role user_role;
BEGIN
  SELECT org_id, role INTO user_org_id, user_role
  FROM public.users 
  WHERE auth_user_id = auth.uid();
  
  IF user_org_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check permission based on role
  RETURN EXISTS (
    SELECT 1 
    FROM public.role_permissions rp
    WHERE rp.org_id = user_org_id
      AND rp.role = user_role
      AND CASE permission_name
        WHEN 'can_create_clients' THEN rp.can_create_clients
        WHEN 'can_edit_clients' THEN rp.can_edit_clients
        WHEN 'can_delete_clients' THEN rp.can_delete_clients
        WHEN 'can_view_all_clients' THEN rp.can_view_all_clients
        WHEN 'can_create_plans' THEN rp.can_create_plans
        WHEN 'can_edit_plans' THEN rp.can_edit_plans
        WHEN 'can_delete_plans' THEN rp.can_delete_plans
        WHEN 'can_manage_users' THEN rp.can_manage_users
        ELSE false
      END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
