const TemplateService = require('../services/template.service.js');
const {
  OK,
  Created,
  NoContent,
  BadRequestError
} = require('../utils/httpResponses.js');

// Get all available templates
const getTemplates = async (req, res) => {
  const templates = await TemplateService.getTemplates();
  
  return new OK({
    metadata: templates,
    message: 'Templates retrieved successfully'
  }).send(res);
};

// Get template by ID
const getTemplateById = async (req, res) => {
  const { templateId } = req.params;
  const template = await TemplateService.getTemplateById(templateId);
  
  return new OK({
    metadata: template,
    message: 'Template retrieved successfully'
  }).send(res);
};

module.exports = {
  getTemplates,
  getTemplateById
}; 