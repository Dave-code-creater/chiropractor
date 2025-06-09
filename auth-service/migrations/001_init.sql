CREATE TYPE gender_enum_strict AS ENUM ('male','female','other');
CREATE TYPE role_enum AS ENUM ('patient','doctor','staff');

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

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  key TEXT UNIQUE NOT NULL, -- consider hashing for extra security
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

CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
