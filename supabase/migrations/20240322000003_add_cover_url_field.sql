-- Add cover_url field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Create index for cover_url queries
CREATE INDEX IF NOT EXISTS profiles_cover_url_idx ON profiles(cover_url);

-- Add comment to the column
COMMENT ON COLUMN profiles.cover_url IS 'User cover image URL for profile display'; 