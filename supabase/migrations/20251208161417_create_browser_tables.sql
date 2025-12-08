/*
  # Create Browser Tables for TabOS

  1. New Tables
    - `bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `url` (text)
      - `created_at` (timestamptz)
    
    - `browsing_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `url` (text)
      - `visited_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS browsing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  visited_at timestamptz DEFAULT now()
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE browsing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own history"
  ON browsing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON browsing_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON browsing_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON browsing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_visited_at ON browsing_history(visited_at DESC);
