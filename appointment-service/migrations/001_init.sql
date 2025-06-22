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
  scheduled_at TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  clinic_id INT,
  status TEXT DEFAULT 'scheduled',
  reason_id INT,
  visit_number INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
