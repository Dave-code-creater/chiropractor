const {
  NotFoundError,
  BadRequestError
} = require('../utils/httpResponses.js');

class TemplateService {
  // Get all available templates organized by folders
  static async getTemplates() {
    const templates = {
      folders: {
        "initial-consultation": {
          id: "initial-consultation",
          name: "Initial Consultation",
          description: "Complete patient intake and assessment forms",
          templates: [
            {
              id: "patient-intake",
              name: "Patient Intake Form",
              description: "Comprehensive patient information and medical history",
              formType: "PatientIntakeForm",
              fields: ["Personal Information", "Medical History", "Current Symptoms", "Emergency Contacts"],
              estimatedTime: "15-20 min",
              required: true,
              category: "consultation"
            },
            {
              id: "insurance-details",
              name: "Insurance Information",
              description: "Insurance coverage and accident details",
              formType: "InsuranceDetailsForm",
              fields: ["Insurance Type", "Accident Details", "Coverage Information", "Work Impact"],
              estimatedTime: "10-15 min",
              required: true,
              category: "consultation"
            },
            {
              id: "pain-evaluation",
              name: "Pain Evaluation Form",
              description: "Detailed pain assessment and body mapping",
              formType: "PainEvaluationForm",
              fields: ["Pain Mapping", "Pain Intensity", "Pain Description", "Triggers and Relief"],
              estimatedTime: "10-15 min",
              required: true,
              category: "consultation"
            },
            {
              id: "health-questionnaire",
              name: "Health Questionnaire",
              description: "Medical history and current health conditions",
              formType: "HealthConditionForm",
              fields: ["Medical Conditions", "Surgical History", "Medications", "Work Status"],
              estimatedTime: "10-15 min",
              required: true,
              category: "consultation"
            }
          ]
        },
        "follow-up-visits": {
          id: "follow-up-visits",
          name: "Follow-up Visits",
          description: "Progress tracking and treatment updates",
          templates: [
            {
              id: "progress-update",
              name: "Progress Update",
              description: "Track patient improvement and treatment response",
              formType: "DetailedDescriptionForm",
              fields: ["Symptom Changes", "Treatment Response", "Functional Improvement", "Next Steps"],
              estimatedTime: "5-10 min",
              required: false,
              category: "follow-up"
            },
            {
              id: "treatment-notes",
              name: "Treatment Notes",
              description: "Detailed treatment session documentation",
              formType: "DetailedDescriptionForm",
              fields: ["Treatment Performed", "Patient Response", "Observations", "Recommendations"],
              estimatedTime: "5-10 min",
              required: false,
              category: "follow-up"
            }
          ]
        },
        "specialized-assessments": {
          id: "specialized-assessments",
          name: "Specialized Assessments",
          description: "Detailed injury and condition evaluations",
          templates: [
            {
              id: "spinal-assessment",
              name: "Spinal Assessment",
              description: "Comprehensive spinal examination and evaluation",
              formType: "DetailedDescriptionForm",
              fields: ["Range of Motion", "Neurological Tests", "Orthopedic Tests", "Diagnostic Imaging"],
              estimatedTime: "20-30 min",
              required: false,
              category: "assessment"
            },
            {
              id: "work-injury-assessment",
              name: "Work Injury Assessment",
              description: "Workplace injury evaluation and impact assessment",
              formType: "WorkImpactForm",
              fields: ["Injury Details", "Work Activities", "Limitations", "Return to Work Plan"],
              estimatedTime: "15-20 min",
              required: false,
              category: "assessment"
            }
          ]
        }
      }
    };

    return templates;
  }

  // Get template by ID
  static async getTemplateById(templateId) {
    const templates = await this.getTemplates();
    
    // Search through all folders and templates
    for (const folder of Object.values(templates.folders)) {
      const template = folder.templates.find(t => t.id === templateId);
      if (template) {
        return {
          ...template,
          folder: folder.name
        };
      }
    }

    throw new NotFoundError('Template not found');
  }

  // Get templates by category
  static async getTemplatesByCategory(category) {
    const templates = await this.getTemplates();
    const categoryTemplates = [];

    for (const folder of Object.values(templates.folders)) {
      const filteredTemplates = folder.templates.filter(t => t.category === category);
      if (filteredTemplates.length > 0) {
        categoryTemplates.push({
          ...folder,
          templates: filteredTemplates
        });
      }
    }

    return categoryTemplates;
  }

  // Get form validation rules by form type
  static getFormValidationRules(formType) {
    const validationRules = {
      PatientIntakeForm: {
        required: ['firstName', 'lastName', 'dob', 'gender'],
        optional: ['middleName', 'ssn', 'status', 'race', 'street', 'city', 'state', 'zip', 'homePhone']
      },
      InsuranceDetailsForm: {
        required: ['insuranceType'],
        optional: ['typeCar', 'accidentDate', 'accidentTime', 'accidentLocation', 'accidentType']
      },
      PainEvaluationForm: {
        required: ['painEvaluations'],
        optional: ['formData']
      },
      DetailedDescriptionForm: {
        required: ['symptomDetails'],
        optional: ['mainComplaints', 'previousHealthcare']
      },
      WorkImpactForm: {
        required: ['workActivities'],
        optional: ['lostWork', 'lostWorkDates', 'workLimitations']
      },
      HealthConditionForm: {
        required: ['hasCondition'],
        optional: ['conditionDetails', 'hasSurgicalHistory', 'medication']
      }
    };

    return validationRules[formType] || { required: [], optional: [] };
  }
}

module.exports = TemplateService; 