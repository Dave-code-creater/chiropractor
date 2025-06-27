// Central validator exports
const authValidators = require('./auth.validator');
const passwordResetValidators = require('./password-reset.validator');
const userValidators = require('./user.validator');
const appointmentValidators = require('./appointment.validator');
const reportValidators = require('./report.validator');
const chatValidators = require('./chat.validator');

module.exports = {
  // Auth validators
  ...authValidators,
  
  // Password reset validators
  ...passwordResetValidators,
  
  // User validators
  ...userValidators,
  
  // Appointment validators
  ...appointmentValidators,
  
  // Report validators
  ...reportValidators,
  
  // Chat validators
  ...chatValidators
}; 