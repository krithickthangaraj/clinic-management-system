-- Fix database permissions for clinic_user
-- Run this file: psql -d clinic_db -f fix_permissions.sql

GRANT USAGE ON SCHEMA public TO clinic_user;
GRANT CREATE ON SCHEMA public TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;
