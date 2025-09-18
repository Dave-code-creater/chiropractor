-- ========================================
-- COMPLETE CHIROPRACTOR CLINIC DATABASE SCHEMA
-- ========================================
-- This file contains the complete database schema for the chiropractor clinic
-- management system including all tables, indexes, and initial data.
-- 
-- Usage: psql -d your_database -f 001_complete_schema.sql
-- ========================================

-- ========================================
-- ENUMS AND TYPES
-- ========================================

-- User and demographic enums
CREATE TYPE gender_enum AS ENUM ('male','female','other');
CREATE TYPE role_enum AS ENUM ('patient','doctor','admin');
CREATE TYPE marriage_status AS ENUM ('Single','Married','Divorced','Widowed','Other');
CREATE TYPE race AS ENUM ('White','Black','Asian','Hispanic','Caucasian','Other');
CREATE TYPE insurance_type AS ENUM ('Private','Medicare','Medicaid','Self-pay','Other');

-- Work and lifestyle enums
CREATE TYPE mental_work AS ENUM ('Sitting','Standing','Mixed','Other');
CREATE TYPE physical_work AS ENUM ('Light','Moderate','Heavy','Other');
CREATE TYPE exercise_level AS ENUM ('None','Low','Moderate','High','Other');
CREATE TYPE smoking_status AS ENUM ('Never','Former','Current','Other');
CREATE TYPE alcohol_status AS ENUM('none','yes','no');
CREATE TYPE work_time_type AS ENUM('Full Time','Part Time');
CREATE TYPE accident_cause AS ENUM('Auto Collision','On the job','Other');

-- Incident system enums
CREATE TYPE incident_type_enum AS ENUM ('car_accident', 'work_injury', 'sports_injury', 'general_pain', 'general_patient_record');
CREATE TYPE incident_status_enum AS ENUM ('active', 'completed', 'inactive');
CREATE TYPE form_type_enum AS ENUM (
  'patient_info', 'health_insurance', 'pain_description', 
  'pain_assessment', 'medical_history', 'lifestyle_impact'
);

-- ========================================
-- AUTHENTICATION AND USER MANAGEMENT
-- ========================================

-- Core users table
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

-- API keys and tokens
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

-- Password reset tokens
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login session tracking
CREATE TABLE login_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'failed_login')),
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  device_os TEXT,
  browser_name TEXT,
  browser_version TEXT,
  is_mobile BOOLEAN DEFAULT FALSE,
  location_country TEXT,
  location_city TEXT,
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  session_duration_minutes INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PATIENT MANAGEMENT
-- ========================================

-- Patient profiles
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

-- Patient intake responses
CREATE TABLE patient_intake_responses (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  ssn VARCHAR(11),
  date_of_birth DATE NOT NULL,
  gender gender_enum NOT NULL,
  marital_status marriage_status NOT NULL,
  race race NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  zip TEXT NOT NULL,
  home_phone TEXT NOT NULL,
  cell_phone TEXT,
  emergency_contact TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_relationship TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insurance information
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

-- Health conditions and medical history
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
  exercise_frequency TEXT,
  smoking_status smoking_status,
  alcohol_status alcohol_status,
  alcohol_frequency TEXT,
  work_time_type work_time_type,
  work_hours_per_week INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- DOCTOR MANAGEMENT
-- ========================================

CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialization TEXT,
  phone_number TEXT,
  email TEXT,
  office_address TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor schedules and availability
CREATE TABLE doctor_schedules (
  id SERIAL PRIMARY KEY,
  doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  accepts_walkin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_day ON doctor_schedules(day_of_week);

-- Insert default schedules for days 2,4,6 (appointment only)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, accepts_walkin)
SELECT d.id, day, '09:00', '17:00', TRUE, FALSE
FROM doctors d
CROSS JOIN (VALUES (2), (4), (6)) AS days(day);

-- Insert schedules for days 3,5 (9H-20H with walk-ins)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, accepts_walkin)
SELECT d.id, day, '09:00', '20:00', TRUE, TRUE
FROM doctors d
CROSS JOIN (VALUES (3), (5)) AS days(day);

-- Insert schedule for day 7 (9H-17H with walk-ins)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, accepts_walkin)
SELECT d.id, 7, '09:00', '17:00', TRUE, TRUE
FROM doctors d;

