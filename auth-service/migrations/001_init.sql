CREATE TYPE gender_enum_strict AS ENUM ('male','female','other');
CREATE TYPE role_enum AS ENUM ('patient','doctor','staff');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role role_enum NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn TEXT,
  dob DATE,
  gender gender_enum_strict,
  nationality TEXT,
  marital_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  key TEXT UNIQUE NOT NULL,
  permission_code VARCHAR(10) DEFAULT '0000',
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
