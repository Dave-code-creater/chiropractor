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

-- Insert default blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, featured_image_url, category, tags, author_id, status, meta_description, published_at) VALUES
('Master Your Health Journey: Complete Guide to Our Chiropractic Management System', 'master-health-journey-chiropractic-app-guide', 
'Master our comprehensive chiropractic management system with features for appointments, health tracking, incident reporting, secure communication, and advanced analytics.',
'{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 1},
      "content": [{"type": "text", "text": "Master Your Health Journey: Complete Guide to Our Chiropractic Management System"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Welcome to the future of chiropractic care! Our comprehensive management system combines cutting-edge technology with personalized healthcare to provide you with an unparalleled experience. This guide will help you navigate every feature and maximize your health outcomes."}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Getting Started: Your Digital Health Hub"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Setting up your account is the first step to accessing world-class chiropractic care:"}]
    },
    {
      "type": "ordered_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Navigate to our secure registration portal and create your unique profile"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Complete the comprehensive health questionnaire to help us understand your needs"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Verify your contact information for seamless appointment notifications"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Upload insurance information and emergency contacts for complete care coordination"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Smart Appointment Scheduling"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Our intelligent booking system adapts to your schedule and healthcare needs:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Real-time availability calendar with Dr. Dieu Phan showing open slots"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Choose from consultation, adjustment, therapy, or follow-up appointment types"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Detailed symptom tracker to help prepare for your visit"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Automatic reminders via SMS and email to keep you on track"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Easy rescheduling and cancellation with 24-hour notice"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Comprehensive Health Records Management"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Transform how you track and understand your health progress with our advanced records system:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Interactive treatment timeline showing your complete care history"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Digital vital signs tracking with trend analysis and alerts"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Detailed clinical notes from each session with treatment outcomes"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Progress photos and range-of-motion measurements"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Exportable reports for insurance claims or specialist referrals"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Prescription and supplement tracking with refill reminders"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Advanced Incident Documentation System"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "When accidents happen, proper documentation is crucial for your recovery and legal protection:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Guided incident reporting for auto accidents, workplace injuries, and sports-related trauma"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Visual pain mapping tools to precisely document affected areas"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Daily pain and mobility tracking with severity scales"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Photo documentation for visual injury progression"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Automated report generation for attorneys and insurance companies"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Timeline reconstruction showing injury impact on daily activities"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Secure Communication Hub"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Stay connected with your healthcare team through our HIPAA-compliant messaging platform:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Direct messaging with Dr. Phan and clinic staff"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Video consultation capabilities for remote assessments"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Secure file sharing for X-rays, MRI results, and lab reports"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Automated health tips and exercise reminders"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Emergency contact system for urgent health concerns"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Group messaging for family members involved in care coordination"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Advanced Analytics and Insights"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Understand your health patterns with our intelligent analytics dashboard:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Personal health score based on treatment progress and lifestyle factors"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Predictive analytics for potential flare-ups or setbacks"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Treatment effectiveness comparisons and outcome predictions"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Lifestyle correlation tracking (sleep, exercise, stress levels)"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Goal setting and achievement tracking with milestone celebrations"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Cross-Platform Accessibility"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Access your health information anywhere, anytime with our responsive design that works seamlessly across all devices - from desktop computers to tablets and smartphones. Our progressive web app technology ensures fast loading times and offline functionality for critical features."}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Privacy and Security"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Your health information is protected with enterprise-grade security including end-to-end encryption, multi-factor authentication, and regular security audits. We comply with all HIPAA regulations and maintain SOC 2 Type II certification."}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "24/7 Support and Assistance"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Our dedicated support team is here to help you succeed:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Live chat support during business hours for immediate assistance"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Call us directly at +1-555-0123 for urgent technical issues"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Email support at doctor@gmail.com for detailed inquiries"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Comprehensive help center with video tutorials and FAQs"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "In-person training sessions available at our clinic"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Visit us at 123 Main St, City, State 12345 for hands-on support"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Start Your Health Journey Today"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Ready to experience the future of chiropractic care? Sign up today and discover how our comprehensive management system can transform your health journey. With personalized care plans, advanced tracking tools, and seamless communication, achieving your wellness goals has never been easier."}]
    }
  ]
}',
'https://images.pexels.com/photos/5473215/pexels-photo-5473215.jpeg',
'Wellness & Prevention',
'["Healthcare Technology", "Patient Management", "Digital Health", "Chiropractic Care", "Health Analytics"]',
2,
'published',
'Master our comprehensive chiropractic management system with features for appointments, health tracking, incident reporting, secure communication, and advanced analytics.',
NOW()),

