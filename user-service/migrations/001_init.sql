-- ========================================
-- 1) ALL ENUM TYPES (must be first)
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
    CREATE TYPE gender AS ENUM ('Male','Female','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marriage_status') THEN
    CREATE TYPE marriage_status AS ENUM ('Single','Married','Divorced','Widowed','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'race') THEN
    CREATE TYPE race AS ENUM ('White','Black','Asian','Hispanic','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_type') THEN
    CREATE TYPE insurance_type AS ENUM ('Private','Medicare','Medicaid','Self-pay','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mental_work') THEN
    CREATE TYPE mental_work AS ENUM ('Sitting','Standing','Mixed','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'physical_work') THEN
    CREATE TYPE physical_work AS ENUM ('Light','Moderate','Heavy','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_level') THEN
    CREATE TYPE exercise_level AS ENUM ('None','Low','Moderate','High','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'smoking_status') THEN
    CREATE TYPE smoking_status AS ENUM ('Never','Former','Current','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'month_name') THEN
    CREATE TYPE month_name AS ENUM (
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'am_pm') THEN
    CREATE TYPE am_pm AS ENUM('AM','PM');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accident_cause') THEN
    CREATE TYPE accident_cause AS ENUM('Auto Collision','On the job','Other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alcohol_status') THEN
    CREATE TYPE alcohol_status AS ENUM('none','yes','no');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_time_type') THEN
    CREATE TYPE work_time_type AS ENUM('Full Time','Part Time');
  END IF;
END
$$;


-- ========================================
-- 2) PATIENT INTAKE (REQUIRED fields NOT NULL)
-- ========================================
CREATE TABLE IF NOT EXISTS patient_intake_responses (
  user_id               INT            PRIMARY KEY,

  first_name            TEXT           NOT NULL,
  middle_name           TEXT,
  last_name             TEXT           NOT NULL,
  ssn                   VARCHAR(11),

  day_of_birth          INT            NOT NULL
                                 CHECK (day_of_birth BETWEEN 1 AND 31),
  month_of_birth        month_name     NOT NULL,
  year_of_birth         CHAR(4)        NOT NULL
                                 CHECK (year_of_birth ~ '^[0-9]{4}$'),
  age                   INT,

  gender                gender         NOT NULL,

  marriage_status       marriage_status NOT NULL,
  race                  race           NOT NULL,

  street                TEXT           NOT NULL,
  city                  TEXT           NOT NULL,
  state                 CHAR(2)        NOT NULL,
  zip                   TEXT           NOT NULL,
  home_phone            TEXT           NOT NULL,

  employer              TEXT,
  occupation            TEXT,
  work_address          TEXT,
  work_phone            TEXT,

  spouse_phone          TEXT,

  emergency_contact_name          TEXT           NOT NULL,
  emergency_contact_phone         TEXT           NOT NULL,
  emergency_contact_relationship  TEXT           NOT NULL,

  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- ========================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL,
  name          TEXT,
  phone         TEXT,
  relationship  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- 3) INSURANCE DETAILS
-- ========================================
CREATE TABLE IF NOT EXISTS insurance_details (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL,
  insurance_type insurance_type,
  provider      TEXT,
  policy_number TEXT,
  details       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
CREATE TABLE IF NOT EXISTS pain_descriptions (
  user_id       INT        PRIMARY KEY,
  pain_chart    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 6) DETAILED SYMPTOM DESCRIPTION
-- ========================================
CREATE TABLE IF NOT EXISTS details_descriptions (
  user_id               INT        PRIMARY KEY,
  symptom_details       TEXT,
  main_complaints       TEXT,
  previous_healthcare   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 8) EXTENDED HEALTH HISTORY
-- ========================================
CREATE TABLE IF NOT EXISTS health_conditions (
  user_id                       INT        PRIMARY KEY

  has_past_medical_history      BOOLEAN,
  medical_condition_details     TEXT,
  has_past_surgical_history     BOOLEAN,
  surgical_history_details      TEXT,

  is_taking_medication          BOOLEAN,
  medication_names              TEXT[],

  family_history                JSONB,

  current_weight                TEXT,
  recent_weight_change          TEXT,
  mental_work                   mental_work,
  mental_work_hours_per_day     INT,
  physical_work                 physical_work,
  physical_work_hours_per_day   INT,
  exercise_level                exercise_level,
  exercise_hours_per_day        INT,
  smoking_status                smoking_status,
  packs_per_day                 NUMERIC(5,2),
  years_smoking                 INT,
  drink_status                  alcohol_status,
  beer_per_week                 INT,
  liquor_per_week               INT,
  wine_per_week                 INT,
  years_drinking                INT,

  currently_working             BOOLEAN,
  work_time_type                work_time_type,
  work_hours_per_day            INT,
  work_days_per_week            INT,
  job_description               TEXT,

  last_menstrual_period         TEXT,
  is_pregnant_now               BOOLEAN,
  weeks_pregnant                INT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 9) MIGRATION TRACKER
-- ========================================
CREATE TABLE IF NOT EXISTS pgmigrations (
  id     SERIAL       PRIMARY KEY,
  name   VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
