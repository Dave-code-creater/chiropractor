const { joi } = require('joi');

const createEmergencyContactValidator = joi.object({
    name: joi.string().required(),
    phone: joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(), // E.164 format
    relationship: joi.string().optional(),
});

exports.createEmergencyContactValidator = createEmergencyContactValidator;