-- How to Create an Account
('How to Create Your Account: Getting Started with Our Chiropractic App', 'how-to-create-account-chiropractic-app',
'Learn how to create your patient account step-by-step and get started with our comprehensive chiropractic care system.',
'{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 1},
      "content": [{"type": "text", "text": "How to Create Your Account: Getting Started with Our Chiropractic App"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Creating your patient account is the first step toward accessing comprehensive chiropractic care. This simple process takes just a few minutes and unlocks all the features of our healthcare management system."}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 1: Access the Registration Page"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Visit our website or open the mobile app and click the \"Sign Up\" or \"Create Account\" button. You''ll be directed to our secure registration portal."}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 2: Enter Basic Information"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Fill in your essential details:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Full name (first, middle, last)"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Email address (this will be your login username)"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Phone number for appointment notifications"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Date of birth"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Create a secure password"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 3: Complete Your Profile"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Add additional information to personalize your care:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Home address for location-based services"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Emergency contact information"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Primary reason for seeking chiropractic care"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Current pain level or health concerns"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 4: Insurance Information"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Upload your insurance details for seamless billing:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Insurance provider name"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Policy number and group number"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Photo of insurance card (front and back)"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 5: Verify Your Account"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Complete the verification process:"}]
    },
    {
      "type": "ordered_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Check your email for a verification link"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Click the link to verify your email address"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Verify your phone number via SMS code"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Accept terms of service and privacy policy"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Welcome to Your Health Journey!"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Congratulations! Your account is now active. You can immediately start booking appointments, accessing health resources, and communicating with Dr. Dieu Phan and our care team."}]
    }
  ]
}',
'https://images.pexels.com/photos/33206676/pexels-photo-33206676.jpeg',
'Wellness & Prevention',
'["Account Setup", "Getting Started", "Patient Registration"]',
2,
'published',
'Learn how to create your patient account step-by-step and get started with our comprehensive chiropractic care system.',
NOW()),

-- How to Book an Appointment
('How to Book Your Appointment: Easy Scheduling with Dr. Dieu Phan', 'how-to-book-appointment-dr-dieu-phan',
'Complete guide to booking appointments online, choosing the right appointment type, and preparing for your visit.',
'{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 1},
      "content": [{"type": "text", "text": "How to Book Your Appointment: Easy Scheduling with Dr. Dieu Phan"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Booking your chiropractic appointment has never been easier! Our online scheduling system is available 24/7 and lets you choose the perfect time that fits your schedule."}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 1: Access the Booking System"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Log into your account and navigate to the \"Book Appointment\" section. You''ll see Dr. Dieu Phan''s real-time availability calendar."}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 2: Choose Your Appointment Type"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Select the type of visit that best matches your needs:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Initial Consultation (60 minutes) - Comprehensive evaluation for new patients"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Chiropractic Adjustment (30 minutes) - Standard treatment session"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Follow-up Visit (20 minutes) - Progress check and minor adjustments"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Therapy Session (45 minutes) - Specialized therapeutic treatment"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Emergency Visit (15 minutes) - Urgent pain or injury assessment"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 3: Select Date and Time"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Dr. Phan''s schedule varies by day to accommodate different patient needs:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Monday & Wednesday: 9:00 AM - 8:00 PM (Walk-ins welcome)"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Tuesday, Thursday, Saturday: 9:00 AM - 5:00 PM (Appointments only)"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Friday: 9:00 AM - 5:00 PM (Walk-ins welcome)"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 4: Provide Visit Details"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Help us prepare for your visit by providing:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Primary reason for your visit (back pain, neck pain, headaches, etc.)"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Current pain level (1-10 scale)"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "How long you''ve been experiencing symptoms"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Any recent injuries or incidents"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Special accommodations needed"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Step 5: Review and Confirm"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Double-check all your appointment details:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Date and time of appointment"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Type and duration of visit"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Insurance information and copay amount"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Contact information for reminders"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Appointment Confirmation"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Once booked, you''ll receive:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Immediate email confirmation with appointment details"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "SMS reminder 24 hours before your visit"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Pre-visit instructions and forms to complete"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Clinic address and parking information"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Need to Make Changes?"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Life happens! You can easily reschedule or cancel your appointment up to 24 hours in advance through your patient portal or by calling our clinic at +1-555-0123."}]
    }
  ]
}',
'https://images.pexels.com/photos/5408684/pexels-photo-5408684.jpeg',
'Chiropractic Care',
'["Appointment Booking", "Scheduling", "Patient Guide"]',
2,
'published',
'Step-by-step guide to booking appointments with Dr. Dieu Phan, including appointment types, scheduling options, and what to expect.',
NOW()),

