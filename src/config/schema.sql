-- ===============================================
-- DR. DIEU PHAN CHIROPRACTIC PRACTICE DATABASE
-- ===============================================
-- Simplified schema for single-doctor practice
-- Focus: Traditional CRUD, treatment workflow

-- ===============================================
-- CORE TABLES
-- ===============================================

-- Users table (patients and Dr. Dieu Phan)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Dr. Dieu Phan as the default doctor
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES ('dr.dieuphan@clinic.com', '$2a$10$defaulthash', 'Dieu', 'Phan', 'doctor')
ON CONFLICT (email) DO NOTHING;

-- Patient initial reports (from incident forms)
CREATE TABLE IF NOT EXISTS patient_reports (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    incident_date DATE NOT NULL,
    pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10),
    pain_description TEXT,
    pain_location TEXT,
    symptoms TEXT,
    medical_history TEXT,
    medications TEXT,
    lifestyle_impact TEXT,
    insurance_info JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'treatment_planned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment plans created by Dr. Dieu Phan
CREATE TABLE IF NOT EXISTS treatment_plans (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    report_id INTEGER REFERENCES patient_reports(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id) DEFAULT (SELECT id FROM users WHERE role = 'doctor' LIMIT 1),
    
    -- Treatment details
    duration_months INTEGER NOT NULL DEFAULT 4,
    frequency_per_week INTEGER NOT NULL DEFAULT 3,
    treatment_type VARCHAR(100) NOT NULL,
    goals TEXT,
    notes TEXT,
    
    -- Status and dates
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'modified')),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient visits and progress (combines vitals + clinical notes)
CREATE TABLE IF NOT EXISTS patient_visits (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    treatment_plan_id INTEGER REFERENCES treatment_plans(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id) DEFAULT (SELECT id FROM users WHERE role = 'doctor' LIMIT 1),
    
    visit_date DATE DEFAULT CURRENT_DATE,
    visit_number INTEGER, -- Track progress (1st visit, 2nd visit, etc.)
    
    -- Vitals and assessments
    pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
    mobility_score INTEGER CHECK (mobility_score >= 0 AND mobility_score <= 100),
    range_of_motion JSONB, -- Store measurements
    blood_pressure VARCHAR(20),
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    
    -- Clinical notes (SOAP format)
    subjective TEXT, -- What patient reports
    objective TEXT,  -- Doctor's observations
    assessment TEXT, -- Doctor's assessment
    plan TEXT,       -- Next steps/treatment plan adjustments
    
    -- Progress notes
    treatment_notes TEXT,
    progress_notes TEXT,
    next_appointment DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments (simplified)
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id) DEFAULT (SELECT id FROM users WHERE role = 'doctor' LIMIT 1),
    treatment_plan_id INTEGER REFERENCES treatment_plans(id) ON DELETE SET NULL,
    
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_patient_reports_patient_id ON patient_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_reports_status ON patient_reports(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_patient_visits_patient_id ON patient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_visit_date ON patient_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- ===============================================
-- SIMPLE WORKFLOW VIEWS
-- ===============================================

-- View for Dr. Dieu Phan's dashboard
CREATE OR REPLACE VIEW doctor_dashboard AS
SELECT 
    u.id as patient_id,
    u.first_name,
    u.last_name,
    u.phone_number,
    pr.status as report_status,
    tp.status as treatment_status,
    tp.frequency_per_week,
    tp.duration_months,
    (SELECT visit_date FROM patient_visits pv WHERE pv.patient_id = u.id ORDER BY visit_date DESC LIMIT 1) as last_visit,
    (SELECT appointment_date FROM appointments a WHERE a.patient_id = u.id AND a.status = 'scheduled' ORDER BY appointment_date ASC LIMIT 1) as next_appointment
FROM users u
LEFT JOIN patient_reports pr ON pr.patient_id = u.id
LEFT JOIN treatment_plans tp ON tp.patient_id = u.id AND tp.status = 'active'
WHERE u.role = 'patient' AND u.is_active = true;

-- View for patient complete records
CREATE OR REPLACE VIEW patient_complete_records AS
SELECT 
    u.id as patient_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone_number,
    u.date_of_birth,
    pr.pain_level as initial_pain_level,
    pr.pain_description,
    pr.medical_history,
    tp.duration_months,
    tp.frequency_per_week,
    tp.treatment_type,
    tp.goals,
    (SELECT COUNT(*) FROM patient_visits pv WHERE pv.patient_id = u.id) as total_visits,
    (SELECT AVG(pain_level) FROM patient_visits pv WHERE pv.patient_id = u.id) as avg_pain_level,
    (SELECT pain_level FROM patient_visits pv WHERE pv.patient_id = u.id ORDER BY visit_date DESC LIMIT 1) as latest_pain_level
FROM users u
LEFT JOIN patient_reports pr ON pr.patient_id = u.id
LEFT JOIN treatment_plans tp ON tp.patient_id = u.id AND tp.status = 'active'
WHERE u.role = 'patient';

-- ===============================================
-- SIMPLE FUNCTIONS FOR WORKFLOW
-- ===============================================

-- Function to calculate treatment progress percentage
CREATE OR REPLACE FUNCTION calculate_treatment_progress(patient_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_expected_visits INTEGER;
    completed_visits INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Get expected visits based on treatment plan
    SELECT 
        (tp.duration_months * 4.33 * tp.frequency_per_week)::INTEGER
    INTO total_expected_visits
    FROM treatment_plans tp 
    WHERE tp.patient_id = patient_id_param AND tp.status = 'active'
    LIMIT 1;
    
    -- Get completed visits
    SELECT COUNT(*)
    INTO completed_visits
    FROM patient_visits pv
    WHERE pv.patient_id = patient_id_param;
    
    -- Calculate percentage
    IF total_expected_visits > 0 THEN
        progress_percentage := (completed_visits * 100 / total_expected_visits);
    ELSE
        progress_percentage := 0;
    END IF;
    
    RETURN LEAST(progress_percentage, 100);
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ===============================================

-- Uncomment below to insert sample data for testing

/*
-- Sample patient
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, date_of_birth, gender) 
VALUES ('patient1@example.com', '$2a$10$defaulthash', 'John', 'Doe', '555-1234', '1985-06-15', 'male');

-- Sample report
INSERT INTO patient_reports (patient_id, incident_date, pain_level, pain_description, pain_location, symptoms)
VALUES (
    (SELECT id FROM users WHERE email = 'patient1@example.com'),
    CURRENT_DATE - INTERVAL '1 week',
    7,
    'Sharp pain in lower back after lifting heavy box',
    'Lower back, right side',
    'Difficulty sleeping, pain when bending over'
);

-- Sample treatment plan
INSERT INTO treatment_plans (patient_id, report_id, duration_months, frequency_per_week, treatment_type, goals)
VALUES (
    (SELECT id FROM users WHERE email = 'patient1@example.com'),
    (SELECT id FROM patient_reports WHERE patient_id = (SELECT id FROM users WHERE email = 'patient1@example.com')),
    4,
    3,
    'Chiropractic adjustment and physical therapy',
    'Reduce pain to level 2-3, restore full mobility, return to normal activities'
);
*/