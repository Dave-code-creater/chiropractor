CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INT,
  doctor_id INT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  clinic_id INT,
  status TEXT,
  reason_id INT,
  visit_number INT
);

CREATE TABLE IF NOT EXISTS treatment_notes (
  id SERIAL PRIMARY KEY,
  appointment_id INT,
  author_id INT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soap_notes (
  id SERIAL PRIMARY KEY,
  patient_id INT,
  appointment_id INT,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  note_date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS treatments (
  id SERIAL PRIMARY KEY,
  appointment_id INT,
  treatment_type TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
