const Joi = require('joi');

// Chat validation schemas - using snake_case for consistency
const createConversationSchema = Joi.object({
  target_user_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().regex(/^\d+$/).custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num <= 0) return helpers.error('number.positive');
      return num;
    })
  ).required(),
  conversation_type: Joi.string().valid('consultation', 'general', 'urgent', 'follow-up').default('general'),
  subject: Joi.string().max(200).required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  initial_message: Joi.string().max(2000).optional()
});

const doctorPatientConversationSchema = Joi.object({
  doctor_id: Joi.number().integer().positive().required(),
  patient_id: Joi.number().integer().positive().optional(),
  title: Joi.string().max(200).required(),
  initial_message: Joi.string().max(2000).required()
});

const sendMessageSchema = Joi.object({
  conversation_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().regex(/^\d+$/),
    Joi.string().regex(/^conv_\d+_[a-z0-9]+$/)
  ).optional(), // Now optional since it comes from URL params
  content: Joi.string().max(2000).required(),
  message_content: Joi.string().max(2000).optional(), // Alias for content
  sender_type: Joi.string().valid('doctor', 'patient', 'staff', 'admin', 'user').optional(), // Optional since derived from auth
  sender_id: Joi.number().integer().positive().optional(),
  message_type: Joi.string().valid('text', 'system').default('text')
});

module.exports = {
  createConversationSchema,
  doctorPatientConversationSchema,
  sendMessageSchema
}; 