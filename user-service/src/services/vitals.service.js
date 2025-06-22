const vitalsRepository = require('../repositories/vitals.repo');
const { createNotFoundError, createConflictError } = require('../middlewares/error.middleware');

/**
 * Vitals Service
 * Business logic for patient vital signs management
 */
class VitalsService {
  /**
   * Record new vitals for a patient
   */
  async recordVitals(vitalsData) {
    try {
      // Calculate BMI if height and weight are provided
      if (vitalsData.height && vitalsData.weight) {
        vitalsData.bmi = this.calculateBMI(vitalsData.height, vitalsData.weight, vitalsData.height_unit, vitalsData.weight_unit);
      }

      const vitals = await vitalsRepository.create(vitalsData);
      return vitals;
    } catch (error) {
      if (error.code === 'FOREIGN_KEY_VIOLATION') {
        throw createNotFoundError('Patient not found');
      }
      throw error;
    }
  }

  /**
   * Get patient vitals with filtering and pagination
   */
  async getPatientVitals(filters, options) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const result = await vitalsRepository.findMany({
      filters,
      limit,
      offset,
      orderBy: [{ field: 'recorded_at', direction: 'DESC' }]
    });

    const total = await vitalsRepository.count(filters);

    return {
      vitals: result,
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
   * Get a specific vital record by ID
   */
  async getVitalById(vitalId) {
    const vital = await vitalsRepository.findById(vitalId);
    return vital;
  }

  /**
   * Update a vital record
   */
  async updateVital(vitalId, updateData) {
    const existingVital = await vitalsRepository.findById(vitalId);
    if (!existingVital) {
      return null;
    }

    // Recalculate BMI if height or weight changed
    if (updateData.height || updateData.weight) {
      const height = updateData.height || existingVital.height;
      const weight = updateData.weight || existingVital.weight;
      const heightUnit = updateData.height_unit || existingVital.height_unit;
      const weightUnit = updateData.weight_unit || existingVital.weight_unit;
      
      if (height && weight) {
        updateData.bmi = this.calculateBMI(height, weight, heightUnit, weightUnit);
      }
    }

    const updatedVital = await vitalsRepository.update(vitalId, updateData);
    return updatedVital;
  }

  /**
   * Delete a vital record
   */
  async deleteVital(vitalId) {
    const existingVital = await vitalsRepository.findById(vitalId);
    if (!existingVital) {
      return false;
    }

    await vitalsRepository.delete(vitalId);
    return true;
  }

  /**
   * Get vitals summary for a patient
   */
  async getVitalsSummary(patientId, period = '30d') {
    const dateFrom = this.getPeriodStartDate(period);
    
    const filters = {
      patient_id: patientId,
      date_from: dateFrom
    };

    const vitals = await vitalsRepository.findMany({
      filters,
      orderBy: [{ field: 'recorded_at', direction: 'DESC' }]
    });

    // Calculate summary statistics
    const summary = this.calculateVitalsSummary(vitals);
    
    return {
      period,
      patient_id: patientId,
      total_records: vitals.length,
      date_range: {
        from: dateFrom,
        to: new Date()
      },
      summary
    };
  }

  /**
   * Get vitals trends for a patient
   */
  async getVitalsTrends(patientId, vitalType, period = '90d') {
    const dateFrom = this.getPeriodStartDate(period);
    
    const filters = {
      patient_id: patientId,
      date_from: dateFrom
    };

    const vitals = await vitalsRepository.findMany({
      filters,
      orderBy: [{ field: 'recorded_at', direction: 'ASC' }]
    });

    // Extract trend data for specific vital type
    const trendData = vitals
      .filter(vital => vital[vitalType] !== null && vital[vitalType] !== undefined)
      .map(vital => ({
        date: vital.recorded_at,
        value: vital[vitalType],
        unit: this.getVitalUnit(vitalType, vital)
      }));

    // Calculate trend statistics
    const trendStats = this.calculateTrendStats(trendData);

    return {
      vital_type: vitalType,
      period,
      patient_id: patientId,
      data_points: trendData.length,
      trend_data: trendData,
      statistics: trendStats
    };
  }

  /**
   * Calculate BMI
   */
  calculateBMI(height, weight, heightUnit = 'in', weightUnit = 'lbs') {
    // Convert to metric (kg, cm)
    let weightKg = weight;
    let heightCm = height;

    if (weightUnit === 'lbs') {
      weightKg = weight * 0.453592;
    }

    if (heightUnit === 'in') {
      heightCm = height * 2.54;
    }

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get period start date
   */
  getPeriodStartDate(period) {
    const now = new Date();
    const periodMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365
    };

    const days = periodMap[period] || 30;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);
    
    return startDate;
  }

  /**
   * Calculate vitals summary statistics
   */
  calculateVitalsSummary(vitals) {
    const vitalTypes = [
      'systolic_bp', 'diastolic_bp', 'heart_rate', 'temperature',
      'respiratory_rate', 'oxygen_saturation', 'weight', 'height', 'bmi', 'pain_level'
    ];

    const summary = {};

    vitalTypes.forEach(type => {
      const values = vitals
        .filter(vital => vital[type] !== null && vital[type] !== undefined)
        .map(vital => vital[type]);

      if (values.length > 0) {
        summary[type] = {
          count: values.length,
          latest: values[0], // vitals are ordered DESC by recorded_at
          average: Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 10) / 10,
          min: Math.min(...values),
          max: Math.max(...values),
          unit: this.getVitalUnitByType(type)
        };
      }
    });

    return summary;
  }

  /**
   * Calculate trend statistics
   */
  calculateTrendStats(trendData) {
    if (trendData.length === 0) {
      return null;
    }

    const values = trendData.map(point => point.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend direction (simple linear regression)
    let trend = 'stable';
    if (trendData.length >= 2) {
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const percentChange = ((lastValue - firstValue) / firstValue) * 100;

      if (percentChange > 5) {
        trend = 'increasing';
      } else if (percentChange < -5) {
        trend = 'decreasing';
      }
    }

    return {
      average: Math.round(average * 10) / 10,
      min,
      max,
      trend,
      data_points: trendData.length
    };
  }

  /**
   * Get unit for a specific vital from vital record
   */
  getVitalUnit(vitalType, vital) {
    const unitMap = {
      temperature: vital.temperature_unit || 'F',
      weight: vital.weight_unit || 'lbs',
      height: vital.height_unit || 'in'
    };

    return unitMap[vitalType] || this.getVitalUnitByType(vitalType);
  }

  /**
   * Get default unit for vital type
   */
  getVitalUnitByType(vitalType) {
    const unitMap = {
      systolic_bp: 'mmHg',
      diastolic_bp: 'mmHg',
      heart_rate: 'bpm',
      temperature: 'F',
      respiratory_rate: 'breaths/min',
      oxygen_saturation: '%',
      weight: 'lbs',
      height: 'in',
      bmi: 'kg/m²',
      pain_level: '/10'
    };

    return unitMap[vitalType] || '';
  }
}

module.exports = new VitalsService(); 