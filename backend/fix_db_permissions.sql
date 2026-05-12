-- Fix database permissions for clinic_user
-- Run this as postgres superuser

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO clinic_user;

-- Grant create privileges
GRANT CREATE ON SCHEMA public TO clinic_user;

-- Grant all privileges on all tables (current and future)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO clinic_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO clinic_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;
