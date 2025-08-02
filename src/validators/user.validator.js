const Joi = require('joi');

// User validation schemas - using snake_case for consistency
const patientCreateSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  middle_name: Joi.string().max(50).optional(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone_number: Joi.string().min(10).max(20).optional(),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'male', 'female', 'other').optional(),
  marriage_status: Joi.string().valid('Single', 'Married', 'Divorced', 'Widowed', 'Other').optional(),
  race: Joi.string().valid('White', 'Black', 'Asian', 'Hispanic', 'Caucasian', 'Other').optional(),
  address: Joi.object({
    street: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().length(2).optional(),
    zip_code: Joi.string().max(10).optional()
  }).optional(),
  emergency_contact: Joi.object({
    name: Joi.string().max(100).optional(),
    phone_number: Joi.string().min(10).max(20).optional(),
    relationship: Joi.string().max(50).optional()
  }).optional(),
  insurance_info: Joi.object().optional(),
  medical_history: Joi.object().optional()
});

const patientUpdateSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).optional(),
  middle_name: Joi.string().max(50).optional(),
  last_name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  phone_number: Joi.string().min(10).max(20).optional(),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'male', 'female', 'other').optional(),
  marriage_status: Joi.string().valid('Single', 'Married', 'Divorced', 'Widowed', 'Other').optional(),
  race: Joi.string().valid('White', 'Black', 'Asian', 'Hispanic', 'Caucasian', 'Other').optional(),
  address: Joi.object({
    street: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().length(2).optional(),
    zip_code: Joi.string().max(10).optional()
  }).optional(),
  emergency_contact: Joi.object({
    name: Joi.string().max(100).optional(),
    phone_number: Joi.string().min(10).max(20).optional(),
    relationship: Joi.string().max(50).optional()
  }).optional(),
  insurance_info: Joi.object().optional(),
  medical_history: Joi.object().optional()
});

const clinicalNotesSchema = Joi.object({
  patient_id: Joi.number().integer().positive().required(),
  appointment_id: Joi.number().integer().positive().optional(),
  note_type: Joi.string().valid('Progress Note', 'Initial Consultation', 'Follow-up', 'Treatment Note').default('Progress Note'),
  chief_complaint: Joi.string().max(500).optional(),
  history_of_present_illness: Joi.string().max(2000).optional(),
  physical_examination: Joi.object().optional(),
  assessment: Joi.string().max(1000).optional(),
  treatment: Joi.string().max(1000).optional(),
  plan: Joi.string().max(1000).optional(),
  recommendations: Joi.array().items(Joi.string()).optional(),
  duration_minutes: Joi.number().integer().positive().optional(),
  doctor_id: Joi.string().max(50).optional(),
  doctor_name: Joi.string().max(100).optional(),
  status: Joi.string().valid('draft', 'completed', 'reviewed').default('completed')
});

const profileUpdateSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).optional(),
  middle_name: Joi.string().max(50).optional(),
  last_name: Joi.string().min(2).max(50).optional(),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'male', 'female', 'other').optional(),
  marriage_status: Joi.string().valid('Single', 'Married', 'Divorced', 'Widowed', 'Other').optional(),
  race: Joi.string().valid('White', 'Black', 'Asian', 'Hispanic', 'Caucasian', 'Other').optional(),
  phone: Joi.string().min(10).max(20).optional(),
  email: Joi.string().email().optional(),
  street: Joi.string().max(255).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().length(2).optional(),
  zip: Joi.string().max(10).optional(),
  employer: Joi.string().max(100).optional(),
  occupation: Joi.string().max(100).optional(),
  work_address: Joi.string().max(255).optional(),
  work_phone: Joi.string().min(10).max(20).optional(),
  spouse_phone: Joi.string().min(10).max(20).optional(),
  emergency_contact_name: Joi.string().max(100).optional(),
  emergency_contact_phone: Joi.string().min(10).max(20).optional(),
  emergency_contact_relationship: Joi.string().max(50).optional()
});

module.exports = {
  patientCreateSchema,
  patientUpdateSchema,
  clinicalNotesSchema,
  profileUpdateSchema
}; 