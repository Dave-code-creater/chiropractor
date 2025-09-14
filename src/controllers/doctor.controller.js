const { getDoctorRepository } = require('../repositories');
const asyncHandler = require('../utils/asyncHandler');
const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
const { info, warn, error: logError } = require('../utils/logger');

/**
 * Get doctor's assigned patients
 * GET /api/v1/2025/doctors/:doctorId/patients
 */
const getDoctorPatients = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 20, search = '', status = 'all' } = req.query;

  info(`Fetching patients for doctor ${doctorId}`, {
    page, limit, search, status,
    requestingUser: req.user?.id
  });

  // Get repository instance
  const doctorRepository = getDoctorRepository();

  // Validate doctor exists and user has permission
  const doctor = await doctorRepository.getDoctorById(doctorId);
  if (!doctor) {
    return new ErrorResponse('Doctor not found', 404, 'DOCTOR_NOT_FOUND').send(res);
  }

  // Check if the requesting user is the same doctor or has admin privileges
  if (req.user.role !== 'admin' && req.user.id !== doctor.user_id) {
    return new ErrorResponse('Access denied: You can only view your own patients', 403, 'UNAUTHORIZED_ACCESS').send(res);
  }

  try {
    const patients = await doctorRepository.getDoctorPatients(doctorId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status: status === 'all' ? null : status
    });

    info(`Successfully fetched ${patients.data?.length || 0} patients for doctor ${doctorId}`);

    return new SuccessResponse('Patients retrieved successfully', 200, patients, { 
      pagination: patients.pagination,
      total: patients.total || 0,
      count: patients.data?.length || 0
    }).send(res);

  } catch (error) {
    logError('Error fetching doctor patients:', {
      doctorId,
      error: error.message,
      stack: error.stack
    });

    return new ErrorResponse('Failed to retrieve patients', 500, 'DATABASE_ERROR').send(res);
  }
});

/**
 * Get specific patient details for doctor
 * GET /api/v1/2025/doctors/:doctorId/patients/:patientId
 */
const getPatientDetails = asyncHandler(async (req, res) => {
  const { doctorId, patientId } = req.params;

  info(`Fetching patient details for doctor ${doctorId}, patient ${patientId}`, {
    requestingUser: req.user?.id
  });

  // Get repository instance
  const doctorRepository = getDoctorRepository();

  try {
    // Check if doctor has access to this patient
    const hasAccess = await doctorRepository.verifyDoctorPatientAccess(doctorId, patientId);
    if (!hasAccess) {
      return new ErrorResponse('Access denied: Patient not assigned to this doctor', 403, 'PATIENT_NOT_ASSIGNED').send(res);
    }

    const patientDetails = await doctorRepository.getPatientDetailsForDoctor(doctorId, patientId);

    if (!patientDetails) {
      return new ErrorResponse('Patient not found', 404, 'PATIENT_NOT_FOUND').send(res);
    }

    return new SuccessResponse('Patient details retrieved successfully', 200, patientDetails).send(res);

  } catch (error) {
    logError('Error fetching patient details:', {
      doctorId,
      patientId,
      error: error.message,
      stack: error.stack
    });

    return new ErrorResponse('Failed to retrieve patient details', 500, 'DATABASE_ERROR').send(res);
  }
});

/**
 * Get doctor's dashboard statistics
 * GET /api/v1/2025/doctors/:doctorId/stats
 */
const getDoctorStats = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  info(`Fetching dashboard stats for doctor ${doctorId}`, {
    requestingUser: req.user?.id
  });

  // Get repository instance
  const doctorRepository = getDoctorRepository();

  try {
    const stats = await doctorRepository.getDoctorStats(doctorId);

    return new SuccessResponse('Doctor statistics retrieved successfully', 200, stats).send(res);

  } catch (error) {
    logError('Error fetching doctor stats:', {
      doctorId,
      error: error.message,
      stack: error.stack
    });

    return new ErrorResponse('Failed to retrieve doctor statistics', 500, 'DATABASE_ERROR').send(res);
  }
});

module.exports = {
  getDoctorPatients,
  getPatientDetails,
  getDoctorStats
};