const Joi = require('joi');

/**
 * Vitals Data Validation Schemas
 * Using Joi for comprehensive data validation
 */

// Base vital signs schema
const vitalsSchema = Joi.object({
  // Blood Pressure
  systolic_bp: Joi.number().min(60).max(250).optional()
    .messages({
      'number.min': 'Systolic BP must be at least 60 mmHg',
      'number.max': 'Systolic BP must not exceed 250 mmHg'
    }),
  
  diastolic_bp: Joi.number().min(30).max(150).optional()
    .messages({
      'number.min': 'Diastolic BP must be at least 30 mmHg',
      'number.max': 'Diastolic BP must not exceed 150 mmHg'
    }),

  // Heart Rate
  heart_rate: Joi.number().min(30).max(250).optional()
    .messages({
      'number.min': 'Heart rate must be at least 30 bpm',
      'number.max': 'Heart rate must not exceed 250 bpm'
    }),

  // Temperature
  temperature: Joi.number().min(90).max(110).optional()
    .messages({
      'number.min': 'Temperature must be at least 90°F',
      'number.max': 'Temperature must not exceed 110°F'
    }),

  temperature_unit: Joi.string().valid('F', 'C').default('F').optional(),

  // Respiratory Rate
  respiratory_rate: Joi.number().min(8).max(60).optional()
    .messages({
      'number.min': 'Respiratory rate must be at least 8 breaths/min',
      'number.max': 'Respiratory rate must not exceed 60 breaths/min'
    }),

  // Oxygen Saturation
  oxygen_saturation: Joi.number().min(70).max(100).optional()
    .messages({
      'number.min': 'Oxygen saturation must be at least 70%',
      'number.max': 'Oxygen saturation must not exceed 100%'
    }),

  // Weight & Height
  weight: Joi.number().min(50).max(1000).optional()
    .messages({
      'number.min': 'Weight must be at least 50 lbs',
      'number.max': 'Weight must not exceed 1000 lbs'
    }),

  weight_unit: Joi.string().valid('lbs', 'kg').default('lbs').optional(),

  height: Joi.number().min(36).max(96).optional()
    .messages({
      'number.min': 'Height must be at least 36 inches',
      'number.max': 'Height must not exceed 96 inches'
    }),

  height_unit: Joi.string().valid('in', 'cm').default('in').optional(),

  // BMI (calculated field, but can be manually entered)
  bmi: Joi.number().min(10).max(80).optional(),

  // Pain Scale
  pain_level: Joi.number().min(0).max(10).optional()
    .messages({
      'number.min': 'Pain level must be at least 0',
      'number.max': 'Pain level must not exceed 10'
    }),

  // Additional fields
  notes: Joi.string().max(1000).optional()
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    }),

  position: Joi.string().valid('sitting', 'standing', 'lying').optional(),
  
  recorded_at: Joi.date().optional(),
  
  // Metadata
  vital_type: Joi.string().valid(
    'routine', 'pre_treatment', 'post_treatment', 'emergency', 'follow_up'
  ).default('routine').optional()
});

// Create vitals validation schema
const createVitalsSchema = vitalsSchema.keys({
  // At least one vital sign must be provided
}).custom((value, helpers) => {
  const vitalSigns = [
    'systolic_bp', 'diastolic_bp', 'heart_rate', 'temperature',
    'respiratory_rate', 'oxygen_saturation', 'weight', 'height', 'pain_level'
  ];
  
  const hasVitalSign = vitalSigns.some(sign => value[sign] !== undefined);
  
  if (!hasVitalSign) {
    return helpers.error('custom.noVitalSigns');
  }
  
  return value;
}, 'At least one vital sign validation').messages({
  'custom.noVitalSigns': 'At least one vital sign must be provided'
});

// Update vitals validation schema (more lenient)
const updateVitalsSchema = vitalsSchema;

// Notes validation schema
const notesSchema = Joi.object({
  patient_id: Joi.number().integer().positive().required()
    .messages({
      'any.required': 'Patient ID is required',
      'number.positive': 'Patient ID must be a positive number'
    }),

  note_type: Joi.string().valid(
    'general', 'treatment', 'assessment', 'progress', 'discharge', 'consultation'
  ).default('general').optional(),

  content: Joi.string().min(10).max(5000).required()
    .messages({
      'any.required': 'Note content is required',
      'string.min': 'Note content must be at least 10 characters',
      'string.max': 'Note content must not exceed 5000 characters'
    }),

  diagnosis: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Diagnosis must not exceed 500 characters'
    }),

  treatment_plan: Joi.string().max(1000).optional()
    .messages({
      'string.max': 'Treatment plan must not exceed 1000 characters'
    }),

  follow_up_date: Joi.date().greater('now').optional()
    .messages({
      'date.greater': 'Follow-up date must be in the future'
    }),

  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').optional(),

  tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.max': 'Each tag must not exceed 50 characters'
    })
});

/**
 * Validation Functions
 */

const validateVitalsData = (data) => {
  const { error, value } = createVitalsSchema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
    };
  }

  return {
    isValid: true,
    data: value
  };
};

const validateVitalsUpdate = (data) => {
  const { error, value } = updateVitalsSchema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
    };
  }

  return {
    isValid: true,
    data: value
  };
};

const validateNotesData = (data) => {
  const { error, value } = notesSchema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }))
    };
  }

  return {
    isValid: true,
    data: value
  };
};

/**
 * Custom validation middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(422).json({
        success: false,
        statusCode: 422,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          details: errors
        }
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  vitalsSchema,
  createVitalsSchema,
  updateVitalsSchema,
  notesSchema,
  validateVitalsData,
  validateVitalsUpdate,
  validateNotesData,
  validateRequest
}; 