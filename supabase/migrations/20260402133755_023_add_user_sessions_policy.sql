/*
  # Add RLS Policy for User Sessions

  1. Security Enhancement
    - Add RLS policy for user_sessions table
    - Users can only view their own sessions
    - Uses optimized (SELECT auth.jwt()) pattern for performance

  2. Policy Details
    - SELECT: Users can view their own sessions based on email
    - INSERT: Users can create their own sessions
    - DELETE: Users can delete their own sessions (logout)
*/

-- Create policy for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );
