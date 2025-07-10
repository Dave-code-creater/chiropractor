const Joi = require('joi');

// Report validation schemas - using snake_case for consistency
const patientIntakeSchema = Joi.object({
  first_name: Joi.string().required(),
  middle_name: Joi.string().allow(''),
  last_name: Joi.string().required(),
  ssn: Joi.string().pattern(/^\d{3}-?\d{2}-?\d{4}$/),
  date_of_birth: Joi.date().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'male', 'female', 'other').required(),
  marital_status: Joi.string().valid('Single', 'Married', 'Divorced', 'Widowed').required(),
  race: Joi.string().valid('White', 'Black', 'Asian', 'Hispanic', 'Caucasian', 'Other').required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().length(2).required(),
  zip: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
  home_phone: Joi.string().min(10).max(20).required(),
  cell_phone: Joi.string().min(10).max(20).optional(),
  emergency_contact: Joi.string().required(),
  emergency_contact_phone: Joi.string().min(10).max(20).required(),
  emergency_contact_relationship: Joi.string().required()
});

const insuranceDetailsSchema = Joi.object({
  name: Joi.string().max(100).default('Insurance Details Report'),
  type_car: Joi.string().max(50).optional(),
  accident_date: Joi.date().required(),
  accident_time: Joi.string().max(10).required(),
  accident_time_period: Joi.string().valid('AM', 'PM').required(),
  accident_location: Joi.string().max(255).required(),
  accident_type: Joi.string().max(100).required(),
  accident_description: Joi.string().max(1000).required(),
  accident_awareness: Joi.string().valid('yes', 'no').required(),
  accident_appearance_of_ambulance: Joi.string().valid('yes', 'no').required(),
  airbag_deployment: Joi.string().valid('yes', 'no').required(),
  seatbelt_use: Joi.string().valid('yes', 'no').required(),
  police_appearance: Joi.string().valid('yes', 'no').required(),
  any_past_accidents: Joi.string().valid('yes', 'no').required(),
  lost_work_yes_no: Joi.string().valid('yes', 'no').required(),
  lost_work_dates: Joi.string().max(100).optional(),
  pregnant: Joi.string().valid('yes', 'no').required(),
  children_info: Joi.string().max(500).optional(),
  covered: Joi.string().valid('yes', 'no').required(),
  insurance_type: Joi.string().max(50).required()
});

const painEvaluationSchema = Joi.object({
  name: Joi.string().max(100).default('Pain Evaluation Report'),
  pain_evaluations: Joi.array().items(
    Joi.object({
      pain_map: Joi.object().pattern(
        Joi.string(), 
        Joi.object({
          intensity: Joi.number().integer().min(0).max(10).required(),
          type: Joi.string().max(50).required()
        })
      ).required(),
      form_data: Joi.object({
        pain_level: Joi.number().integer().min(0).max(10).required(),
        pain_type: Joi.string().max(50).required(),
        pain_frequency: Joi.string().max(50).required(),
        pain_triggers: Joi.string().max(200).optional()
      }).required()
    })
  ).required()
});

const detailedDescriptionSchema = Joi.object({
  name: Joi.string().max(100).default('Detailed Description Report'),
  symptom_details: Joi.string().max(2000).required(),
  main_complaints: Joi.string().max(1000).required(),
  previous_healthcare: Joi.string().max(1000).optional()
});

const workImpactSchema = Joi.object({
  name: Joi.string().max(100).default('Work Impact Report'),
  work_status: Joi.string().valid('able', 'unable', 'limited').required(),
  days_off_work: Joi.number().integer().min(0).optional(),
  work_limitations: Joi.string().max(500).optional(),
  return_to_work_date: Joi.date().optional(),
  work_accommodations: Joi.string().max(500).optional()
});

const healthConditionSchema = Joi.object({
  name: Joi.string().max(100).default('Health Conditions Report'),
  has_condition: Joi.string().valid('yes', 'no').required(),
  condition_details: Joi.string().max(1000).optional(),
  has_surgical_history: Joi.string().valid('yes', 'no').required(),
  surgical_history_details: Joi.string().max(1000).optional(),
  medication: Joi.string().valid('yes', 'no').required(),
  medication_names: Joi.string().max(500).optional(),
  currently_working: Joi.string().valid('yes', 'no').required(),
  work_times: Joi.string().valid('full-time', 'part-time', 'unemployed').optional(),
  work_hours_per_day: Joi.string().max(10).optional(),
  work_days_per_week: Joi.string().max(10).optional(),
  job_description: Joi.string().max(200).optional(),
  last_menstrual_period: Joi.string().max(50).optional(),
  is_pregnant_now: Joi.string().valid('yes', 'no').optional(),
  weeks_pregnant: Joi.string().max(10).optional()
});

const doctorInitialReportSchema = Joi.object({
  patient_id: Joi.number().integer().positive().required(),
  chief_complaint: Joi.string().max(500).required(),
  history_of_present_illness: Joi.string().max(2000).required(),
  physical_examination: Joi.string().max(2000).required(),
  assessment: Joi.string().max(1000).required(),
  treatment: Joi.string().max(1000).required(),
  plan: Joi.string().max(1000).required()
});

module.exports = {
  patientIntakeSchema,
  insuranceDetailsSchema,
  painEvaluationSchema,
  detailedDescriptionSchema,
  workImpactSchema,
  healthConditionSchema,
  doctorInitialReportSchema
}; 