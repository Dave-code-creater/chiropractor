-- ========================================
-- 1) Re‐used ENUMS
-- ========================================
-- (assumes these already exist in your DB)
--   gender, marriage_status, race, insurance_type,
--   mental_work, physical_work, exercise_level, smoking_status

CREATE TYPE month_name AS ENUM (
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
);

CREATE TYPE am_pm AS ENUM('AM','PM');

CREATE TYPE accident_cause AS ENUM(
  'Auto Collision','On the job','Other'
);

CREATE TYPE alcohol_status AS ENUM('none','yes','no');

CREATE TYPE work_time_type AS ENUM('Full Time','Part Time');


-- ========================================
-- 2) Patient Intake (REQUIRED fields NOT NULL)
-- ========================================
-- Deprecated table kept for reference
CREATE TABLE IF NOT EXISTS patient_intake_responses (
  user_id     INT PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  data        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);


-- ========================================
-- 3) Accident & Insurance (ALL columns NULLABLE)
-- ========================================
CREATE TABLE accident_insurance_responses (
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
-- 4) Pain & Symptom Eval (OPTIONAL)
-- ========================================
CREATE TABLE pain_evaluation_responses (
  user_id       INT        PRIMARY KEY
                     REFERENCES profiles(user_id)
                     ON DELETE CASCADE,
  pain_chart    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 5) Detailed Symptom Description
-- ========================================
CREATE TABLE symptom_details_responses (
  user_id               INT        PRIMARY KEY
                            REFERENCES profiles(user_id)
                            ON DELETE CASCADE,

  symptom_details       TEXT,
  main_complaints       TEXT,
  previous_healthcare   TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 6) Recovery & Work Impact
-- ========================================
CREATE TABLE work_impact_responses (
  user_id        INT        PRIMARY KEY
                        REFERENCES profiles(user_id)
                        ON DELETE CASCADE,
  work_activities TEXT[],
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- 7) Extended Health History
-- ========================================
CREATE TABLE extended_health_history_responses (
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