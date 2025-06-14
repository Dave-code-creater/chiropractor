CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  doctor_id INT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
