# Validators

This directory contains all Joi validation schemas for the chiropractor application, organized by domain.

## Structure

```
src/validators/
├── index.js                    # Central export file for all validators
├── auth.validator.js           # Authentication validation schemas
├── password-reset.validator.js # Password reset validation schemas
├── user.validator.js           # User/patient management validation schemas
├── appointment.validator.js    # Appointment booking validation schemas
├── report.validator.js         # Medical report validation schemas
├── chat.validator.js           # Chat/messaging validation schemas
└── README.md                   # This documentation
```

## Refactoring Benefits

### Before Refactoring
- Validation schemas were scattered across controller files
- Code duplication and inconsistency
- Difficult to maintain and update validation rules
- Mixed business logic with validation logic

### After Refactoring
- ✅ **Centralized Validation**: All schemas in dedicated validators directory
- ✅ **Separation of Concerns**: Controllers focus on business logic, validators handle validation
- ✅ **Reusability**: Schemas can be reused across different controllers
- ✅ **Maintainability**: Easy to find and update validation rules
- ✅ **Consistency**: Standardized snake_case field naming across all schemas
- ✅ **Testability**: Validators can be tested independently

## Usage

### Import All Validators
```javascript
const { registerSchema, loginSchema, patientCreateSchema } = require('../validators');
```

### Import Specific Validator File
```javascript
const { registerSchema, loginSchema } = require('../validators/auth.validator');
```

### Using in Controllers
```javascript
const { registerSchema } = require('../validators');

class AuthController {
  static async register(req, res) {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
    }
    // Continue with validated data...
  }
}
```

## Validation Schemas by Domain

### Authentication (`auth.validator.js`)
- `registerSchema`: User registration with password confirmation
- `loginSchema`: User login credentials

### Password Reset (`password-reset.validator.js`)
- `passwordResetRequestSchema`: Email for password reset request
- `verifyResetTokenSchema`: Token verification
- `resetPasswordSchema`: New password with confirmation

### User Management (`user.validator.js`)
- `patientCreateSchema`: Complete patient profile creation
- `patientUpdateSchema`: Patient profile updates
- `clinicalNotesSchema`: Medical clinical notes
- `vitalsSchema`: Patient vital signs recording

### Appointments (`appointment.validator.js`)
- `appointmentCreateSchema`: Full appointment booking
- `quickScheduleSchema`: Quick appointment scheduling
- `appointmentUpdateSchema`: Appointment modifications

### Reports (`report.validator.js`)
- `patientIntakeSchema`: Patient intake form
- `insuranceDetailsSchema`: Insurance and accident details
- `painEvaluationSchema`: Pain assessment forms
- `detailedDescriptionSchema`: Detailed symptom descriptions
- `workImpactSchema`: Work impact assessment
- `healthConditionSchema`: Health conditions and medical history
- `doctorInitialReportSchema`: Doctor's initial assessment

### Chat (`chat.validator.js`)
- `createConversationSchema`: New conversation creation
- `doctorPatientConversationSchema`: Doctor-patient specific conversations
- `sendMessageSchema`: Message sending validation

## Field Naming Convention

All validation schemas use **snake_case** for consistency:

```javascript
// ✅ Correct - snake_case
{
  first_name: "John",
  last_name: "Doe",
  phone_number: "555-1234",
  date_of_birth: "1990-01-01"
}

// ❌ Incorrect - camelCase
{
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "555-1234",
  dateOfBirth: "1990-01-01"
}
```

## Adding New Validators

1. Create a new validator file: `src/validators/new-domain.validator.js`
2. Define your schemas using Joi with snake_case fields
3. Export the schemas:
   ```javascript
   module.exports = {
     newSchema1,
     newSchema2
   };
   ```
4. Add the import to `src/validators/index.js`:
   ```javascript
   const newDomainValidators = require('./new-domain.validator');
   
   module.exports = {
     // ... existing exports
     ...newDomainValidators
   };
   ```

## Validation Features

### Common Patterns
- **Required fields**: `.required()`
- **Optional fields**: `.optional()`
- **String length**: `.min(2).max(50)`
- **Email validation**: `.email()`
- **Enum values**: `.valid('option1', 'option2')`
- **Nested objects**: `Joi.object({ ... })`
- **Arrays**: `Joi.array().items(Joi.string())`
- **Password confirmation**: `.valid(Joi.ref('password'))`

### Custom Messages
```javascript
confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
  'any.only': 'Passwords do not match'
})
```

### Default Values
```javascript
role: Joi.string().valid('doctor', 'staff', 'patient').default('patient')
```

## Testing Validators

Validators can be tested independently:

```javascript
const { registerSchema } = require('../src/validators');

describe('Register Schema', () => {
  it('should validate correct registration data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
      confirm_password: 'password123',
      first_name: 'John',
      last_name: 'Doe'
    };
    
    const { error } = registerSchema.validate(validData);
    expect(error).toBeUndefined();
  });
});
```

## Migration Notes

This refactoring maintains backward compatibility. All existing API endpoints continue to work with the same validation rules, but now the validation logic is centralized and more maintainable.

### Controllers Updated
- ✅ `auth.controller.js`
- ✅ `password-reset.controller.js`
- ✅ `user.controller.js`
- ✅ `appointment.controller.js`
- ✅ `report.controller.js`
- ✅ `chat.controller.js`

All controllers now import validators from `../validators` instead of defining schemas locally. 