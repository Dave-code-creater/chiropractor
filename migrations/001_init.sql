-- ========================================
-- COMBINED SCHEMA FOR MONOLITHIC APPLICATION
-- ========================================

-- Create enums first
CREATE TYPE gender_enum AS ENUM ('male','female','other');
CREATE TYPE role_enum AS ENUM ('patient','doctor','staff','admin');
CREATE TYPE marriage_status AS ENUM ('Single','Married','Divorced','Widowed','Other');
CREATE TYPE race AS ENUM ('White','Black','Asian','Hispanic','Other');
CREATE TYPE insurance_type AS ENUM ('Private','Medicare','Medicaid','Self-pay','Other');
CREATE TYPE mental_work AS ENUM ('Sitting','Standing','Mixed','Other');
CREATE TYPE physical_work AS ENUM ('Light','Moderate','Heavy','Other');
CREATE TYPE exercise_level AS ENUM ('None','Low','Moderate','High','Other');
CREATE TYPE smoking_status AS ENUM ('Never','Former','Current','Other');
CREATE TYPE alcohol_status AS ENUM('none','yes','no');
CREATE TYPE work_time_type AS ENUM('Full Time','Part Time');
CREATE TYPE accident_cause AS ENUM('Auto Collision','On the job','Other');

-- ========================================
-- USERS TABLE (from auth-service)
-- ========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role role_enum NOT NULL DEFAULT 'patient',
  phone_number TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- API KEYS TABLE (from auth-service)
-- ========================================
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  key TEXT UNIQUE NOT NULL,
  is_refresh_token BOOLEAN DEFAULT FALSE,
  status BOOLEAN DEFAULT TRUE,
  permission_code VARCHAR(10) DEFAULT '0000',
  device_id TEXT,
  device_type TEXT,
  platform TEXT,
  browser TEXT,
  last_used TIMESTAMPTZ,
  last_used_ip TEXT,
  last_used_user_agent TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- PASSWORD RESETS TABLE (from auth-service)
-- ========================================
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PATIENTS TABLE (from user-service)
-- ========================================
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  ssn VARCHAR(11),
  date_of_birth DATE,
  age INT,
  gender gender_enum,
  marriage_status marriage_status,
  race race,
  phone TEXT,
  email TEXT,
  street TEXT,
  city TEXT,
  state CHAR(2),
  zip TEXT,
  employer TEXT,
  occupation TEXT,
  work_address TEXT,
  work_phone TEXT,
  spouse_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  insurance_info JSONB,
  medical_history JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PATIENT INTAKE RESPONSES (from user-service)
