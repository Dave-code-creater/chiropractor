-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE, -- Reference to auth service user
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  specializations TEXT[], -- Array of specializations
  license_number TEXT UNIQUE,
  years_experience INT,
  education TEXT[],
  certifications TEXT[],
  bio TEXT,
  profile_image_url TEXT,
  consultation_fee DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Doctor availability schedule
CREATE TABLE IF NOT EXISTS doctor_availability (
  id SERIAL PRIMARY KEY,
  doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Doctor specializations lookup
CREATE TABLE IF NOT EXISTS specializations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert common specializations
INSERT INTO specializations (name, description) VALUES
('General Practice', 'Primary care and general medical services'),
('Orthopedics', 'Bone, joint, and muscle disorders'),
('Neurology', 'Nervous system disorders'),
('Cardiology', 'Heart and cardiovascular system'),
('Dermatology', 'Skin, hair, and nail conditions'),
('Pediatrics', 'Medical care for children'),
('Psychiatry', 'Mental health and psychiatric disorders'),
('Physical Therapy', 'Movement and rehabilitation therapy'),
('Sports Medicine', 'Sports-related injuries and performance'),
('Pain Management', 'Chronic and acute pain treatment'),
('Chiropractic', 'Spinal manipulation and musculoskeletal treatment')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INT,
  doctor_id INT REFERENCES doctors(id),
  user_id INT NOT NULL, -- Client ID from JWT token
  scheduled_at TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  clinic_id INT,
  status TEXT DEFAULT 'scheduled',
  reason_id INT,
  visit_number INT,
  notes TEXT,
  date TEXT, -- Date in format like "Wednesday, June 25, 2025"
  time TEXT, -- Time in format like "11:30 AM"
  reason_for_visit TEXT,
  additional_notes TEXT,
  duration INT DEFAULT 30, -- Duration in minutes
  reschedule_reason TEXT, -- Reason for rescheduling
  reschedule_count INT DEFAULT 0, -- Number of times rescheduled
  original_scheduled_at TIMESTAMPTZ, -- Original appointment time
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);