-- ========================================
-- APPOINTMENT MANAGEMENT
-- ========================================

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id),
  doctor_id INT REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_datetime TIMESTAMPTZ GENERATED ALWAYS AS (appointment_date + appointment_time) STORED,
  reason_for_visit TEXT,
  additional_notes TEXT,
  location TEXT DEFAULT 'main_office',
  status TEXT DEFAULT 'scheduled',
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_by INT REFERENCES users(id),
  updated_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CLINICAL DOCUMENTATION
-- ========================================

-- Clinical notes
CREATE TABLE clinical_notes (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id),
  appointment_id INT REFERENCES appointments(id),
  doctor_id INT REFERENCES doctors(id),
  note_type TEXT DEFAULT 'general',
  content TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient vitals
CREATE TABLE vitals (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id),
  appointment_id INT REFERENCES appointments(id),
  systolic_bp INT,
  diastolic_bp INT,
  heart_rate INT,
  temperature DECIMAL(4,1),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  oxygen_saturation INT,
  respiratory_rate INT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pain descriptions
CREATE TABLE pain_descriptions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  pain_level INT CHECK (pain_level >= 0 AND pain_level <= 10),
  pain_description TEXT,
  pain_frequency TEXT,
  pain_duration TEXT,
  pain_triggers TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- COMMUNICATION SYSTEM
-- ========================================

-- Conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT UNIQUE NOT NULL,
  patient_id INT REFERENCES patients(id),
  doctor_id INT REFERENCES doctors(id),
  title TEXT,
  description TEXT,
  participant_type TEXT DEFAULT 'patient-doctor',
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_id INT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'sent',
  delivery_status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message delivery status tracking for Long-Polling
