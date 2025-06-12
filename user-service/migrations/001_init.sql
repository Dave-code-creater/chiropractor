-- ========================================
-- Lookup types
-- ========================================

CREATE TYPE insurance_type AS ENUM (
  'group',
  'bcbs',
  'workers_comp',
  'auto',
  'medicare',
  'personal_injury',
  'other'
);

CREATE TYPE gender AS ENUM (
  'male',
  'female',
  'other'
);

CREATE TYPE mental_work AS ENUM (
  'light',
  'moderate',
  'heavy'
);

CREATE TYPE exercise_level AS ENUM (
  'none',
  'light',
  'moderate',
  'heavy'
);

CREATE TYPE physical_work AS ENUM (
  'light',
  'moderate',
  'heavy'
);

CREATE TYPE smoking_status AS ENUM (
  'never',
  'former',
  'current'
);

CREATE TYPE marriage_status AS ENUM (
  'single',
  'married',
  'divorced',
  'widowed',
  'separated'
);

CREATE TYPE race AS ENUM (
  'white',
  'black',
  'asian',
  'hispanic',
  'native_american',
  'pacific_islander',
  'other'
);

CREATE TYPE pain_kind AS ENUM (
  'sharp',
  'dull',
  'burning',
  'aching',
  'stabbing',
  'muscle_tension',
  'numbness',
  'pins_and_needles',
  'constant',
  'continuous',
  'intermittent',
  'throbbing',
  'radiating',
  'stiffness',
  'swelling',
  'tingling',
  'soreness',
  'tightness',
  'twitching',
  'weakness',
  'spasmodic',
  'blurriness',
  'dizziness',
  'fainting',
  'nauseous',
  'vomiting'
);

CREATE TYPE pain_level AS ENUM (
  'no_pain',
  'mildly_less',
  'mild',
  'mild_to_moderate',
  'moderate_achy',
  'moderate',
  'moderate_to_severe',
  'severe',
  'severe_to_unbearable',
  'unbearable',
  'worst_pain_ever'
);

CREATE TYPE activity_effect AS ENUM (
  'sitting',
  'standing',
  'walking',
  'bending',
  'lifting',
  'working',
  'sleeping',
  'twisting',
  'other'
);


-- ========================================
-- Core tables
-- ========================================

CREATE TABLE IF NOT EXISTS profiles (
  user_id         INT             PRIMARY KEY,
  first_name      TEXT            NOT NULL,
  last_name       TEXT            NOT NULL,
  date_of_birth   DATE            NOT NULL,
  gender          gender          NOT NULL,
  age             INT             NOT NULL,
  marriage_status marriage_status NOT NULL,
  race            race            NOT NULL,
  home_addr       TEXT            NOT NULL,
  city            TEXT            NOT NULL,
  state           CHAR(2),
  zip             TEXT            NOT NULL,
  home_phone      TEXT            NOT NULL,
  employer_name   TEXT,
  work_addr       TEXT,
  work_phone      TEXT,
  occupation      TEXT,
  spouse_first_name TEXT,
  spouse_last_name TEXT,
  spouse_phone    TEXT,
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id         SERIAL         PRIMARY KEY,
  user_id    INT            NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  first_name TEXT           NOT NULL,
  last_name  TEXT           NOT NULL,
  relation   TEXT,
  phone      TEXT           NOT NULL
);

CREATE TABLE IF NOT EXISTS preliminary_info (
  id                       SERIAL       PRIMARY KEY,
  user_id                  INT          NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  car                      TEXT,
  accident_date            DATE,
  accident_time            TIME,
  accident_location        TEXT,
  occurs                   TEXT,
  accident_circumstances   TEXT,
  awareness_of_accident    BOOLEAN      NOT NULL DEFAULT FALSE,
  pregnant                 BOOLEAN      NOT NULL DEFAULT FALSE,
  children_count           INT          NOT NULL DEFAULT 0,
  is_ambulance             BOOLEAN      NOT NULL DEFAULT FALSE,
  is_wearing_seatbelt      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_police_reported       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_airbag_deployed       BOOLEAN      NOT NULL DEFAULT FALSE,
  past_accidents           BOOLEAN      NOT NULL DEFAULT FALSE,
  past_accidents_details   TEXT,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_details (
  id                  SERIAL             PRIMARY KEY,
  user_id             INT                NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  insurance_type      insurance_type     NOT NULL,
  details             TEXT,
  is_lost_time_claim  BOOLEAN            DEFAULT FALSE,
  impacted_activities TEXT[]             NOT NULL DEFAULT '{}',
  date_lost           INT,
  created_at          TIMESTAMPTZ        NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pain_descriptions (
  id                            SERIAL         PRIMARY KEY,
  user_id                       INT            NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  level_id                      INT,
  pain                          pain_kind[]    NOT NULL DEFAULT '{}',
  pain_level                    pain_level[]   NOT NULL DEFAULT '{}',
  frequency                     TEXT[]         NOT NULL DEFAULT '{}',
  intensity_compared_to_yesterday BOOLEAN      NOT NULL DEFAULT FALSE,
  activity_effect               activity_effect[] NOT NULL DEFAULT '{}',
  is_travel_or_radiation        BOOLEAN        NOT NULL DEFAULT FALSE,
  recorded_at                   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS details_description (
  id                       SERIAL       PRIMARY KEY,
  user_id                  INT          NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  description_symptoms     TEXT,
  description_problems     TEXT,
  description_health_care  TEXT,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_conditions (
  id                             SERIAL         PRIMARY KEY,
  user_id                        INT            NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,

  -- Past Medical History
  has_past_medical_history       BOOLEAN        NOT NULL DEFAULT FALSE,
  past_medical_history_details   TEXT,

  -- Past Surgical History
  has_past_surgical_history      BOOLEAN        NOT NULL DEFAULT FALSE,
  past_surgical_history_details  TEXT,

  -- Medication
  is_taking_medication           BOOLEAN        NOT NULL DEFAULT FALSE,
  medication_details             TEXT[]         NOT NULL DEFAULT '{}',

  -- Social History
  current_weight_kg              NUMERIC(6,2),
  weight_change                  TEXT,
  mental_work_level              mental_work,
  mental_work_hours_per_day      INT,
  physical_work_level            physical_work,
  physical_work_hours_per_day    INT,
  exercise_level                 exercise_level,
  exercise_hours_per_day         INT,
  smoking_status                 smoking_status,
  packs_per_day                  NUMERIC(5,2),
  years_smoking                  INT,
  beer_per_week                  INT,
  liquor_per_week                INT,
  wine_per_week                  INT,
  years_drinking                 INT,

  -- Occupational History
  is_currently_working           BOOLEAN        NOT NULL DEFAULT FALSE,
  work_times                     TEXT,
  work_hours_per_day             INT,
  work_days_per_week             INT,
  job_requirements               TEXT,

  -- Female-Specific
  last_menstrual_period          TEXT,
  could_be_pregnant              BOOLEAN        NOT NULL DEFAULT FALSE,

  created_at                     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at                     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pgmigrations (
  id       SERIAL     PRIMARY KEY,
  name     VARCHAR(255) NOT NULL,
  run_on   TIMESTAMPTZ  NOT NULL
);