const Joi = require('joi');

// Appointment validation schemas - simplified for small clinic
const appointmentCreateSchema = Joi.object({
  doctor_id: Joi.number().integer().positive().required(),
  patient_id: Joi.number().integer().positive().required(),
  appointment_date: Joi.string().required(), // Can be "Thursday, June 26, 2025" or "2025-06-26"
  appointment_time: Joi.string().required(), // Can be "11:30 AM" or "14:30"
  location: Joi.string().max(100).default('main_office'),
  reason_for_visit: Joi.string().max(500).optional(),
  additional_notes: Joi.string().max(1000).optional(),
  status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show').default('scheduled')
});

const appointmentUpdateSchema = Joi.object({
  appointment_date: Joi.string().optional(),
  appointment_time: Joi.string().optional(),
  location: Joi.string().max(100).optional(),
  reason_for_visit: Joi.string().max(500).optional(),
  additional_notes: Joi.string().max(1000).optional(),
  status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show').optional()
});

module.exports = {
  appointmentCreateSchema,
  appointmentUpdateSchema
}; 