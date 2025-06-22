const asyncHandler = require('../helper/asyncHandler');
const vitalsService = require('../services/vitals.service');
const { successResponse, errorResponse } = require('../utils/httpResponses');
const { validateVitalsData } = require('../validators/vitals.validator');

/**
 * Vitals Management Controller
 * Handles patient vital signs with proper validation and error handling
 */
class VitalsController {
  /**
   * Get patient vitals history
   * GET /v1/api/2025/patients/:patientId/vitals
   */
  getPatientVitals = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { 
      date_from, 
      date_to, 
      vital_type,
      page = 1, 
      limit = 10 
    } = req.query;

    const filters = {
      patient_id: patientId,
      date_from,
      date_to,
      vital_type
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const vitals = await vitalsService.getPatientVitals(filters, options);
    
    return successResponse(res, vitals, 'Patient vitals retrieved successfully');
  });

  /**
   * Record new vitals for a patient
   * POST /v1/api/2025/patients/:patientId/vitals
   */
  recordVitals = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const vitalsData = req.body;

    // Validate vitals data
    const validationResult = validateVitalsData(vitalsData);
    if (!validationResult.isValid) {
      return errorResponse(res, 'Validation failed', 422, 'VALIDATION_ERROR', {
        details: validationResult.errors
      });
    }

    const vitalsRecord = {
      patient_id: patientId,
      ...vitalsData,
      recorded_by: req.user.id,
      recorded_at: new Date()
    };

    const result = await vitalsService.recordVitals(vitalsRecord);
    
    return successResponse(res, result, 'Vitals recorded successfully', 201);
  });

  /**
   * Get specific vital record
   * GET /v1/api/2025/vitals/:vitalId
   */
  getVitalById = asyncHandler(async (req, res) => {
    const { vitalId } = req.params;

    const vital = await vitalsService.getVitalById(vitalId);
    
    if (!vital) {
      return errorResponse(res, 'Vital record not found', 404, 'RESOURCE_NOT_FOUND');
    }

    return successResponse(res, vital, 'Vital record retrieved successfully');
  });

  /**
   * Update vital record
   * PUT /v1/api/2025/vitals/:vitalId
   */
  updateVital = asyncHandler(async (req, res) => {
    const { vitalId } = req.params;
    const updateData = req.body;

    // Validate update data
    const validationResult = validateVitalsData(updateData);
    if (!validationResult.isValid) {
      return errorResponse(res, 'Validation failed', 422, 'VALIDATION_ERROR', {
        details: validationResult.errors
      });
    }

    // Add updated metadata
    updateData.updated_by = req.user.id;
    updateData.updated_at = new Date();

    const vital = await vitalsService.updateVital(vitalId, updateData);
    
    if (!vital) {
      return errorResponse(res, 'Vital record not found', 404, 'RESOURCE_NOT_FOUND');
    }

    return successResponse(res, vital, 'Vital record updated successfully');
  });

  /**
   * Delete vital record
   * DELETE /v1/api/2025/vitals/:vitalId
   */
  deleteVital = asyncHandler(async (req, res) => {
    const { vitalId } = req.params;

    const deleted = await vitalsService.deleteVital(vitalId);
    
    if (!deleted) {
      return errorResponse(res, 'Vital record not found', 404, 'RESOURCE_NOT_FOUND');
    }

    return successResponse(res, null, 'Vital record deleted successfully', 204);
  });

  /**
   * Get vitals summary for patient
   * GET /v1/api/2025/patients/:patientId/vitals/summary
   */
  getVitalsSummary = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { period = '30d' } = req.query;

    const summary = await vitalsService.getVitalsSummary(patientId, period);
    
    return successResponse(res, summary, 'Vitals summary retrieved successfully');
  });

  /**
   * Get vitals trends for patient
   * GET /v1/api/2025/patients/:patientId/vitals/trends
   */
  getVitalsTrends = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { vital_type, period = '90d' } = req.query;

    if (!vital_type) {
      return errorResponse(res, 'Vital type is required', 400, 'VALIDATION_ERROR');
    }

    const trends = await vitalsService.getVitalsTrends(patientId, vital_type, period);
    
    return successResponse(res, trends, 'Vitals trends retrieved successfully');
  });
}

module.exports = new VitalsController(); 