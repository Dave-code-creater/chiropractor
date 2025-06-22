-- ========================================
-- TEMPLATE-BASED FORMS SYSTEM
-- Migration 002: Template Forms and Reports
-- ========================================

-- Reports table (main container for all form data)
CREATE TABLE IF NOT EXISTS reports (
  id                    TEXT           PRIMARY KEY,
  name                  TEXT           NOT NULL,
  template_id           TEXT,
  template_data         JSONB,
  patient_id            TEXT           REFERENCES patients(id) ON DELETE SET NULL,
  status                TEXT           DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  category              TEXT           NOT NULL CHECK (category IN ('consultation', 'follow-up', 'assessment')),
  completion_percentage INT            DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_by            TEXT           NOT NULL,
  assigned_to           TEXT           NOT NULL,
  created_at            TIMESTAMPTZ    DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    DEFAULT NOW()
);

-- Patient Intake Forms (template-based)
CREATE TABLE IF NOT EXISTS patient_intakes (
  id                            TEXT           PRIMARY KEY,
  report_id                     TEXT           REFERENCES reports(id) ON DELETE CASCADE,
  first_name                    TEXT           NOT NULL,
  middle_name                   TEXT,
  last_name                     TEXT           NOT NULL,
  ssn                           TEXT,
  dob                           DATE           NOT NULL,
  gender                        TEXT           NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  status                        TEXT           CHECK (status IN ('Single', 'Married', 'Divorced', 'Widowed')),
  race                          TEXT           CHECK (race IN ('Asian', 'Black', 'Caucasian', 'Hispanic', 'Other')),
  street                        TEXT,
  city                          TEXT,
  state                         TEXT,
  zip                           TEXT,
  home_phone                    TEXT,
  employer                      TEXT,
  occupation                    TEXT,
  work_address                  TEXT,
  work_phone                    TEXT,
  spouse_phone                  TEXT,
  contact1                      TEXT,
  contact1_phone                TEXT,
  contact1_relationship         TEXT,
  template_info                 JSONB,
  created_at                    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ    DEFAULT NOW()
);

-- Insurance Details Forms (template-based)
CREATE TABLE IF NOT EXISTS insurance_details_forms (
  id                            TEXT           PRIMARY KEY,
  report_id                     TEXT           REFERENCES reports(id) ON DELETE CASCADE,
  type_car                      TEXT,
  accident_date                 DATE,
  accident_time                 TIME,
  accident_time_period          TEXT           CHECK (accident_time_period IN ('AM', 'PM')),
  accident_location             TEXT,
  accident_type                 TEXT,
  accident_description          TEXT,
  accident_awareness            TEXT,
  accident_appearance_ambulance TEXT,
  airbag_deployment             TEXT,
  seatbelt_use                  TEXT,
  police_appearance             TEXT,
  any_past_accidents            TEXT,
  lost_work_yes_no              TEXT,
  lost_work_dates               TEXT,
  pregnant                      TEXT,
  children_info                 TEXT,
  covered                       TEXT,
  insurance_type                TEXT,
  template_info                 JSONB,
  created_at                    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ    DEFAULT NOW()
);

-- Pain Evaluations (template-based)
CREATE TABLE IF NOT EXISTS pain_evaluations (
  id                            TEXT           PRIMARY KEY,
  report_id                     TEXT           REFERENCES reports(id) ON DELETE CASCADE,
  pain_map                      JSONB          NOT NULL,
  form_data                     JSONB,
  template_info                 JSONB,
  created_at                    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ    DEFAULT NOW()
);

-- Detailed Descriptions (template-based)
CREATE TABLE IF NOT EXISTS detailed_descriptions (
  id                            TEXT           PRIMARY KEY,
  report_id                     TEXT           REFERENCES reports(id) ON DELETE CASCADE,
  symptom_details               TEXT           NOT NULL,
  main_complaints               TEXT,
  previous_healthcare           TEXT,
  template_info                 JSONB,
  created_at                    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ    DEFAULT NOW()
);

-- Work Impact Forms (template-based)
CREATE TABLE IF NOT EXISTS work_impact (
  id                            TEXT           PRIMARY KEY,
  report_id                     TEXT           REFERENCES reports(id) ON DELETE CASCADE,
  work_activities               TEXT[],
  lost_work                     TEXT,
  lost_work_dates               TEXT,
  work_limitations              TEXT,
  return_to_work_date           DATE,
  work_restrictions             TEXT,
  template_info                 JSONB,
  created_at                    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ    DEFAULT NOW()
);

-- Health Conditions Forms (template-based)
CREATE TABLE IF NOT EXISTS health_conditions_forms (
  id                            TEXT           PRIMARY KEY,
  report_id                     TEXT           REFERENCES reports(id) ON DELETE CASCADE,
  has_condition                 TEXT           NOT NULL,
  condition_details             TEXT,
  has_surgical_history          TEXT,
  surgical_history_details      TEXT,
  medication                    TEXT,
  medication_names              TEXT,
  currently_working             TEXT,
  work_times                    TEXT,
  work_hours_per_day            TEXT,
  work_days_per_week            TEXT,
  job_description               TEXT,
  last_menstrual_period         TEXT,
  is_pregnant_now               TEXT,
  weeks_pregnant                TEXT,
  template_info                 JSONB,
  created_at                    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ    DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_to ON reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE INDEX IF NOT EXISTS idx_patient_intakes_report_id ON patient_intakes(report_id);
CREATE INDEX IF NOT EXISTS idx_insurance_details_report_id ON insurance_details_forms(report_id);
CREATE INDEX IF NOT EXISTS idx_pain_evaluations_report_id ON pain_evaluations(report_id);
CREATE INDEX IF NOT EXISTS idx_detailed_descriptions_report_id ON detailed_descriptions(report_id);
CREATE INDEX IF NOT EXISTS idx_work_impact_report_id ON work_impact(report_id);
CREATE INDEX IF NOT EXISTS idx_health_conditions_report_id ON health_conditions_forms(report_id);

-- Add constraints for data integrity
ALTER TABLE reports ADD CONSTRAINT check_completion_percentage 
  CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

-- Record migration
INSERT INTO pgmigrations (name, run_on) 
VALUES ('002_template_forms', NOW()) 
ON CONFLICT DO NOTHING; 