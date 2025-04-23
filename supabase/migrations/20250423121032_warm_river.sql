/*
  # Initial database schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `role` (text)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamptz)
    - `classes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `mentor_id` (uuid, references profiles.id)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
    - `enrollments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `class_id` (uuid, references classes.id)
      - `created_at` (timestamptz)
    - `messages`
      - `id` (uuid, primary key)
      - `class_id` (uuid, references classes.id)
      - `user_id` (uuid, references profiles.id)
      - `content` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Create policies for each table to control access based on user role
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('mentor', 'participant')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  mentor_id uuid NOT NULL REFERENCES profiles(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  class_id uuid NOT NULL REFERENCES classes(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, class_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable real-time for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read all profiles" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Classes Policies
CREATE POLICY "Anyone can read all classes" 
  ON classes FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Mentors can create classes" 
  ON classes FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'mentor'
    )
  );

CREATE POLICY "Mentors can update their own classes" 
  ON classes FOR UPDATE 
  TO authenticated 
  USING (
    mentor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'mentor'
    )
  );

-- Enrollments Policies
CREATE POLICY "Users can read enrollments" 
  ON enrollments FOR SELECT 
  TO authenticated 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = enrollments.class_id
      AND classes.mentor_id = auth.uid()
    )
  );

CREATE POLICY "Participants can enroll themselves" 
  ON enrollments FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'participant'
    )
  );

CREATE POLICY "Users can delete their own enrollments" 
  ON enrollments FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Messages Policies
CREATE POLICY "Anyone can read messages for their classes" 
  ON messages FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.class_id = messages.class_id
      AND enrollments.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = messages.class_id
      AND classes.mentor_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for their classes" 
  ON messages FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM enrollments
        WHERE enrollments.class_id = messages.class_id
        AND enrollments.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = messages.class_id
        AND classes.mentor_id = auth.uid()
      )
    )
  );