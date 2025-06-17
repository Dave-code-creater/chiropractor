-- ========================================
-- 1) ALL ENUM TYPES (must be first)
-- ========================================
CREATE TYPE IF NOT EXISTS gender           AS ENUM ('Male','Female','Other');
CREATE TYPE IF NOT EXISTS marriage_status  AS ENUM ('Single','Married','Divorced','Widowed','Other');
CREATE TYPE IF NOT EXISTS race             AS ENUM ('White','Black','Asian','Hispanic','Other');
CREATE TYPE IF NOT EXISTS insurance_type   AS ENUM ('Private','Medicare','Medicaid','Self-pay','Other');
CREATE TYPE IF NOT EXISTS mental_work      AS ENUM ('Sitting','Standing','Mixed','Other');
CREATE TYPE IF NOT EXISTS physical_work    AS ENUM ('Light','Moderate','Heavy','Other');
CREATE TYPE IF NOT EXISTS exercise_level   AS ENUM ('None','Low','Moderate','High','Other');
CREATE TYPE IF NOT EXISTS smoking_status   AS ENUM ('Never','Former','Current','Other');

CREATE TYPE IF NOT EXISTS month_name       AS ENUM (
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
);

CREATE TYPE IF NOT EXISTS am_pm            AS ENUM('AM','PM');

CREATE TYPE IF NOT EXISTS accident_cause   AS ENUM(
  'Auto Collision','On the job','Other'
);

CREATE TYPE IF NOT EXISTS alcohol_status  AS ENUM('none','yes','no');

CREATE TYPE IF NOT EXISTS work_time_type  AS ENUM('Full Time','Part Time');


-- ========================================
-- 2) PARENT TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
  user_id       SERIAL PRIMARY KEY,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 3) PATIENT INTAKE (REQUIRED fields NOT NULL)
-- ========================================
CREATE TABLE IF NOT EXISTS patient_intake_responses (
  user_id               INT            PRIMARY KEY
                                 REFERENCES profiles(user_id)
                                   ON DELETE CASCADE,

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

  contact1              TEXT           NOT NULL,
  contact1_phone        TEXT           NOT NULL,
  contact1_relationship TEXT           NOT NULL,

  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- ========================================
-- 4) ACCIDENT & INSURANCE (ALL COLUMNS NULLABLE)
-- ========================================
CREATE TABLE IF NOT EXISTS accident_insurance_responses (
  user_id                INT           PRIMARY KEY
                                   REFERENCES profiles(user_id)
                                     ON DELETE CASCADE,

  type_of_car            TEXT,
  accident_date          DATE,
  accident_time          TIME,
  accident_time_period   am_pm,
  accident_location      TEXT,
  accident_cause         accident_cause,
  accident_description   TEXT,
  awareness_of_accident  BOOLEAN,
  ambulance_notes        TEXT,
  airbag_deployed        BOOLEAN,
  seatbelt_used          BOOLEAN,
  police_on_scene        BOOLEAN,
  past_accidents_notes   TEXT,

  lost_time              BOOLEAN,
  lost_time_dates        TEXT,

  pregnant               BOOLEAN,
  children_info          TEXT,

  covered_by_insurance   BOOLEAN,
  insurance_type         insurance_type,
  insurance_details      TEXT,

  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ========================================
-- 5) PAIN & SYMPTOM EVAL (OPTIONAL)
-- ========================================
CREATE TABLE IF NOT EXISTS pain_evaluation_responses (
  user_id       INT        PRIMARY KEY
                     REFERENCES profiles(user_id)
                       ON DELETE CASCADE,
  pain_chart    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 6) DETAILED SYMPTOM DESCRIPTION
-- ========================================
CREATE TABLE IF NOT EXISTS symptom_details_responses (
  user_id               INT        PRIMARY KEY
                            REFERENCES profiles(user_id)
                              ON DELETE CASCADE,

  symptom_details       TEXT,
  main_complaints       TEXT,
  previous_healthcare   TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 7) RECOVERY & WORK IMPACT
-- ========================================
CREATE TABLE IF NOT EXISTS work_impact_responses (
  user_id        INT        PRIMARY KEY
                        REFERENCES profiles(user_id)
                          ON DELETE CASCADE,
  work_activities TEXT[],
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 8) EXTENDED HEALTH HISTORY
-- ========================================
CREATE TABLE IF NOT EXISTS extended_health_history_responses (
  user_id                       INT        PRIMARY KEY
                                 REFERENCES profiles(user_id)
                                   ON DELETE CASCADE,

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

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 9) MIGRATION TRACKER
-- ========================================
CREATE TABLE IF NOT EXISTS pgmigrations (
  id     SERIAL       PRIMARY KEY,
  name   VARCHAR(255) NOT NULL,
  run_on TIMESTAMPTZ NOT NULL
);
