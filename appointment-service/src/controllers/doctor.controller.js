const DoctorService = require('../services/doctor.service.js');
const {
  OK,
  Created,
  NoContent,
  BadRequestError
} = require('../utils/httpResponses.js');

// Get all doctors
const getAllDoctors = async (req, res) => {
  const filters = {
    specialization: req.query.specialization,
    is_available: req.query.is_available === 'true' ? true : req.query.is_available === 'false' ? false : undefined,
    status: req.query.status || 'active'
  };

  const doctors = await DoctorService.getAllDoctors(filters);
  return new OK({ 
    metadata: doctors,
    message: 'Doctors retrieved successfully'
  }).send(res);
};

// Get doctor by ID
const getDoctorById = async (req, res) => {
  console.log('getDoctorById called with id:', req.params.id);
  const { id } = req.params;
  
  try {
    const doctor = await DoctorService.getDoctorById(parseInt(id));
    console.log('Doctor found:', doctor ? 'Yes' : 'No');
    
    return new OK({ 
      metadata: doctor,
      message: 'Doctor retrieved successfully'
    }).send(res);
  } catch (error) {
    console.error('Error in getDoctorById:', error);
    throw error;
  }
};

// Get doctor by user ID (for authenticated doctor users)
const getDoctorProfile = async (req, res) => {
  const userId = req.user.sub; // From JWT token
  const doctor = await DoctorService.getDoctorByUserId(parseInt(userId));
  
  return new OK({ 
    metadata: doctor,
    message: 'Doctor profile retrieved successfully'
  }).send(res);
};

// Create new doctor
const createDoctor = async (req, res) => {
  const doctorData = req.body;
  const doctor = await DoctorService.createDoctor(doctorData);
  
  return new Created({ 
    metadata: doctor,
    message: 'Doctor created successfully'
  }).send(res);
};

// Update doctor
const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const doctor = await DoctorService.updateDoctor(parseInt(id), updateData);
  
  return new OK({ 
    metadata: doctor,
    message: 'Doctor updated successfully'
  }).send(res);
};

// Update doctor profile (for authenticated doctor users)
const updateDoctorProfile = async (req, res) => {
  const userId = req.user.sub; // From JWT token
  const updateData = req.body;
  
  // First get the doctor by user ID to get the doctor ID
  const existingDoctor = await DoctorService.getDoctorByUserId(parseInt(userId));
  const doctor = await DoctorService.updateDoctor(existingDoctor.id, updateData);
  
  return new OK({ 
    metadata: doctor,
    message: 'Doctor profile updated successfully'
  }).send(res);
};

// Delete doctor
const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  await DoctorService.deleteDoctor(parseInt(id));
  
  return new NoContent().send(res);
};

// Get doctor availability
const getDoctorAvailability = async (req, res) => {
  const { id } = req.params;
  const availability = await DoctorService.getDoctorAvailability(parseInt(id));
  
  return new OK({ 
    metadata: availability,
    message: 'Doctor availability retrieved successfully'
  }).send(res);
};

// Set doctor availability
const setDoctorAvailability = async (req, res) => {
  const { id } = req.params;
  const availabilityData = req.body.availability;
  
  const availability = await DoctorService.setDoctorAvailability(parseInt(id), availabilityData);
  
  return new OK({ 
    metadata: availability,
    message: 'Doctor availability updated successfully'
  }).send(res);
};

// Set own availability (for authenticated doctor users)
const setOwnAvailability = async (req, res) => {
  const userId = req.user.sub; // From JWT token
  const availabilityData = req.body.availability;
  
  // First get the doctor by user ID to get the doctor ID
  const doctor = await DoctorService.getDoctorByUserId(parseInt(userId));
  const availability = await DoctorService.setDoctorAvailability(doctor.id, availabilityData);
  
  return new OK({ 
    metadata: availability,
    message: 'Your availability updated successfully'
  }).send(res);
};

// Get all specializations
const getAllSpecializations = async (req, res) => {
  const specializations = await DoctorService.getAllSpecializations();
  
  return new OK({ 
    metadata: specializations,
    message: 'Specializations retrieved successfully'
  }).send(res);
};

// Search doctors
const searchDoctors = async (req, res) => {
  const { q: searchTerm } = req.query;
  const filters = {
    specialization: req.query.specialization,
    is_available: req.query.is_available === 'true' ? true : req.query.is_available === 'false' ? false : undefined
  };
  
  const doctors = await DoctorService.searchDoctors(searchTerm, filters);
  
  return new OK({ 
    metadata: doctors,
    message: 'Doctor search completed successfully'
  }).send(res);
};

// Get available doctors for specific date/time
const getAvailableDoctors = async (req, res) => {
  const { date, time } = req.query;
  
  if (!date || !time) {
    throw new BadRequestError('Date and time are required');
  }
  
  const doctors = await DoctorService.getAvailableDoctors(date, time);
  
  return new OK({ 
    metadata: doctors,
    message: 'Available doctors retrieved successfully'
  }).send(res);
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorProfile,
  createDoctor,
  updateDoctor,
  updateDoctorProfile,
  deleteDoctor,
  getDoctorAvailability,
  setDoctorAvailability,
  setOwnAvailability,
  getAllSpecializations,
  searchDoctors,
  getAvailableDoctors
}; 