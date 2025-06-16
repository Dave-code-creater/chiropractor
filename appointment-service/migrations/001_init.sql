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

CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
