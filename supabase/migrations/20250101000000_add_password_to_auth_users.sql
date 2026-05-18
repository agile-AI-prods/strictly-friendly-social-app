-- Add password column to auth.users table
-- Note: This requires admin privileges in Supabase

-- Add password column to auth.users table
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN auth.users.password_hash IS 'Hashed password for MongoDB authentication compatibility';

-- Create index on password_hash for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_password_hash ON auth.users(password_hash);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON auth.users TO authenticated;
GRANT SELECT, UPDATE ON auth.users TO service_role;