-- ========================================
CREATE TABLE patient_intake_responses (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  ssn VARCHAR(11),
  dob DATE NOT NULL,
  age INT,
  gender gender_enum NOT NULL,
  marriage_status marriage_status NOT NULL,
  race race NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  zip TEXT NOT NULL,
  home_phone TEXT NOT NULL,
  employer TEXT,
  occupation TEXT,
  work_address TEXT,
  work_phone TEXT,
  spouse_phone TEXT,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_relationship TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- INSURANCE DETAILS (from user-service)
-- ========================================
CREATE TABLE insurance_details (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  insurance_type insurance_type,
  provider TEXT,
  policy_number TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- HEALTH CONDITIONS (from user-service)
-- ========================================
CREATE TABLE health_conditions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  has_past_medical_history BOOLEAN,
  medical_condition_details TEXT,
  has_past_surgical_history BOOLEAN,
  surgical_history_details TEXT,
  is_taking_medication BOOLEAN,
  medication_names TEXT[],
  family_history JSONB,
  current_weight TEXT,
  recent_weight_change TEXT,
  mental_work mental_work,
  mental_work_hours_per_day INT,
  physical_work physical_work,
  physical_work_hours_per_day INT,
  exercise_level exercise_level,
  exercise_hours_per_day INT,
  smoking_status smoking_status,
  packs_per_day NUMERIC(5,2),
  years_smoking INT,
  drink_status alcohol_status,
  beer_per_week INT,
  liquor_per_week INT,
  wine_per_week INT,
  years_drinking INT,
  currently_working BOOLEAN,
  work_time_type work_time_type,
  work_hours_per_day INT,
  work_days_per_week INT,
  job_description TEXT,
  last_menstrual_period TEXT,
  is_pregnant_now BOOLEAN,
  weeks_pregnant INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- DOCTORS TABLE (from appointment-service)
-- ========================================
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialization TEXT,
  license_number TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  schedule JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- APPOINTMENTS TABLE (from appointment-service)
-- ========================================
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
  patient_user_id INT REFERENCES users(id),
  patient_name TEXT,
  patient_phone TEXT,
  patient_email TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_datetime TIMESTAMPTZ,
  appointment_type TEXT DEFAULT 'consultation',
  location TEXT DEFAULT 'Clinic',
  reason_for_visit TEXT,
  additional_notes TEXT,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_patient_reference 
    CHECK (patient_id IS NOT NULL OR patient_user_id IS NOT NULL OR patient_email IS NOT NULL)
);

-- ========================================
-- REPORTS TABLE (from report-service)
-- ========================================
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id INT REFERENCES appointments(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CLINICAL NOTES TABLE (from user-service)
-- ========================================
CREATE TABLE clinical_notes (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id INT REFERENCES appointments(id) ON DELETE CASCADE,
  note_type TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- VITALS TABLE (from user-service)
-- ========================================
CREATE TABLE vitals (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INT REFERENCES appointments(id) ON DELETE CASCADE,
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  heart_rate INT,
  temperature DECIMAL(4,2),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by INT REFERENCES users(id)
);

-- ========================================
-- PAIN DESCRIPTIONS (from user-service)
-- ========================================
CREATE TABLE pain_descriptions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  pain_chart JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- EMERGENCY CONTACTS (from user-service)
-- ========================================
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- CHAT SYSTEM TABLES
-- ========================================
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
  conversation_type TEXT DEFAULT 'general',
  subject TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachment_url TEXT,
  attachment_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_status ON patients(status);

CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_status ON doctors(status);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient_user_id ON appointments(patient_user_id);
CREATE INDEX idx_appointments_patient_email ON appointments(patient_email);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX idx_appointments_appointment_type ON appointments(appointment_type);
CREATE INDEX idx_appointments_location ON appointments(location);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_by ON appointments(created_by);

CREATE INDEX idx_reports_patient_id ON reports(patient_id);
CREATE INDEX idx_reports_doctor_id ON reports(doctor_id);
CREATE INDEX idx_reports_type ON reports(report_type);

CREATE INDEX idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_appointment_id ON clinical_notes(appointment_id);

CREATE INDEX idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX idx_vitals_appointment_id ON vitals(appointment_id);

CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(key);

CREATE INDEX idx_health_conditions_user_id ON health_conditions(user_id);
CREATE INDEX idx_insurance_details_user_id ON insurance_details(user_id);
CREATE INDEX idx_patient_intake_responses_user_id ON patient_intake_responses(user_id);

CREATE INDEX idx_conversations_patient_id ON conversations(patient_id);
CREATE INDEX idx_conversations_doctor_id ON conversations(doctor_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- ========================================
-- DATA FIXES AND MAINTENANCE
-- ========================================

-- Fix existing appointments by populating patient_user_id
-- This ensures appointments are properly linked to user accounts
UPDATE appointments 
SET patient_user_id = u.id
FROM users u 
WHERE appointments.patient_email = u.email 
  AND appointments.patient_user_id IS NULL
  AND u.email IS NOT NULL;

-- Update patient_id for appointments where we have a patient record
-- This creates proper foreign key relationships
UPDATE appointments 
SET patient_id = p.id
FROM patients p, users u 
WHERE appointments.patient_user_id = u.id 
  AND p.user_id = u.id
  AND appointments.patient_id IS NULL;

-- Set default location for existing appointments
UPDATE appointments 
SET location = 'Clinic'
WHERE location IS NULL;

-- ========================================
-- MIGRATION TRACKING
-- ========================================
CREATE TABLE pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);

INSERT INTO pgmigrations (name, run_on) VALUES ('001_init.sql', NOW()); 