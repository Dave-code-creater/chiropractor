const Joi = require('joi');

// Chat validation schemas - using snake_case for consistency
const createConversationSchema = Joi.object({
  doctor_id: Joi.number().integer().positive().optional(),
  patient_id: Joi.number().integer().positive().optional(),
  title: Joi.string().max(200).required(),
  description: Joi.string().max(1000).optional(),
  participant_type: Joi.string().valid('doctor', 'patient', 'staff', 'admin').optional(),
  initial_message: Joi.string().max(2000).optional()
});

const doctorPatientConversationSchema = Joi.object({
  doctor_id: Joi.number().integer().positive().required(),
  patient_id: Joi.number().integer().positive().optional(),
  title: Joi.string().max(200).required(),
  initial_message: Joi.string().max(2000).required()
});

const sendMessageSchema = Joi.object({
  conversation_id: Joi.string().required(),
  content: Joi.string().max(2000).required(),
  sender_type: Joi.string().valid('doctor', 'patient', 'staff', 'admin', 'user').required(),
  sender_id: Joi.number().integer().positive().optional(),
  message_type: Joi.string().valid('text', 'image', 'file', 'system').default('text'),
  attachment_url: Joi.string().uri().optional()
});

module.exports = {
  createConversationSchema,
  doctorPatientConversationSchema,
  sendMessageSchema
}; 