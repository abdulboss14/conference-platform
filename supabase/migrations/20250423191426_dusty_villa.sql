/*
  # Add RLS policies for profiles table

  1. Changes
    - Add policy to allow authenticated users to insert their own profile
    - Update select policy to allow users to read their own profile
  
  2. Security
    - Maintains RLS on profiles table
    - Ensures users can only access their own profile data
    - Allows profile creation during signup
*/

-- Update the select policy to allow users to read their own profile
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add policy to allow users to insert their own profile during signup
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);