-- How to Download the App
('Download Our Chiropractic App: Your Health in Your Pocket', 'download-chiropractic-app-mobile-health',
'Get our mobile app for iOS and Android devices to manage appointments, track health, and communicate with your care team anywhere.',
'{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 1},
      "content": [{"type": "text", "text": "Download Our Chiropractic App: Your Health in Your Pocket"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Take control of your health journey with our mobile app! Access all your chiropractic care features on-the-go, from booking appointments to tracking your progress."}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Available on All Platforms"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Our app is available for all major devices and platforms:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "iOS devices (iPhone, iPad) - Download from the App Store"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Android devices - Download from Google Play Store"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Web browsers - Access via our responsive website"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Tablets and desktop computers"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "How to Download for iOS (iPhone/iPad)"}]
    },
    {
      "type": "ordered_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Open the App Store on your iOS device"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Search for \"Dr. Dieu Phan Chiropractic\" or \"Chiropractic Care App\""}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Look for our official app with the clinic logo"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Tap \"Get\" or \"Download\" to install"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Wait for installation to complete"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Open the app and log in with your patient credentials"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "How to Download for Android"}]
    },
    {
      "type": "ordered_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Open the Google Play Store on your Android device"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Search for \"Dr. Dieu Phan Chiropractic\" in the search bar"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Select our official app from the search results"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Tap \"Install\" to download and install the app"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Allow necessary permissions when prompted"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Launch the app and sign in to your account"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "System Requirements"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Ensure your device meets these minimum requirements:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "iOS 12.0 or later for iPhone and iPad"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Android 8.0 (API level 26) or later"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "At least 100MB of free storage space"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Stable internet connection (Wi-Fi or mobile data)"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Camera access for uploading documents (optional)"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Key Features Available in the App"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Once downloaded, you''ll have access to:"}]
    },
    {
      "type": "bullet_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "24/7 appointment booking and rescheduling"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Secure messaging with Dr. Phan and staff"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Health records and treatment history"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Pain tracking and progress monitoring"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Incident reporting for injuries"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Appointment reminders and notifications"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Insurance information management"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Educational resources and exercise videos"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "First-Time Setup"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "After downloading, follow these steps:"}]
    },
    {
      "type": "ordered_list",
      "content": [
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Open the app and tap \"Sign In\" if you have an account"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Or tap \"Create Account\" if you''re a new patient"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Allow push notifications for appointment reminders"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Enable location services for clinic directions"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Complete your profile information"}]}]},
        {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Add emergency contacts and insurance details"}]}]}
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "Troubleshooting Common Issues"}]
    },
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "If you experience any problems:"}]
    },
    {
      "type": "bullet_list",
      "content": [
            {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Ensure you have the latest app version from the store"}]}]},
            {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Check your internet connection"}]}]},
            {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Restart the app and try again"}]}]},
            {"type": "list_item", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Email technical support at doctor@gmail.com"}]}]}
          ]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Start Managing Your Health Today!"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Download our app now and experience the convenience of modern healthcare management. Your journey to better health is just a tap away!"}]
        }
      ]
    }',
'https://images.pexels.com/photos/5444435/pexels-photo-5444435.jpeg',
'Wellness & Prevention',
'["Mobile App", "Technology", "Patient Tools"]',
2,
'published',
'Download our mobile chiropractic app for iOS and Android to manage appointments, track health, and stay connected with your care team.',
NOW());-- Record migration
INSERT INTO pgmigrations (name) VALUES ('001_complete_schema');

-- ========================================
-- SCHEMA COMPLETE
-- ========================================

-- Schema creation completed successfully
-- Next steps:
-- 1. Update database connection in application
-- 2. Run application migrations if needed
-- 3. Create application-specific indexes as needed
-- 4. Set up regular database maintenance tasks 