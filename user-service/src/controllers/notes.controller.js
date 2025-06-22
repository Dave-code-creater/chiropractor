const asyncHandler = require('../helper/asyncHandler');
const notesService = require('../services/notes.service');
const { successResponse, errorResponse } = require('../utils/httpResponses');

/**
 * Clinical Notes Controller
 * Handles clinical notes management with proper validation and error handling
 */
class NotesController {
  /**
   * Create a new clinical note
   * POST /v1/api/2025/notes
   */
  createNote = asyncHandler(async (req, res) => {
    const { patient_id, note_type, content, diagnosis, treatment_plan, follow_up_date } = req.body;
    
    // Validation
    if (!patient_id || !content) {
      return errorResponse(res, 'Patient ID and content are required', 400, 'VALIDATION_ERROR');
    }

    const noteData = {
      patient_id,
      note_type: note_type || 'general',
      content,
      diagnosis,
      treatment_plan,
      follow_up_date,
      created_by: req.user.id,
      created_at: new Date()
    };

    const note = await notesService.createNote(noteData);
    
    return successResponse(res, note, 'Clinical note created successfully', 201);
  });

  /**
   * Get clinical notes with filtering
   * GET /v1/api/2025/notes
   */
  getNotes = asyncHandler(async (req, res) => {
    const { 
      patient_id, 
      note_type, 
      created_by, 
      date_from, 
      date_to,
      page = 1, 
      limit = 10 
    } = req.query;

    const filters = {
      patient_id,
      note_type,
      created_by,
      date_from,
      date_to
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await notesService.getNotes(filters, options);
    
    return successResponse(res, result, 'Clinical notes retrieved successfully');
  });

  /**
   * Get a specific clinical note
   * GET /v1/api/2025/notes/:noteId
   */
  getNoteById = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const note = await notesService.getNoteById(noteId);
    
    if (!note) {
      return errorResponse(res, 'Clinical note not found', 404, 'RESOURCE_NOT_FOUND');
    }

    return successResponse(res, note, 'Clinical note retrieved successfully');
  });

  /**
   * Update a clinical note
   * PUT /v1/api/2025/notes/:noteId
   */
  updateNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const updateData = req.body;

    // Add updated metadata
    updateData.updated_by = req.user.id;
    updateData.updated_at = new Date();

    const note = await notesService.updateNote(noteId, updateData);
    
    if (!note) {
      return errorResponse(res, 'Clinical note not found', 404, 'RESOURCE_NOT_FOUND');
    }

    return successResponse(res, note, 'Clinical note updated successfully');
  });

  /**
   * Delete a clinical note
   * DELETE /v1/api/2025/notes/:noteId
   */
  deleteNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const deleted = await notesService.deleteNote(noteId);
    
    if (!deleted) {
      return errorResponse(res, 'Clinical note not found', 404, 'RESOURCE_NOT_FOUND');
    }

    return successResponse(res, null, 'Clinical note deleted successfully', 204);
  });

  /**
   * Get notes by patient with vitals integration
   * GET /v1/api/2025/patients/:patientId/notes
   */
  getNotesByPatient = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { include_vitals = false, limit = 10 } = req.query;

    const notes = await notesService.getNotesByPatient(patientId, {
      include_vitals: include_vitals === 'true',
      limit: parseInt(limit)
    });

    return successResponse(res, notes, 'Patient notes retrieved successfully');
  });
}

module.exports = new NotesController(); 