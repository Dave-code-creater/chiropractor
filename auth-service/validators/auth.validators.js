import joi from 'joi';

const authValidator = {
    register: joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(6).max(128).required(),
        role: joi.string().valid('patient', 'doctor', 'admin').default('patient'),
        first_name: joi.string().min(1).max(50).required(),
        last_name: joi.string().min(1).max(50).required(),
        phone_number: joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
        confirm_password: joi.string().valid(joi.ref('password')).required().messages({
            'any.only': 'confirm_password must match password'
        })
    }),
    login: joi.object({
        username: joi.string().min(3).max(30).required(),
        password: joi.string().min(6).max(128).required()
    }),
}
export default authValidator;