-- Insert sample doctors
INSERT INTO doctors (
  first_name, last_name, email, phone_number, specializations,
  license_number, years_experience, education, certifications,
  bio, consultation_fee, rating, total_reviews, is_available, status,
  created_at, updated_at
) VALUES 
(
  'Dieu', 'Phan', 'doctor@gmail.com', '+1-555-CHIRO',
  ARRAY['Chiropractic', 'Spinal Manipulation', 'Pain Management'],
  'DC12345', 12,
  ARRAY['Doctor of Chiropractic - Palmer College of Chiropractic', 'Bachelor of Science - Kinesiology'],
  ARRAY['Licensed Chiropractor', 'Certified Chiropractic Sports Physician', 'Dry Needling Certification'],
  'Dr. Dieu Phan D.C. is a dedicated chiropractor specializing in spinal health, pain management, and sports injury rehabilitation. With over 12 years of experience, Dr. Phan provides comprehensive chiropractic care to help patients achieve optimal health and wellness.',
  180.00, 4.9, 387, true, 'active', NOW(), NOW()
),
(
  'John', 'Smith', 'dr.john.smith@clinic.com', '+1-555-0101',
  ARRAY['General Practice', 'Family Medicine'],
  'MD12345', 15,
  ARRAY['MD - Harvard Medical School', 'Residency - Johns Hopkins'],
  ARRAY['Board Certified Family Medicine', 'CPR Certified'],
  'Dr. Smith is a dedicated family physician with over 15 years of experience providing comprehensive healthcare.',
  150.00, 4.8, 245, true, 'active', NOW(), NOW()
),
(
  'Sarah', 'Johnson', 'dr.sarah.johnson@clinic.com', '+1-555-0102',
  ARRAY['Orthopedics', 'Sports Medicine'],
  'MD23456', 12,
  ARRAY['MD - Stanford Medical School', 'Fellowship - Mayo Clinic'],
  ARRAY['Board Certified Orthopedic Surgery', 'Sports Medicine Certificate'],
  'Dr. Johnson specializes in orthopedic surgery and sports medicine, helping athletes and active individuals recover.',
  200.00, 4.9, 189, true, 'active', NOW(), NOW()
),
(
  'Michael', 'Chen', 'dr.michael.chen@clinic.com', '+1-555-0103',
  ARRAY['Neurology', 'Pain Management'],
  'MD34567', 18,
  ARRAY['MD - UCLA Medical School', 'Neurology Residency - UCSF'],
  ARRAY['Board Certified Neurology', 'Pain Management Specialist'],
  'Dr. Chen is a neurologist with extensive experience in treating neurological disorders and chronic pain.',
  250.00, 4.7, 156, true, 'active', NOW(), NOW()
),
(
  'Emily', 'Rodriguez', 'dr.emily.rodriguez@clinic.com', '+1-555-0104',
  ARRAY['Physical Therapy', 'Rehabilitation'],
  'PT45678', 8,
  ARRAY['DPT - University of Southern California', 'Manual Therapy Certificate'],
  ARRAY['Licensed Physical Therapist', 'Orthopedic Manual Therapy'],
  'Dr. Rodriguez is a skilled physical therapist specializing in orthopedic rehabilitation and manual therapy.',
  120.00, 4.6, 98, true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert doctor availability
INSERT INTO doctor_availability (
  doctor_id, day_of_week, start_time, end_time, is_available, created_at, updated_at
) VALUES 
-- Dr. Dieu Phan (ID: 1) - Monday to Friday, 8 AM to 6 PM
(1, 1, '08:00', '18:00', true, NOW(), NOW()),
(1, 2, '08:00', '18:00', true, NOW(), NOW()),
(1, 3, '08:00', '18:00', true, NOW(), NOW()),
(1, 4, '08:00', '18:00', true, NOW(), NOW()),
(1, 5, '08:00', '18:00', true, NOW(), NOW()),
(1, 6, '09:00', '15:00', true, NOW(), NOW()),

-- Dr. John Smith (ID: 2) - Monday to Friday, 9 AM to 5 PM
(2, 1, '09:00', '17:00', true, NOW(), NOW()),
(2, 2, '09:00', '17:00', true, NOW(), NOW()),
(2, 3, '09:00', '17:00', true, NOW(), NOW()),
(2, 4, '09:00', '17:00', true, NOW(), NOW()),
(2, 5, '09:00', '17:00', true, NOW(), NOW()),

-- Dr. Sarah Johnson (ID: 3) - Monday, Wednesday, Friday 8 AM to 4 PM
(3, 1, '08:00', '16:00', true, NOW(), NOW()),
(3, 3, '08:00', '16:00', true, NOW(), NOW()),
(3, 5, '08:00', '16:00', true, NOW(), NOW()),

-- Dr. Michael Chen (ID: 4) - Tuesday to Saturday, 10 AM to 6 PM
(4, 2, '10:00', '18:00', true, NOW(), NOW()),
(4, 3, '10:00', '18:00', true, NOW(), NOW()),
(4, 4, '10:00', '18:00', true, NOW(), NOW()),
(4, 5, '10:00', '18:00', true, NOW(), NOW()),
(4, 6, '10:00', '18:00', true, NOW(), NOW()),

-- Dr. Emily Rodriguez (ID: 5) - Monday to Thursday, 8 AM to 4 PM
(5, 1, '08:00', '16:00', true, NOW(), NOW()),
(5, 2, '08:00', '16:00', true, NOW(), NOW()),
(5, 3, '08:00', '16:00', true, NOW(), NOW()),
(5, 4, '08:00', '16:00', true, NOW(), NOW())
ON CONFLICT DO NOTHING;
