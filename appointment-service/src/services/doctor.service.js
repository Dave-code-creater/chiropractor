const {
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
} = require('../repositories/doctor.repo.js');

const {
  BadRequestError,
  NotFoundError,
  ConflictRequestError
} = require('../utils/httpResponses.js');

class DoctorService {
  // Create a new doctor
  static async createDoctor(doctorData) {
    try {
      // Validate required fields
      const requiredFields = ['first_name', 'last_name', 'email'];
      for (const field of requiredFields) {
        if (!doctorData[field]) {
          throw new BadRequestError(`${field} is required`);
        }
      }

      // Check if doctor with email already exists
      const existingDoctors = await getAllDoctors({ email: doctorData.email });
      if (existingDoctors.length > 0) {
        throw new ConflictRequestError('Doctor with this email already exists');
      }

      const doctor = await createDoctor({
        ...doctorData,
        created_at: new Date(),
        updated_at: new Date()
      });

      return doctor;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictRequestError('Doctor with this email or license number already exists');
      }
      throw error;
    }
  }

  // Get all doctors with filtering
  static async getAllDoctors(filters = {}) {
    const doctors = await getAllDoctors(filters);
    
    // Add full name for convenience
    return doctors.map(doctor => ({
      ...doctor,
      full_name: `${doctor.first_name} ${doctor.last_name}`
    }));
  }

  // Get doctor by ID with availability
  static async getDoctorById(id) {
    const doctor = await getDoctorById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    // Get doctor's availability
    const availability = await getDoctorAvailability(id);

    return {
      ...doctor,
      full_name: `${doctor.first_name} ${doctor.last_name}`,
      availability
    };
  }

  // Get doctor by user ID
  static async getDoctorByUserId(userId) {
    const doctor = await getDoctorByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const availability = await getDoctorAvailability(doctor.id);

    return {
      ...doctor,
      full_name: `${doctor.first_name} ${doctor.last_name}`,
      availability
    };
  }

  // Update doctor
  static async updateDoctor(id, updateData) {
    const existingDoctor = await getDoctorById(id);
    if (!existingDoctor) {
      throw new NotFoundError('Doctor not found');
    }

    try {
      const updatedDoctor = await updateDoctor(id, updateData);
      return {
        ...updatedDoctor,
        full_name: `${updatedDoctor.first_name} ${updatedDoctor.last_name}`
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictRequestError('Email or license number already exists');
      }
      throw error;
    }
  }

  // Delete doctor
  static async deleteDoctor(id) {
    const doctor = await getDoctorById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    return await deleteDoctor(id);
  }

  // Set doctor availability
  static async setDoctorAvailability(doctorId, availabilityData) {
    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    // Validate availability data
    if (!Array.isArray(availabilityData)) {
      throw new BadRequestError('Availability data must be an array');
    }

    for (const slot of availabilityData) {
      if (!slot.day_of_week || slot.day_of_week < 0 || slot.day_of_week > 6) {
        throw new BadRequestError('Invalid day_of_week (must be 0-6)');
      }
      if (!slot.start_time || !slot.end_time) {
        throw new BadRequestError('start_time and end_time are required');
      }
    }

    return await setDoctorAvailability(doctorId, availabilityData);
  }

  // Get doctor availability
  static async getDoctorAvailability(doctorId) {
    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    return await getDoctorAvailability(doctorId);
  }

  // Get all specializations
  static async getAllSpecializations() {
    return await getAllSpecializations();
  }

  // Search doctors
  static async searchDoctors(searchTerm, filters = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestError('Search term must be at least 2 characters');
    }

    const doctors = await searchDoctors(searchTerm.trim());
    
    // Apply additional filters if provided
    let filteredDoctors = doctors;
    
    if (filters.specialization) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.specializations && doctor.specializations.includes(filters.specialization)
      );
    }
    
    if (filters.is_available !== undefined) {
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.is_available === filters.is_available
      );
    }

    return filteredDoctors.map(doctor => ({
      ...doctor,
      full_name: `${doctor.first_name} ${doctor.last_name}`
    }));
  }

  // Get available doctors for a specific date/time
  static async getAvailableDoctors(date, time) {
    const dayOfWeek = new Date(date).getDay();
    
    // Get all active doctors
    const doctors = await getAllDoctors({ 
      status: 'active', 
      is_available: true 
    });

    const availableDoctors = [];

    for (const doctor of doctors) {
      const availability = await getDoctorAvailability(doctor.id);
      
      // Check if doctor is available on this day and time
      const isAvailable = availability.some(slot => 
        slot.day_of_week === dayOfWeek &&
        slot.start_time <= time &&
        slot.end_time > time &&
        slot.is_available
      );

      if (isAvailable) {
        availableDoctors.push({
          ...doctor,
          full_name: `${doctor.first_name} ${doctor.last_name}`
        });
      }
    }

    return availableDoctors;
  }
}

module.exports = DoctorService; 