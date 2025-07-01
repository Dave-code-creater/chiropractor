-- ==========================================
-- ADD DR. DIEU PHAN TO THE SYSTEM
-- ==========================================
-- This script adds Dr. Dieu Phan as a doctor with his availability schedule
-- Run this after the initial database migration

BEGIN;

-- First, create the user account for Dr. Dieu Phan
INSERT INTO users (
  email, username, password_hash, role, phone_number, 
  is_verified, phone_verified, status, created_at, updated_at
) VALUES (
  'doctor@gmail.com',
  'dieu.phan',
  '$2a$12$qBkUOTO1f6x6ubT2uF3t5e4ffzG0rkMzyQnx0ZyIxdaCJTUFz8AUm',
  'doctor',
  '+1-555-CHIRO',
  true,
  true,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID (will be 1 if this is the first doctor added after initial setup)
-- Or you can manually set it to a specific ID

-- Create the doctor profile with availability schedule
INSERT INTO doctors (
  user_id,
  first_name,
  last_name,
  specialization,
  license_number,
  phone,
  email,
  schedule,
  status,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM users WHERE email = 'doctor@gmail.com'),
  'Dieu',
  'Phan',
  'Chiropractic',
  'DC12345',
  '+1-555-CHIRO',
  'doctor@gmail.com',
  '{
    "availability": [
      {
        "day": "monday",
        "start_time": "08:00",
        "end_time": "18:00",
        "is_available": true
      },
      {
        "day": "tuesday", 
        "start_time": "08:00",
        "end_time": "18:00",
        "is_available": true
      },
      {
        "day": "wednesday",
        "start_time": "08:00", 
        "end_time": "18:00",
        "is_available": true
      },
      {
        "day": "thursday",
        "start_time": "08:00",
        "end_time": "18:00", 
        "is_available": true
      },
      {
        "day": "friday",
        "start_time": "08:00",
        "end_time": "18:00",
        "is_available": true
      },
      {
        "day": "saturday",
        "start_time": "09:00",
        "end_time": "15:00",
        "is_available": true
      },
      {
        "day": "sunday",
        "start_time": null,
        "end_time": null,
        "is_available": false
      }
    ],
    "time_zone": "America/Los_Angeles",
    "appointment_duration": 30,
    "break_times": [
      {
        "day": "monday",
        "start_time": "12:00",
        "end_time": "13:00"
      },
      {
        "day": "tuesday",
        "start_time": "12:00", 
        "end_time": "13:00"
      },
      {
        "day": "wednesday",
        "start_time": "12:00",
        "end_time": "13:00"
      },
      {
        "day": "thursday", 
        "start_time": "12:00",
        "end_time": "13:00"
      },
      {
        "day": "friday",
        "start_time": "12:00",
        "end_time": "13:00"
      },
      {
        "day": "saturday",
        "start_time": "12:00",
        "end_time": "12:30"
      }
    ]
  }'::jsonb,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (license_number) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialization = EXCLUDED.specialization,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  schedule = EXCLUDED.schedule,
  status = 'active',
  updated_at = NOW();

-- ==========================================
-- ADD ADMIN ACCOUNT
-- ==========================================
-- Create admin user account
INSERT INTO users (
  email, username, password_hash, role, phone_number, 
  is_verified, phone_verified, status, created_at, updated_at
) VALUES (
  'admin@clinic.com',
  'admin',
  '$2a$12$qBkUOTO1f6x6ubT2uF3t5e4ffzG0rkMzyQnx0ZyIxdaCJTUFz8AUm',
  'admin',
  '+1-555-ADMIN',
  true,
  true,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- ADD STAFF ACCOUNT
-- ==========================================
-- Create staff user account
INSERT INTO users (
  email, username, password_hash, role, phone_number, 
  is_verified, phone_verified, status, created_at, updated_at
) VALUES (
  'staff@clinic.com',
  'staff.member',
  '$2a$12$qBkUOTO1f6x6ubT2uF3t5e4ffzG0rkMzyQnx0ZyIxdaCJTUFz8AUm',
  'staff',
  '+1-555-STAFF',
  true,
  true,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

COMMIT;

-- Display the results
-- Show all created accounts
SELECT 
  u.id as user_id,
  u.email,
  u.username,
  u.role,
  u.phone_number,
  u.status,
  u.created_at
FROM users u 
WHERE u.email IN ('doctor@gmail.com', 'admin@clinic.com', 'staff@clinic.com')
ORDER BY u.role, u.email;

-- Show doctor details with schedule
SELECT 
  u.id as user_id,
  u.email,
  u.username,
  u.role,
  d.id as doctor_id,
  d.first_name,
  d.last_name,
  d.specialization,
  d.license_number,
  d.status
FROM users u 
JOIN doctors d ON u.id = d.user_id 
WHERE u.email = 'doctor@gmail.com';

-- Show the availability schedule
SELECT 
  d.first_name || ' ' || d.last_name as doctor_name,
  d.schedule->'availability' as availability_schedule
FROM doctors d 
WHERE d.license_number = 'DC12345'; 