CREATE TABLE message_delivery_status (
  id SERIAL PRIMARY KEY,
  message_id INT REFERENCES messages(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Indexes for message delivery status
CREATE INDEX idx_message_delivery_status_message_id ON message_delivery_status(message_id);
CREATE INDEX idx_message_delivery_status_user_id ON message_delivery_status(user_id);
CREATE INDEX idx_message_delivery_status_delivered_at ON message_delivery_status(delivered_at);

-- ========================================
-- INCIDENT MANAGEMENT SYSTEM
-- ========================================

-- Incidents
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
  incident_type incident_type_enum NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date_occurred DATE,
  status incident_status_enum DEFAULT 'active',
  last_edited_by INT REFERENCES users(id) ON DELETE SET NULL,
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident forms
CREATE TABLE incident_forms (
  id SERIAL PRIMARY KEY,
  incident_id INT REFERENCES incidents(id) ON DELETE CASCADE,
  form_type form_type_enum NOT NULL,
  form_data JSONB NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(incident_id, form_type)
);

-- Incident notes
CREATE TABLE incident_notes (
  id SERIAL PRIMARY KEY,
  incident_id INT REFERENCES incidents(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment plans (associated with incidents)
CREATE TABLE treatment_plans (
  id SERIAL PRIMARY KEY,
  incident_id INT REFERENCES incidents(id) ON DELETE CASCADE,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  treatment_goals TEXT NOT NULL,
  additional_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment phases (part of treatment plans)
CREATE TABLE treatment_phases (
  id SERIAL PRIMARY KEY,
  treatment_plan_id INT REFERENCES treatment_plans(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  duration INT NOT NULL,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('days', 'weeks', 'months')),
  frequency INT NOT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('per_day', 'per_week', 'per_month')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- REPORTING SYSTEM
-- ========================================

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id),
  doctor_id INT REFERENCES doctors(id),
  report_type TEXT NOT NULL,
  report_data JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- BLOG AND CONTENT MANAGEMENT
-- ========================================

-- Blog categories
CREATE TABLE blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_category_id INT REFERENCES blog_categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog tags
CREATE TABLE blog_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB NOT NULL,
  featured_image_url TEXT,
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  author_id INT REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  meta_description TEXT,
  view_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog post tags (many-to-many)
CREATE TABLE blog_post_tags (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id INT REFERENCES blog_tags(id) ON DELETE CASCADE,
  UNIQUE(post_id, tag_id)
);



-- ========================================
-- MIGRATION TRACKING
-- ========================================

CREATE TABLE pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Patient indexes
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_status ON patients(status);

-- Doctor indexes
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_status ON doctors(status);

-- Appointment indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_updated_by ON appointments(updated_by);

-- Clinical data indexes
CREATE INDEX idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_appointment_id ON clinical_notes(appointment_id);
CREATE INDEX idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX idx_vitals_appointment_id ON vitals(appointment_id);

-- Communication indexes
CREATE INDEX idx_conversations_patient_id ON conversations(patient_id);
CREATE INDEX idx_conversations_doctor_id ON conversations(doctor_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Incident indexes
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_patient_id ON incidents(patient_id);
CREATE INDEX idx_incidents_doctor_id ON incidents(doctor_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_status ON incidents(status);

-- Treatment plan indexes
CREATE INDEX idx_treatment_plans_incident_id ON treatment_plans(incident_id);
CREATE INDEX idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_doctor_id ON treatment_plans(doctor_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX idx_treatment_phases_treatment_plan_id ON treatment_phases(treatment_plan_id);
CREATE INDEX idx_treatment_phases_status ON treatment_phases(status);
CREATE INDEX idx_incident_forms_incident_id ON incident_forms(incident_id);
CREATE INDEX idx_incident_forms_type ON incident_forms(form_type);

-- Blog indexes
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Auth indexes
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX idx_login_sessions_event_type ON login_sessions(event_type);

-- ========================================
-- INITIAL DATA (OPTIONAL)
-- ========================================

-- Insert default admin user (password: 'admin123' - change in production!)
INSERT INTO users (email, username, password_hash, role, is_verified, phone_verified, status) VALUES
('admin@clinic.com', 'admin', '$2b$10$rKQhgGJmHrJhT3fkZJGmceRXhDYPk4YJXLkQhxKZVXzPGKxWvKFOW', 'admin', true, true, 'active');

-- Insert default doctor (password: 'Oces2023@')
INSERT INTO users (email, username, password_hash, role, is_verified, phone_verified, status) VALUES
('doctor@gmail.com', 'doctor', '$2a$12$MycIXQHLdgeTMiUZaJUrgOxWn0f8lmLIKWAg5ITF24c0dOufCxwqq', 'doctor', true, true, 'active');

-- Insert doctor profile
INSERT INTO doctors (user_id, first_name, last_name, specialization, phone_number, email, office_address, is_available, status) VALUES
(2, 'Dieu', 'Phan', 'Chiropractic', '+1-555-0123', 'doctor@gmail.com', '123 Main St, City, State 12345', true, 'active');

-- Insert doctor schedules for the existing doctor
-- Tuesday, Thursday, Saturday - appointments only (9H-17H)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, accepts_walkin) VALUES
(1, 2, '09:00', '17:00', TRUE, FALSE),
(1, 4, '09:00', '17:00', TRUE, FALSE),
(1, 6, '09:00', '17:00', TRUE, FALSE);

-- Monday, Wednesday - with walk-ins (9H-20H)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, accepts_walkin) VALUES
(1, 1, '09:00', '20:00', TRUE, TRUE),
(1, 3, '09:00', '20:00', TRUE, TRUE);

-- Friday - with walk-ins (9H-17H)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, accepts_walkin) VALUES
(1, 5, '09:00', '17:00', TRUE, TRUE);


-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description, is_active) VALUES
('Chiropractic Care', 'chiropractic-care', 'Articles about chiropractic treatments and care', true),
('Spine Health', 'spine-health', 'Information about spinal health and wellness', true),
('Pain Management', 'pain-management', 'Information about managing chronic and acute pain', true),
('Wellness & Prevention', 'wellness-prevention', 'Wellness tips and preventive care strategies', true),
('Exercise & Therapy', 'exercise-therapy', 'Exercise tips and therapeutic techniques', true),
('Nutrition & Lifestyle', 'nutrition-lifestyle', 'Nutritional advice and healthy lifestyle tips', true),
('Patient Stories', 'patient-stories', 'Real patient experiences and success stories', true);

-- Insert default blog tags
INSERT INTO blog_tags (name, slug) VALUES
('Back Pain', 'back-pain'),
('Neck Pain', 'neck-pain'),
('Headaches', 'headaches'),
('Exercise', 'exercise'),
('Nutrition', 'nutrition'),
('Wellness', 'wellness'),
('Prevention', 'prevention'),
('Treatment', 'treatment'),
('App Guide', 'app-guide'),
('Technology', 'technology'),
('Online Booking', 'online-booking'),
('About Doctor', 'about-doctor');
