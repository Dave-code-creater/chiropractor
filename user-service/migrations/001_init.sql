CREATE TYPE insurance_type AS ENUM (
  'group','bcbs','workers_comp','auto','medicare','personal_injury','other'
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INT PRIMARY KEY,
  home_addr TEXT,
  city TEXT,
  state CHAR(2),
  zip TEXT,
  home_phone TEXT,
  work_addr TEXT,
  work_phone TEXT,
  occupation TEXT,
  employer TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id INT,
  name TEXT,
  relation TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS preliminary_info (
  id SERIAL PRIMARY KEY,
  user_id INT,
  referred_by TEXT,
  responsible_party TEXT,
  main_problems TEXT,
  other_healthcare TEXT,
  accident_date DATE,
  accident_time TIME,
  accident_location TEXT,
  accident_circumstances TEXT,
  lost_time BOOLEAN,
  lost_time_dates TEXT,
  pregnant BOOLEAN,
  children_count INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_details (
  id SERIAL PRIMARY KEY,
  user_id INT,
  insurance_type insurance_type,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chief_complaint (
  id SERIAL PRIMARY KEY,
  user_id INT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaint_locations (
  id SERIAL PRIMARY KEY,
  complaint_id INT,
  body_part_id INT,
  affected BOOLEAN DEFAULT TRUE,
  note TEXT
);

CREATE TABLE IF NOT EXISTS pain_chart (
  id SERIAL PRIMARY KEY,
  user_id INT,
  body_part_id INT,
  frequency SMALLINT,
  level SMALLINT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS history_accident (
  id SERIAL PRIMARY KEY,
  user_id INT,
  accident_date DATE,
  vehicle_model TEXT,
  location TEXT,
  seatbelt_used BOOLEAN,
  airbag_deployed BOOLEAN,
  police_present BOOLEAN,
  ambulance_called BOOLEAN,
  hospital_visited BOOLEAN,
  years_since INT,
  recovered BOOLEAN,
  description TEXT
);

CREATE TABLE IF NOT EXISTS home_exercises (
  id SERIAL PRIMARY KEY,
  user_id INT,
  appointment_id INT,
  name TEXT,
  description TEXT,
  compliance TEXT
);

CREATE TABLE IF NOT EXISTS pain_descriptions (
  id SERIAL PRIMARY KEY,
  user_id INT,
  start_time_id INT,
  level_id INT,
  frequency_id INT,
  type_id INT,
  location_id INT,
  radiates_to_id INT,
  associated_symptoms_id INT,
  activities_affected_id INT,
  additional_notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS treatment_goals (
  id SERIAL PRIMARY KEY,
  user_id INT,
  goal TEXT,
  achieved BOOLEAN DEFAULT FALSE,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
