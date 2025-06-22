-- Migration: 003_clinical_notes_vitals.sql
-- Description: Add clinical notes and vitals management tables
-- Date: January 2025

BEGIN;

-- =====================================================
-- Clinical Notes Table
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_notes (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    diagnosis TEXT,
    treatment_plan TEXT,
    follow_up_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    tags TEXT[],
    
    -- Metadata
    created_by INTEGER NOT NULL,
    updated_by INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_note_type CHECK (note_type IN ('general', 'treatment', 'assessment', 'progress', 'discharge', 'consultation')),
    CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT chk_content_length CHECK (LENGTH(content) >= 10 AND LENGTH(content) <= 5000),
    CONSTRAINT chk_diagnosis_length CHECK (diagnosis IS NULL OR LENGTH(diagnosis) <= 500),
    CONSTRAINT chk_treatment_plan_length CHECK (treatment_plan IS NULL OR LENGTH(treatment_plan) <= 1000)
);

-- =====================================================
-- Patient Vitals Table
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_vitals (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Blood Pressure
    systolic_bp NUMERIC(5,2) CHECK (systolic_bp IS NULL OR (systolic_bp >= 60 AND systolic_bp <= 250)),
    diastolic_bp NUMERIC(5,2) CHECK (diastolic_bp IS NULL OR (diastolic_bp >= 30 AND diastolic_bp <= 150)),
    
    -- Heart Rate
    heart_rate INTEGER CHECK (heart_rate IS NULL OR (heart_rate >= 30 AND heart_rate <= 250)),
    
    -- Temperature
    temperature NUMERIC(5,2) CHECK (temperature IS NULL OR (temperature >= 90 AND temperature <= 110)),
    temperature_unit VARCHAR(1) DEFAULT 'F' CHECK (temperature_unit IN ('F', 'C')),
    
    -- Respiratory Rate
    respiratory_rate INTEGER CHECK (respiratory_rate IS NULL OR (respiratory_rate >= 8 AND respiratory_rate <= 60)),
    
    -- Oxygen Saturation
    oxygen_saturation NUMERIC(5,2) CHECK (oxygen_saturation IS NULL OR (oxygen_saturation >= 70 AND oxygen_saturation <= 100)),
    
    -- Weight & Height
    weight NUMERIC(6,2) CHECK (weight IS NULL OR (weight >= 50 AND weight <= 1000)),
    weight_unit VARCHAR(3) DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
    height NUMERIC(5,2) CHECK (height IS NULL OR (height >= 36 AND height <= 96)),
    height_unit VARCHAR(2) DEFAULT 'in' CHECK (height_unit IN ('in', 'cm')),
    
    -- BMI (calculated or manually entered)
    bmi NUMERIC(4,1) CHECK (bmi IS NULL OR (bmi >= 10 AND bmi <= 80)),
    
    -- Pain Scale
    pain_level INTEGER CHECK (pain_level IS NULL OR (pain_level >= 0 AND pain_level <= 10)),
    
    -- Additional Information
    notes TEXT CHECK (notes IS NULL OR LENGTH(notes) <= 1000),
    position VARCHAR(20) CHECK (position IS NULL OR position IN ('sitting', 'standing', 'lying')),
    vital_type VARCHAR(20) DEFAULT 'routine' CHECK (vital_type IN ('routine', 'pre_treatment', 'post_treatment', 'emergency', 'follow_up')),
    
    -- Metadata
    recorded_by INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure at least one vital sign is recorded
    CONSTRAINT chk_has_vital_sign CHECK (
        systolic_bp IS NOT NULL OR
        diastolic_bp IS NOT NULL OR
        heart_rate IS NOT NULL OR
        temperature IS NOT NULL OR
        respiratory_rate IS NOT NULL OR
        oxygen_saturation IS NOT NULL OR
        weight IS NOT NULL OR
        height IS NOT NULL OR
        pain_level IS NOT NULL
    )
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Clinical Notes Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created_at ON clinical_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_note_type ON clinical_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created_by ON clinical_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_priority ON clinical_notes(priority);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_follow_up_date ON clinical_notes(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Full-text search index for notes content
CREATE INDEX IF NOT EXISTS idx_clinical_notes_content_search ON clinical_notes USING gin(to_tsvector('english', content));

-- Patient Vitals Indexes
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id ON patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_recorded_at ON patient_vitals(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_vital_type ON patient_vitals(vital_type);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_recorded_by ON patient_vitals(recorded_by);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_date ON patient_vitals(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_date ON clinical_notes(patient_id, created_at DESC);

-- =====================================================
-- Functions for Automatic Timestamps
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_clinical_notes_updated_at 
    BEFORE UPDATE ON clinical_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_vitals_updated_at 
    BEFORE UPDATE ON patient_vitals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- Latest vitals per patient
CREATE OR REPLACE VIEW latest_patient_vitals AS
SELECT DISTINCT ON (patient_id) 
    patient_id,
    systolic_bp,
    diastolic_bp,
    heart_rate,
    temperature,
    temperature_unit,
    respiratory_rate,
    oxygen_saturation,
    weight,
    weight_unit,
    height,
    height_unit,
    bmi,
    pain_level,
    recorded_at,
    recorded_by
FROM patient_vitals
ORDER BY patient_id, recorded_at DESC;

-- Recent notes per patient (last 5)
CREATE OR REPLACE VIEW recent_patient_notes AS
SELECT 
    patient_id,
    id as note_id,
    note_type,
    content,
    diagnosis,
    priority,
    created_at,
    created_by,
    ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY created_at DESC) as rn
FROM clinical_notes
WHERE ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY created_at DESC) <= 5;

-- =====================================================
-- Sample Data (Optional - for development)
-- =====================================================

-- Note: Uncomment the following section if you want sample data for development

/*
-- Insert sample clinical notes (assuming patient IDs 1, 2, 3 exist)
INSERT INTO clinical_notes (patient_id, note_type, content, diagnosis, created_by) VALUES
(1, 'assessment', 'Patient presents with lower back pain following lifting incident at work. Pain level 7/10, radiating to left leg. No numbness or tingling reported.', 'Acute lumbar strain', 1),
(1, 'treatment', 'Applied chiropractic adjustment to L4-L5. Patient reported immediate relief. Prescribed ice therapy and gentle stretching exercises.', 'Acute lumbar strain', 1),
(2, 'assessment', 'Follow-up visit for neck pain. Patient reports 50% improvement since last visit. Range of motion improved.', 'Cervical strain - improving', 1),
(3, 'consultation', 'Initial consultation for chronic headaches. Patient reports daily headaches for past 3 months. Stress-related tension noted.', 'Tension headaches', 1);

-- Insert sample vitals (assuming patient IDs 1, 2, 3 exist)
INSERT INTO patient_vitals (patient_id, systolic_bp, diastolic_bp, heart_rate, temperature, weight, height, pain_level, recorded_by) VALUES
(1, 120, 80, 72, 98.6, 175, 70, 7, 1),
(1, 118, 78, 70, 98.4, 175, 70, 4, 1),
(2, 130, 85, 78, 99.1, 160, 65, 3, 1),
(3, 115, 75, 68, 98.2, 140, 62, 6, 1);
*/

COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================
-- This migration adds:
-- 1. clinical_notes table for patient notes management
-- 2. patient_vitals table for vital signs tracking
-- 3. Proper indexes for performance
-- 4. Constraints for data integrity
-- 5. Triggers for automatic timestamps
-- 6. Views for common queries
-- 7. Sample data (commented out) 