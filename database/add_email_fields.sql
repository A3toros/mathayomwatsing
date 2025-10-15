-- ========================================
-- ADD EMAIL FIELDS TO USER TABLES
-- Allow users to optionally provide their own email addresses
-- ========================================

-- Add email field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add email field to teachers table  
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add email field to admin table
ALTER TABLE admin ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add indexes for email fields (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);

-- Add comments for documentation
COMMENT ON COLUMN users.email IS 'Optional email address for the student';
COMMENT ON COLUMN teachers.email IS 'Optional email address for the teacher';
COMMENT ON COLUMN admin.email IS 'Optional email address for the admin';
