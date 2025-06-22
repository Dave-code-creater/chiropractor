const { db } = require('../config/index.js');

// Create a new doctor
const createDoctor = async (doctorData) => {
  return await db
    .insertInto('doctors')
    .values(doctorData)
    .returningAll()
    .executeTakeFirstOrThrow();
};

// Get all doctors with optional filters
const getAllDoctors = async (filters = {}) => {
  let query = db.selectFrom('doctors').selectAll();
  
  if (filters.specialization) {
    query = query.where('specializations', '@>', `{${filters.specialization}}`);
  }
  
  if (filters.is_available !== undefined) {
    query = query.where('is_available', '=', filters.is_available);
  }
  
  if (filters.status) {
    query = query.where('status', '=', filters.status);
  }
  
  return await query.orderBy('first_name', 'asc').execute();
};

// Get doctor by ID
const getDoctorById = async (id) => {
  return await db
    .selectFrom('doctors')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

// Get doctor by user ID (from auth service)
const getDoctorByUserId = async (userId) => {
  return await db
    .selectFrom('doctors')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst();
};

// Update doctor
const updateDoctor = async (id, updateData) => {
  return await db
    .updateTable('doctors')
    .set({ ...updateData, updated_at: new Date() })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
};

// Delete doctor
const deleteDoctor = async (id) => {
  return await db
    .deleteFrom('doctors')
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
};

// Get doctor availability
const getDoctorAvailability = async (doctorId) => {
  return await db
    .selectFrom('doctor_availability')
    .selectAll()
    .where('doctor_id', '=', doctorId)
    .where('is_available', '=', true)
    .orderBy('day_of_week', 'asc')
    .orderBy('start_time', 'asc')
    .execute();
};

// Set doctor availability
const setDoctorAvailability = async (doctorId, availabilityData) => {
  // First, delete existing availability for this doctor
  await db
    .deleteFrom('doctor_availability')
    .where('doctor_id', '=', doctorId)
    .execute();
  
  // Then insert new availability
  if (availabilityData.length > 0) {
    const dataWithDoctorId = availabilityData.map(slot => ({
      ...slot,
      doctor_id: doctorId
    }));
    
    return await db
      .insertInto('doctor_availability')
      .values(dataWithDoctorId)
      .returningAll()
      .execute();
  }
  
  return [];
};

// Get all specializations
const getAllSpecializations = async () => {
  return await db
    .selectFrom('specializations')
    .selectAll()
    .orderBy('name', 'asc')
    .execute();
};

// Search doctors
const searchDoctors = async (searchTerm) => {
  return await db
    .selectFrom('doctors')
    .selectAll()
    .where((eb) => eb.or([
      eb('first_name', 'ilike', `%${searchTerm}%`),
      eb('last_name', 'ilike', `%${searchTerm}%`),
      eb('specializations', '@>', `{${searchTerm}}`),
      eb('bio', 'ilike', `%${searchTerm}%`)
    ]))
    .where('status', '=', 'active')
    .orderBy('rating', 'desc')
    .execute();
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  getDoctorByUserId,
  updateDoctor,
  deleteDoctor,
  getDoctorAvailability,
  setDoctorAvailability,
  getAllSpecializations,
  searchDoctors
}; 