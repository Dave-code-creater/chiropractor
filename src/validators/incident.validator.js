const Joi = require('joi');

/**
 * Incident Validation Schemas
 */

const createIncidentSchema = Joi.object({
  incident_type: Joi.string()
    .valid('car_accident', 'work_injury', 'sports_injury', 'general_pain', 'general_patient_record')
    .required()
    .messages({
      'any.required': 'Incident type is required',
      'any.only': 'Incident type must be one of: car_accident, work_injury, sports_injury, general_pain, general_patient_record'
    }),
  
  title: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  incident_date: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Incident date cannot be in the future'
    })
});

const updateIncidentSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  incident_date: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Incident date cannot be in the future'
    }),
  
  status: Joi.string()
    .valid('active', 'completed', 'inactive')
    .optional()
    .messages({
      'any.only': 'Status must be one of: active, completed, inactive'
    })
});

const incidentFormSchema = Joi.object({
  form_type: Joi.string()
    .valid(
      'patient_info', 'health_insurance', 'pain_description', 
      'pain_assessment', 'medical_history', 'lifestyle_impact'
    )
    .required()
    .messages({
      'any.required': 'Form type is required',
      'any.only': 'Invalid form type'
    }),
  
  form_data: Joi.object()
    .required()
    .messages({
      'any.required': 'Form data is required'
    }),
  
  is_completed: Joi.boolean()
    .optional()
    .default(false),
  
  is_required: Joi.boolean()
    .optional()
    .default(true)
});

const incidentNoteSchema = Joi.object({
  note_text: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Note text cannot be empty',
      'string.max': 'Note text cannot exceed 2000 characters',
      'any.required': 'Note text is required'
    }),
  
  note_type: Joi.string()
    .valid('progress', 'symptom_update', 'treatment_response', 'general')
    .optional()
    .default('progress')
    .messages({
      'any.only': 'Note type must be one of: progress, symptom_update, treatment_response, general'
    })
});

module.exports = {
  createIncidentSchema,
  updateIncidentSchema,
  incidentFormSchema,
  incidentNoteSchema
}; 