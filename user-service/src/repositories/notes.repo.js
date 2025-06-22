const { db } = require('../config');

/**
 * Clinical Notes Repository
 * Database operations for clinical notes management
 */
class NotesRepository {
  /**
   * Create a new clinical note
   */
  async create(noteData) {
    const query = `
      INSERT INTO clinical_notes (
        patient_id, note_type, content, diagnosis, treatment_plan, 
        follow_up_date, priority, tags, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *
    `;

    const values = [
      noteData.patient_id,
      noteData.note_type || 'general',
      noteData.content,
      noteData.diagnosis || null,
      noteData.treatment_plan || null,
      noteData.follow_up_date || null,
      noteData.priority || 'medium',
      noteData.tags || null,
      noteData.created_by,
      noteData.created_at || new Date()
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find many notes with filtering
   */
  async findMany({ filters = {}, limit = 10, offset = 0, orderBy = [] }) {
    let query = `
      SELECT 
        cn.*,
        p.first_name,
        p.last_name,
        p.email as patient_email
      FROM clinical_notes cn
      LEFT JOIN patients p ON cn.patient_id = p.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    // Apply filters
    if (filters.patient_id) {
      paramCount++;
      query += ` AND cn.patient_id = $${paramCount}`;
      values.push(filters.patient_id);
    }

    if (filters.note_type) {
      paramCount++;
      query += ` AND cn.note_type = $${paramCount}`;
      values.push(filters.note_type);
    }

    if (filters.created_by) {
      paramCount++;
      query += ` AND cn.created_by = $${paramCount}`;
      values.push(filters.created_by);
    }

    if (filters.priority) {
      paramCount++;
      query += ` AND cn.priority = $${paramCount}`;
      values.push(filters.priority);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND cn.created_at >= $${paramCount}`;
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND cn.created_at <= $${paramCount}`;
      values.push(filters.date_to);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (
        cn.content ILIKE $${paramCount} OR 
        cn.diagnosis ILIKE $${paramCount} OR 
        cn.treatment_plan ILIKE $${paramCount}
      )`;
      values.push(`%${filters.search}%`);
    }

    // Apply ordering
    if (orderBy.length > 0) {
      const orderClauses = orderBy.map(order => 
        `cn.${order.field} ${order.direction || 'ASC'}`
      );
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    } else {
      query += ` ORDER BY cn.created_at DESC`;
    }

    // Apply pagination
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(limit);
    }

    if (offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);
    }

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Find note by ID
   */
  async findById(noteId) {
    const query = `
      SELECT 
        cn.*,
        p.first_name,
        p.last_name,
        p.email as patient_email
      FROM clinical_notes cn
      LEFT JOIN patients p ON cn.patient_id = p.id
      WHERE cn.id = $1
    `;

    const result = await db.query(query, [noteId]);
    return result.rows[0] || null;
  }

  /**
   * Update a note
   */
  async update(noteId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    paramCount++;
    values.push(noteId);

    const query = `
      UPDATE clinical_notes 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a note
   */
  async delete(noteId) {
    const query = `DELETE FROM clinical_notes WHERE id = $1`;
    const result = await db.query(query, [noteId]);
    return result.rowCount > 0;
  }

  /**
   * Count notes with filters
   */
  async count(filters = {}) {
    let query = `SELECT COUNT(*) as count FROM clinical_notes WHERE 1=1`;
    const values = [];
    let paramCount = 0;

    // Apply same filters as findMany
    if (filters.patient_id) {
      paramCount++;
      query += ` AND patient_id = $${paramCount}`;
      values.push(filters.patient_id);
    }

    if (filters.note_type) {
      paramCount++;
      query += ` AND note_type = $${paramCount}`;
      values.push(filters.note_type);
    }

    if (filters.created_by) {
      paramCount++;
      query += ` AND created_by = $${paramCount}`;
      values.push(filters.created_by);
    }

    if (filters.priority) {
      paramCount++;
      query += ` AND priority = $${paramCount}`;
      values.push(filters.priority);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      values.push(filters.date_to);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (
        content ILIKE $${paramCount} OR 
        diagnosis ILIKE $${paramCount} OR 
        treatment_plan ILIKE $${paramCount}
      )`;
      values.push(`%${filters.search}%`);
    }

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(patientId) {
    const query = `
      SELECT 
        COUNT(*) as total_notes,
        COUNT(CASE WHEN note_type = 'treatment' THEN 1 END) as treatment_notes,
        COUNT(CASE WHEN note_type = 'assessment' THEN 1 END) as assessment_notes,
        COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as high_priority_notes,
        COUNT(CASE WHEN follow_up_date IS NOT NULL AND follow_up_date > NOW() THEN 1 END) as pending_follow_ups,
        MAX(created_at) as last_note_date,
        MIN(created_at) as first_note_date
      FROM clinical_notes 
      WHERE patient_id = $1
    `;

    const result = await db.query(query, [patientId]);
    return result.rows[0];
  }

  /**
   * Search notes with full-text search
   */
  async search({ filters = {}, limit = 10, offset = 0, orderBy = [] }) {
    let query = `
      SELECT 
        cn.*,
        p.first_name,
        p.last_name,
        p.email as patient_email,
        ts_rank(to_tsvector('english', cn.content), plainto_tsquery('english', $1)) as rank
      FROM clinical_notes cn
      LEFT JOIN patients p ON cn.patient_id = p.id
      WHERE to_tsvector('english', cn.content) @@ plainto_tsquery('english', $1)
    `;
    
    const values = [filters.search];
    let paramCount = 1;

    // Apply additional filters
    if (filters.patient_id) {
      paramCount++;
      query += ` AND cn.patient_id = $${paramCount}`;
      values.push(filters.patient_id);
    }

    if (filters.note_type) {
      paramCount++;
      query += ` AND cn.note_type = $${paramCount}`;
      values.push(filters.note_type);
    }

    // Order by relevance by default
    query += ` ORDER BY rank DESC, cn.created_at DESC`;

    // Apply pagination
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(limit);
    }

    if (offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);
    }

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Count search results
   */
  async countSearch(filters = {}) {
    let query = `
      SELECT COUNT(*) as count 
      FROM clinical_notes 
      WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
    `;
    
    const values = [filters.search];
    let paramCount = 1;

    // Apply additional filters
    if (filters.patient_id) {
      paramCount++;
      query += ` AND patient_id = $${paramCount}`;
      values.push(filters.patient_id);
    }

    if (filters.note_type) {
      paramCount++;
      query += ` AND note_type = $${paramCount}`;
      values.push(filters.note_type);
    }

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count);
  }
}

module.exports = new NotesRepository(); 