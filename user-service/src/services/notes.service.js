const notesRepository = require('../repositories/notes.repo');
const { createNotFoundError, createConflictError } = require('../middlewares/error.middleware');

/**
 * Clinical Notes Service
 * Business logic for clinical notes management
 */
class NotesService {
  /**
   * Create a new clinical note
   */
  async createNote(noteData) {
    try {
      // Additional business logic can be added here
      // e.g., validate patient exists, check permissions, etc.
      
      const note = await notesRepository.create(noteData);
      return note;
    } catch (error) {
      if (error.code === 'FOREIGN_KEY_VIOLATION') {
        throw createNotFoundError('Patient not found');
      }
      throw error;
    }
  }

  /**
   * Get clinical notes with filtering and pagination
   */
  async getNotes(filters, options) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const result = await notesRepository.findMany({
      filters,
      limit,
      offset,
      orderBy: [{ field: 'created_at', direction: 'DESC' }]
    });

    const total = await notesRepository.count(filters);

    return {
      notes: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get a specific clinical note by ID
   */
  async getNoteById(noteId) {
    const note = await notesRepository.findById(noteId);
    return note;
  }

  /**
   * Update a clinical note
   */
  async updateNote(noteId, updateData) {
    const existingNote = await notesRepository.findById(noteId);
    if (!existingNote) {
      return null;
    }

    const updatedNote = await notesRepository.update(noteId, updateData);
    return updatedNote;
  }

  /**
   * Delete a clinical note
   */
  async deleteNote(noteId) {
    const existingNote = await notesRepository.findById(noteId);
    if (!existingNote) {
      return false;
    }

    await notesRepository.delete(noteId);
    return true;
  }

  /**
   * Get notes by patient with optional vitals integration
   */
  async getNotesByPatient(patientId, options = {}) {
    const { include_vitals = false, limit = 10 } = options;

    const filters = { patient_id: patientId };
    const notes = await notesRepository.findMany({
      filters,
      limit,
      orderBy: [{ field: 'created_at', direction: 'DESC' }]
    });

    if (include_vitals) {
      // If vitals integration is requested, we could fetch related vitals
      // This would require implementing the vitals repository
      for (const note of notes) {
        // note.vitals = await vitalsRepository.findByDateRange(patientId, note.created_at);
      }
    }

    return notes;
  }

  /**
   * Get notes statistics for a patient
   */
  async getNotesStats(patientId) {
    const stats = await notesRepository.getPatientStats(patientId);
    return stats;
  }

  /**
   * Search notes by content
   */
  async searchNotes(searchTerm, filters = {}, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const searchFilters = {
      ...filters,
      search: searchTerm
    };

    const result = await notesRepository.search({
      filters: searchFilters,
      limit,
      offset,
      orderBy: [{ field: 'created_at', direction: 'DESC' }]
    });

    const total = await notesRepository.countSearch(searchFilters);

    return {
      notes: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = new NotesService(); 