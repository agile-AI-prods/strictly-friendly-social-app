-- Add birthday field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS birthday DATE;

-- Create index for birthday queries
CREATE INDEX IF NOT EXISTS profiles_birthday_idx ON profiles(birthday);

-- Add comment to the column
COMMENT ON COLUMN profiles.birthday IS 'User birthday for calendar display and age calculation'; 