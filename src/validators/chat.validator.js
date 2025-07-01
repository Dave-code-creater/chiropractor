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