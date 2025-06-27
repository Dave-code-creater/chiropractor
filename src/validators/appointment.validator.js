const Joi = require('joi');

// Appointment validation schemas - using snake_case for consistency
const appointmentCreateSchema = Joi.object({
  doctor_id: Joi.number().integer().positive().required(),
  patient_id: Joi.number().integer().positive().optional(),
  patient_name: Joi.string().max(100).optional(),
  patient_phone: Joi.string().max(20).optional(),
  patient_email: Joi.string().email().optional(),
  appointment_date: Joi.string().required(), // Can be "Thursday, June 26, 2025" or "2025-06-26"
  appointment_time: Joi.string().required(), // Can be "11:30 AM" or "14:30"
  appointment_type: Joi.string().valid('consultation', 'follow-up', 'treatment', 'initial-exam', 'emergency').default('consultation'),
  reason_for_visit: Joi.string().max(500).optional(),
  additional_notes: Joi.string().max(1000).optional(),
  duration_minutes: Joi.number().integer().positive().default(30),
  status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show').default('scheduled')
});

const quickScheduleSchema = Joi.object({
  patient_name: Joi.string().min(2).max(100).required(),
  patient_phone: Joi.string().max(20).required(),
  patient_email: Joi.string().email().optional(),
  appointment_date: Joi.date().required(),
  appointment_time: Joi.string().required(),
  appointment_type: Joi.string().valid('consultation', 'follow-up', 'treatment', 'initial-exam', 'emergency').default('consultation'),
  reason: Joi.string().max(500).optional(),
  notes: Joi.string().max(1000).optional(),
  doctor_id: Joi.number().integer().positive().optional(),
  duration_minutes: Joi.number().integer().positive().default(30)
});

const appointmentUpdateSchema = Joi.object({
  appointment_date: Joi.string().optional(),
  appointment_time: Joi.string().optional(),
  appointment_type: Joi.string().valid('consultation', 'follow-up', 'treatment', 'initial-exam', 'emergency').optional(),
  reason_for_visit: Joi.string().max(500).optional(),
  additional_notes: Joi.string().max(1000).optional(),
  duration_minutes: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show').optional()
});

module.exports = {
  appointmentCreateSchema,
  quickScheduleSchema,
  appointmentUpdateSchema
}; 