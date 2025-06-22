const { db } = require('../config');

/**
 * Vitals Repository
 * Database operations for patient vital signs management
 */
class VitalsRepository {
  /**
   * Create a new vitals record
   */
  async create(vitalsData) {
    const query = `
      INSERT INTO patient_vitals (
        patient_id, systolic_bp, diastolic_bp, heart_rate, temperature, temperature_unit,
        respiratory_rate, oxygen_saturation, weight, weight_unit, height, height_unit,
        bmi, pain_level, notes, position, vital_type, recorded_by, recorded_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `;

    const values = [
      vitalsData.patient_id,
      vitalsData.systolic_bp || null,
      vitalsData.diastolic_bp || null,
      vitalsData.heart_rate || null,
      vitalsData.temperature || null,
      vitalsData.temperature_unit || 'F',
      vitalsData.respiratory_rate || null,
      vitalsData.oxygen_saturation || null,
      vitalsData.weight || null,
      vitalsData.weight_unit || 'lbs',
      vitalsData.height || null,
      vitalsData.height_unit || 'in',
      vitalsData.bmi || null,
      vitalsData.pain_level || null,
      vitalsData.notes || null,
      vitalsData.position || null,
      vitalsData.vital_type || 'routine',
      vitalsData.recorded_by,
      vitalsData.recorded_at || new Date()
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find many vitals with filtering
   */
  async findMany({ filters = {}, limit = 10, offset = 0, orderBy = [] }) {
    let query = `
      SELECT 
        pv.*,
        p.first_name,
        p.last_name,
        p.email as patient_email
      FROM patient_vitals pv
      LEFT JOIN patients p ON pv.patient_id = p.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    // Apply filters
    if (filters.patient_id) {
      paramCount++;
      query += ` AND pv.patient_id = $${paramCount}`;
      values.push(filters.patient_id);
    }

    if (filters.vital_type) {
      paramCount++;
      query += ` AND pv.vital_type = $${paramCount}`;
      values.push(filters.vital_type);
    }

    if (filters.recorded_by) {
      paramCount++;
      query += ` AND pv.recorded_by = $${paramCount}`;
      values.push(filters.recorded_by);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND pv.recorded_at >= $${paramCount}`;
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND pv.recorded_at <= $${paramCount}`;
      values.push(filters.date_to);
    }

    // Specific vital sign filters
    if (filters.has_blood_pressure) {
      query += ` AND (pv.systolic_bp IS NOT NULL OR pv.diastolic_bp IS NOT NULL)`;
    }

    if (filters.has_vitals_only) {
      query += ` AND (
        pv.systolic_bp IS NOT NULL OR pv.diastolic_bp IS NOT NULL OR 
        pv.heart_rate IS NOT NULL OR pv.temperature IS NOT NULL OR 
        pv.respiratory_rate IS NOT NULL OR pv.oxygen_saturation IS NOT NULL
      )`;
    }

    if (filters.has_measurements_only) {
      query += ` AND (pv.weight IS NOT NULL OR pv.height IS NOT NULL)`;
    }

    // Apply ordering
    if (orderBy.length > 0) {
      const orderClauses = orderBy.map(order => 
        `pv.${order.field} ${order.direction || 'ASC'}`
      );
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    } else {
      query += ` ORDER BY pv.recorded_at DESC`;
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
   * Find vital record by ID
   */
  async findById(vitalId) {
    const query = `
      SELECT 
        pv.*,
        p.first_name,
        p.last_name,
        p.email as patient_email
      FROM patient_vitals pv
      LEFT JOIN patients p ON pv.patient_id = p.id
      WHERE pv.id = $1
    `;

    const result = await db.query(query, [vitalId]);
    return result.rows[0] || null;
  }

  /**
   * Update a vital record
   */
  async update(vitalId, updateData) {
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
    values.push(vitalId);

    const query = `
      UPDATE patient_vitals 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a vital record
   */
  async delete(vitalId) {
    const query = `DELETE FROM patient_vitals WHERE id = $1`;
    const result = await db.query(query, [vitalId]);
    return result.rowCount > 0;
  }

  /**
   * Count vitals with filters
   */
  async count(filters = {}) {
    let query = `SELECT COUNT(*) as count FROM patient_vitals WHERE 1=1`;
    const values = [];
    let paramCount = 0;

    // Apply same filters as findMany
    if (filters.patient_id) {
      paramCount++;
      query += ` AND patient_id = $${paramCount}`;
      values.push(filters.patient_id);
    }

    if (filters.vital_type) {
      paramCount++;
      query += ` AND vital_type = $${paramCount}`;
      values.push(filters.vital_type);
    }

    if (filters.recorded_by) {
      paramCount++;
      query += ` AND recorded_by = $${paramCount}`;
      values.push(filters.recorded_by);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND recorded_at >= $${paramCount}`;
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND recorded_at <= $${paramCount}`;
      values.push(filters.date_to);
    }

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get latest vitals for a patient
   */
  async getLatestByPatient(patientId) {
    const query = `
      SELECT * FROM patient_vitals 
      WHERE patient_id = $1 
      ORDER BY recorded_at DESC 
      LIMIT 1
    `;

    const result = await db.query(query, [patientId]);
    return result.rows[0] || null;
  }

  /**
   * Get vitals in date range for trends
   */
  async getVitalsInRange(patientId, startDate, endDate, vitalType = null) {
    let query = `
      SELECT 
        recorded_at,
        systolic_bp, diastolic_bp, heart_rate, temperature, temperature_unit,
        respiratory_rate, oxygen_saturation, weight, weight_unit, height, height_unit,
        bmi, pain_level, vital_type
      FROM patient_vitals 
      WHERE patient_id = $1 
      AND recorded_at BETWEEN $2 AND $3
    `;

    const values = [patientId, startDate, endDate];

    if (vitalType) {
      query += ` AND vital_type = $4`;
      values.push(vitalType);
    }

    query += ` ORDER BY recorded_at ASC`;

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Get vital statistics for a patient
   */
  async getPatientVitalStats(patientId, period = '30d') {
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365
    };

    const days = periodDays[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN systolic_bp IS NOT NULL THEN 1 END) as bp_readings,
        COUNT(CASE WHEN heart_rate IS NOT NULL THEN 1 END) as hr_readings,
        COUNT(CASE WHEN temperature IS NOT NULL THEN 1 END) as temp_readings,
        COUNT(CASE WHEN weight IS NOT NULL THEN 1 END) as weight_readings,
        COUNT(CASE WHEN pain_level IS NOT NULL THEN 1 END) as pain_readings,
        
        AVG(systolic_bp) as avg_systolic,
        AVG(diastolic_bp) as avg_diastolic,
        AVG(heart_rate) as avg_heart_rate,
        AVG(temperature) as avg_temperature,
        AVG(weight) as avg_weight,
        AVG(pain_level) as avg_pain_level,
        
        MAX(recorded_at) as last_recorded,
        MIN(recorded_at) as first_recorded
      FROM patient_vitals 
      WHERE patient_id = $1 
      AND recorded_at >= $2
    `;

    const result = await db.query(query, [patientId, startDate]);
    return result.rows[0];
  }

  /**
   * Get abnormal vitals for a patient
   */
  async getAbnormalVitals(patientId, criteria = {}) {
    const {
      systolic_high = 140,
      systolic_low = 90,
      diastolic_high = 90,
      diastolic_low = 60,
      hr_high = 100,
      hr_low = 60,
      temp_high = 100.4,
      temp_low = 97.0,
      pain_high = 7
    } = criteria;

    const query = `
      SELECT 
        id, recorded_at, systolic_bp, diastolic_bp, heart_rate, 
        temperature, pain_level, vital_type,
        CASE 
          WHEN systolic_bp > $2 OR systolic_bp < $3 THEN 'blood_pressure'
          WHEN diastolic_bp > $4 OR diastolic_bp < $5 THEN 'blood_pressure'
          WHEN heart_rate > $6 OR heart_rate < $7 THEN 'heart_rate'
          WHEN temperature > $8 OR temperature < $9 THEN 'temperature'
          WHEN pain_level >= $10 THEN 'pain'
          ELSE 'normal'
        END as abnormal_type
      FROM patient_vitals 
      WHERE patient_id = $1
      AND (
        systolic_bp > $2 OR systolic_bp < $3 OR
        diastolic_bp > $4 OR diastolic_bp < $5 OR
        heart_rate > $6 OR heart_rate < $7 OR
        temperature > $8 OR temperature < $9 OR
        pain_level >= $10
      )
      ORDER BY recorded_at DESC
      LIMIT 50
    `;

    const values = [
      patientId, systolic_high, systolic_low, diastolic_high, diastolic_low,
      hr_high, hr_low, temp_high, temp_low, pain_high
    ];

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Bulk insert vitals (for data migration or bulk operations)
   */
  async bulkInsert(vitalsArray) {
    if (!vitalsArray || vitalsArray.length === 0) {
      return [];
    }

    const query = `
      INSERT INTO patient_vitals (
        patient_id, systolic_bp, diastolic_bp, heart_rate, temperature, temperature_unit,
        respiratory_rate, oxygen_saturation, weight, weight_unit, height, height_unit,
        bmi, pain_level, notes, position, vital_type, recorded_by, recorded_at
      ) VALUES 
    `;

    const valueStrings = [];
    const values = [];
    let paramCount = 0;

    vitalsArray.forEach((vitals) => {
      const rowValues = [
        vitals.patient_id,
        vitals.systolic_bp || null,
        vitals.diastolic_bp || null,
        vitals.heart_rate || null,
        vitals.temperature || null,
        vitals.temperature_unit || 'F',
        vitals.respiratory_rate || null,
        vitals.oxygen_saturation || null,
        vitals.weight || null,
        vitals.weight_unit || 'lbs',
        vitals.height || null,
        vitals.height_unit || 'in',
        vitals.bmi || null,
        vitals.pain_level || null,
        vitals.notes || null,
        vitals.position || null,
        vitals.vital_type || 'routine',
        vitals.recorded_by,
        vitals.recorded_at || new Date()
      ];

      const rowPlaceholders = rowValues.map(() => `$${++paramCount}`);
      valueStrings.push(`(${rowPlaceholders.join(', ')})`);
      values.push(...rowValues);
    });

    const fullQuery = query + valueStrings.join(', ') + ' RETURNING *';
    const result = await db.query(fullQuery, values);
    return result.rows;
  }
}

module.exports = new VitalsRepository(); 