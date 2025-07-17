/**
 * Centralized Validator Exports
 * Exports all validation middleware functions with consistent naming
 */

const { validate } = require('../middleware/validation.middleware');

const { 
  patientRegisterSchema, 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('./auth.validator');

const {
  patientCreateSchema,
  patientUpdateSchema,
  clinicalNotesSchema,
  vitalsSchema,
  profileUpdateSchema
} = require('./user.validator');

const {
  appointmentCreateSchema,
  appointmentUpdateSchema
} = require('./appointment.validator');

const {
  createConversationSchema,
  doctorPatientConversationSchema,
  sendMessageSchema
} = require('./chat.validator');

const {
  createIncidentSchema,
  updateIncidentSchema,
  incidentFormSchema,
  incidentNoteSchema
} = require('./incident.validator');

const {
  patientIntakeSchema,
  insuranceDetailsSchema,
  painEvaluationSchema,
  detailedDescriptionSchema,
  workImpactSchema,
  healthConditionSchema,
  doctorInitialReportSchema
} = require('./report.validator');

// Create validator middleware functions using the schemas
const signUpValidator = validate(patientRegisterSchema);
const signInValidator = validate(loginSchema);
const patientRegisterValidator = validate(patientRegisterSchema);
const refreshTokenValidator = validate(refreshTokenSchema);
const changePasswordValidator = validate(changePasswordSchema);
const forgotPasswordValidator = validate(forgotPasswordSchema);
const resetPasswordValidator = validate(resetPasswordSchema);

const userCreateValidator = validate(patientCreateSchema);
const patientCreateValidator = validate(patientCreateSchema);
const patientUpdateValidator = validate(patientUpdateSchema);
const clinicalNotesValidator = validate(clinicalNotesSchema);
const vitalsValidator = validate(vitalsSchema);
const profileUpdateValidator = validate(profileUpdateSchema);

const appointmentValidator = validate(appointmentCreateSchema);
const appointmentCreateValidator = validate(appointmentCreateSchema);
const appointmentUpdateValidator = validate(appointmentUpdateSchema);

const messageValidator = validate(sendMessageSchema);
const createConversationValidator = validate(createConversationSchema);
const doctorPatientConversationValidator = validate(doctorPatientConversationSchema);
const sendMessageValidator = validate(sendMessageSchema);

const createIncidentValidator = validate(createIncidentSchema);
const updateIncidentValidator = validate(updateIncidentSchema);
const incidentFormValidator = validate(incidentFormSchema);
const incidentNoteValidator = validate(incidentNoteSchema);

const reportValidator = validate(patientIntakeSchema);
const patientIntakeValidator = validate(patientIntakeSchema);
const insuranceDetailsValidator = validate(insuranceDetailsSchema);
const painEvaluationValidator = validate(painEvaluationSchema);
const detailedDescriptionValidator = validate(detailedDescriptionSchema);
const workImpactValidator = validate(workImpactSchema);
const healthConditionValidator = validate(healthConditionSchema);
const doctorInitialReportValidator = validate(doctorInitialReportSchema);

module.exports = {
  // Auth validators (middleware functions)
  signUpValidator,
  signInValidator,
  patientRegisterValidator,
  refreshTokenValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  
  // User validators (middleware functions)
  userCreateValidator,
  patientCreateValidator,
  patientUpdateValidator,
  clinicalNotesValidator,
  vitalsValidator,
  profileUpdateValidator,
  
  // Appointment validators (middleware functions)
  appointmentValidator,
  appointmentCreateValidator,
  appointmentUpdateValidator,
  
  // Chat validators (middleware functions)
  messageValidator,
  createConversationValidator,
  doctorPatientConversationValidator,
  sendMessageValidator,
  
  // Incident validators (middleware functions)
  createIncidentValidator,
  updateIncidentValidator,
  incidentFormValidator,
  incidentNoteValidator,
  
  // Report validators (middleware functions)
  reportValidator,
  patientIntakeValidator,
  insuranceDetailsValidator,
  painEvaluationValidator,
  detailedDescriptionValidator,
  workImpactValidator,
  healthConditionValidator,
  doctorInitialReportValidator,
  
  // Raw schemas (for manual validation if needed)
  schemas: {
    patientRegisterSchema,
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    patientCreateSchema,
    patientUpdateSchema,
    clinicalNotesSchema,
    vitalsSchema,
    profileUpdateSchema,
    appointmentCreateSchema,
    appointmentUpdateSchema,
    createConversationSchema,
    doctorPatientConversationSchema,
    sendMessageSchema,
    createIncidentSchema,
    updateIncidentSchema,
    incidentFormSchema,
    incidentNoteSchema,
    patientIntakeSchema,
    insuranceDetailsSchema,
    painEvaluationSchema,
    detailedDescriptionSchema,
    workImpactSchema,
    healthConditionSchema,
    doctorInitialReportSchema
  }
}; 