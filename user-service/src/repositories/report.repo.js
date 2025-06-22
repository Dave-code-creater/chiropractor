const { db } = require('../config/index.js');

// Reports table operations
const createReport = async (reportData) => {
  return await db
    .insertInto('reports')
    .values(reportData)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const getReports = async (filters) => {
  let query = db.selectFrom('reports').selectAll();
  
  // Apply filters
  if (filters.category && filters.category !== 'all') {
    query = query.where('category', '=', filters.category);
  }
  
  if (filters.status && filters.status !== 'all') {
    query = query.where('status', '=', filters.status);
  }
  
  if (filters.patientId) {
    query = query.where('patient_id', '=', filters.patientId);
  }
  
  if (filters.search) {
    query = query.where((eb) => eb.or([
      eb('name', 'ilike', `%${filters.search}%`),
      eb('template_data', '@>', `{"name": "${filters.search}"}`)
    ]));
  }
  
  // Apply sorting
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
  query = query.orderBy(filters.sortBy || 'created_at', sortOrder);
  
  // Count total records
  const countQuery = query.select(db.fn.count('id').as('total'));
  const totalResult = await countQuery.executeTakeFirst();
  const total = parseInt(totalResult.total);
  
  // Apply pagination
  const offset = (filters.page - 1) * filters.limit;
  const reports = await query
    .limit(filters.limit)
    .offset(offset)
    .execute();
  
  return {
    reports,
    pagination: {
      currentPage: filters.page,
      totalPages: Math.ceil(total / filters.limit),
      totalItems: total,
      itemsPerPage: filters.limit
    }
  };
};

const getReportById = async (reportId) => {
  return await db
    .selectFrom('reports')
    .selectAll()
    .where('id', '=', reportId)
    .executeTakeFirst();
};

const findByPatientId = async (patientId) => {
  return await db
    .selectFrom('reports')
    .selectAll()
    .where('patient_id', '=', patientId)
    .orderBy('created_at', 'desc')
    .execute();
};

const updateReport = async (reportId, updateData) => {
  return await db
    .updateTable('reports')
    .set(updateData)
    .where('id', '=', reportId)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const deleteReport = async (reportId) => {
  return await db
    .deleteFrom('reports')
    .where('id', '=', reportId)
    .returningAll()
    .executeTakeFirst();
};

// Patient Intake operations
const createPatientIntake = async (intakeData) => {
  return await db
    .insertInto('patient_intakes')
    .values(intakeData)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const updatePatientIntake = async (intakeId, updateData) => {
  return await db
    .updateTable('patient_intakes')
    .set(updateData)
    .where('id', '=', intakeId)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const getPatientIntake = async (reportId) => {
  return await db
    .selectFrom('patient_intakes')
    .selectAll()
    .where('report_id', '=', reportId)
    .executeTakeFirst();
};

// Insurance Details operations (using correct table name)
const createInsuranceDetails = async (insuranceData) => {
  return await db
    .insertInto('insurance_details_forms')
    .values(insuranceData)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const getInsuranceDetails = async (reportId) => {
  return await db
    .selectFrom('insurance_details_forms')
    .selectAll()
    .where('report_id', '=', reportId)
    .executeTakeFirst();
};

// Pain Evaluation operations
const createPainEvaluation = async (painData) => {
  return await db
    .insertInto('pain_evaluations')
    .values(painData)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const getPainEvaluations = async (reportId) => {
  return await db
    .selectFrom('pain_evaluations')
    .selectAll()
    .where('report_id', '=', reportId)
    .execute();
};

// Detailed Description operations
const createDetailedDescription = async (descriptionData) => {
  return await db
    .insertInto('detailed_descriptions')
    .values(descriptionData)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const getDetailedDescription = async (reportId) => {
  return await db
    .selectFrom('detailed_descriptions')
    .selectAll()
    .where('report_id', '=', reportId)
    .executeTakeFirst();
};

// Work Impact operations
const createWorkImpact = async (workData) => {
  return await db
    .insertInto('work_impact')
    .values(workData)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const getWorkImpact = async (reportId) => {
  return await db
    .selectFrom('work_impact')
    .selectAll()
    .where('report_id', '=', reportId)
    .executeTakeFirst();
};

// Health Conditions operations (using correct table name)
const createHealthConditions = async (healthData) => {
  return await db
    .insertInto('health_conditions_forms')
    .values(healthData)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const getHealthConditions = async (reportId) => {
  return await db
    .selectFrom('health_conditions_forms')
    .selectAll()
    .where('report_id', '=', reportId)
    .executeTakeFirst();
};

module.exports = {
  // Reports
  createReport,
  getReports,
  getReportById,
  findByPatientId,
  updateReport,
  deleteReport,
  
  // Patient Intake
  createPatientIntake,
  updatePatientIntake,
  getPatientIntake,
  
  // Insurance Details
  createInsuranceDetails,
  getInsuranceDetails,
  
  // Pain Evaluations
  createPainEvaluation,
  getPainEvaluations,
  
  // Detailed Descriptions
  createDetailedDescription,
  getDetailedDescription,
  
  // Work Impact
  createWorkImpact,
  getWorkImpact,
  
  // Health Conditions
  createHealthConditions,
  getHealthConditions
}; 