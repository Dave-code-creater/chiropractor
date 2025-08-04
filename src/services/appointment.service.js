const { BadRequestError, NotFoundError, InternalServerError } = require('../utils/httpResponses');
const { getUserRepository, getPatientRepository, getDoctorRepository, getAppointmentRepository } = require('../repositories');
const { api, error: logError, info } = require('../utils/logger');

/**
 * Appointment Service
 * Static methods for appointment management business logic
 * 
 * Flow: [Controller] -> [Service] -> [Repository] -> [Database]
 */
class AppointmentService {
  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment data
   * @param {Object} req - Request object
   * @returns {Object} Created appointment
   */
  static async createAppointment(appointmentData, req) {
    const {
      doctor_id, patient_id, appointment_date, appointment_time,
      location, reason_for_visit, additional_notes, status
    } = appointmentData;

    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();
      const doctorRepo = getDoctorRepository();

      // Extract user info from JWT (if available)
      const currentUser = req?.user;

      // Verify doctor exists (flexible approach for different user types)
      let doctor;
      try {
        doctor = await doctorRepo.findById(doctor_id);
      } catch (error) {
        // If doctor not found by ID, try to find by user_id (for admin/staff)
        try {
          doctor = await doctorRepo.findByUserId(doctor_id);
        } catch (secondError) {
          // If still not found, check if it's a valid user with medical privileges
          const userRepo = getUserRepository();
          const doctorUser = await userRepo.findById(doctor_id);

          if (!doctorUser || !['doctor', 'admin', 'staff'].includes(doctorUser.role)) {
            throw new BadRequestError('Invalid doctor/medical professional specified', '4041');
          }

          // Create a virtual doctor object for admin/staff
          doctor = {
            id: doctor_id,
            user_id: doctor_id,
            first_name: doctorUser.username || 'Staff',
            last_name: '',
            status: 'active',
            specialization: doctorUser.role === 'admin' ? 'Administration' : 'Medical Staff'
          };
        }
      }

      if (!doctor || (doctor.status && doctor.status !== 'active')) {
        throw new BadRequestError('Medical professional not available', '4041');
      }

      // Verify patient exists
      const patient = await patientRepo.findById(patient_id);
      if (!patient || patient.status !== 'active') {
        throw new BadRequestError('Patient not found or inactive', '4042');
      }

      // Parse and validate appointment datetime
      const appointmentDateTime = AppointmentService.parseAppointmentDateTime(appointment_date, appointment_time);

      // Check for scheduling conflicts
      const appointmentRepo = getAppointmentRepository();
      const hasConflict = await appointmentRepo.checkSchedulingConflict(doctor_id, appointmentDateTime);
      if (hasConflict) {
        throw new BadRequestError('Doctor is not available at this time slot', '4093');
      }

      // Create appointment record
      const appointmentRecord = {
        doctor_id,
        patient_id,
        appointment_date,
        appointment_time,
        location: location || 'main_office',
        reason_for_visit,
        additional_notes,
        status: status || 'scheduled',
        created_by: currentUser?.id
      };

      api.info('📝 Creating appointment record:', appointmentRecord);
      const appointment = await appointmentRepo.createAppointment(appointmentRecord);

      api.info(' Appointment created:', {
        id: appointment.id,
        doctor_id,
        patient_id,
        datetime: appointmentDateTime
      });

      return AppointmentService.formatAppointmentResponse(appointment, doctor, patient);
    } catch (error) {
      api.error('Create appointment service error:', error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new InternalServerError('Failed to create appointment', '5040');
    }
  }

  /**
   * Get all appointments with filtering and pagination
   * @param {Object} options - Query options
   * @param {Object} user - Current user for authorization filtering
   * @returns {Object} Appointments list with pagination
   */
  static async getAllAppointments(options = {}, user = null) {
    try {
      const {
        page = 1, limit = 10, doctor_id, patient_id, status,
        start_date, end_date, location
      } = options;

      const conditions = {};
      if (doctor_id) conditions.doctor_id = doctor_id;
      if (patient_id) conditions.patient_id = patient_id;
      if (status) conditions.status = status;
      if (location) conditions.location = location;

      // Add authorization filtering based on user role
      if (user) {
        if (user.role === 'doctor') {
          // Doctors can only see appointments assigned to them
          const doctorRepo = getDoctorRepository();
          const doctor = await doctorRepo.findByUserId(user.id);
          if (doctor) {
            conditions.doctor_id = doctor.id;
          } else {
            // If user is doctor but no doctor record found, return empty
            return {
              appointments: [],
              pagination: { page, limit, total: 0, pages: 0 }
            };
          }
        } else if (user.role === 'patient') {
          // Patients can only see their own appointments
          // Find patient record by user_id
          const patientRepo = getPatientRepository();
          const patient = await patientRepo.findByUserId(user.id);

          if (patient) {
            api.info(' Found patient record:', { patient_id: patient.id, user_id: user.id });
            conditions.patient_id = patient.id;
          } else {
            // If no patient record found, return empty results
            api.info('⚠️ No patient record found for user');
            return {
              appointments: [],
              pagination: { page, limit, total: 0, pages: 0 }
            };
          }
        }
        // Admin can see all appointments (no additional filtering)
      }

      // Date range filtering
      if (start_date || end_date) {
        conditions.date_range = { start_date, end_date };
      }

      const offset = (page - 1) * limit;
      const appointmentRepo = getAppointmentRepository();
      const appointments = await appointmentRepo.getAppointmentsByConditions(conditions, { limit, offset });
      const totalCount = await appointmentRepo.countAppointmentsByConditions(conditions);

      return {
        appointments,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      api.error('Get all appointments service error:', error);
      throw new InternalServerError('Failed to retrieve appointments', '5041');
    }
  }

  /**
   * Get appointment by ID
   * @param {number} appointmentId - Appointment ID
   * @returns {Object} Appointment data
   */
  static async getAppointmentById(appointmentId) {
    try {
      const appointment = await AppointmentService.findAppointmentById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found', '4048');
      }

      return appointment;
    } catch (error) {
      api.error('Get appointment by ID service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve appointment', '5042');
    }
  }

  /**
   * Update appointment
   * @param {number} appointmentId - Appointment ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated appointment
   */
  static async updateAppointment(appointmentId, updateData) {
    try {
      const existingAppointment = await AppointmentService.findAppointmentById(appointmentId);
      if (!existingAppointment) {
        throw new NotFoundError('Appointment not found', '4048');
      }

      // Parse new datetime if provided
      if (updateData.appointment_date && updateData.appointment_time) {
        const appointmentDateTime = AppointmentService.parseAppointmentDateTime(
          updateData.appointment_date,
          updateData.appointment_time
        );

        // Check for conflicts if changing datetime
        const hasConflict = await AppointmentService.checkSchedulingConflict(
          existingAppointment.doctor_id,
          appointmentDateTime,
          appointmentId // Exclude current appointment
        );
        if (hasConflict) {
          throw new BadRequestError('Doctor is not available at this time slot', '4093');
        }
      }

      const updatedAppointment = await AppointmentService.updateAppointmentRecord(appointmentId, updateData);
      api.info(' Appointment updated:', { id: appointmentId });

      return updatedAppointment;
    } catch (error) {
      api.error('Update appointment service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to update appointment', '5043');
    }
  }

  /**
   * Cancel appointment
   * @param {number} appointmentId - Appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Cancelled appointment
   */
  static async cancelAppointment(appointmentId, reason = null) {
    try {
      const appointment = await AppointmentService.findAppointmentById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found', '4048');
      }

      if (appointment.status === 'cancelled') {
        throw new BadRequestError('Appointment is already cancelled', '4022');
      }

      const updateData = {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date()
      };

      const cancelledAppointment = await AppointmentService.updateAppointmentRecord(appointmentId, updateData);
      api.info(' Appointment cancelled:', { id: appointmentId });

      return cancelledAppointment;
    } catch (error) {
      api.error('Cancel appointment service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to cancel appointment', '5044');
    }
  }

  // Helper methods

  static parseAppointmentDateTime(appointment_date, appointment_time) {
    let parsedDate;
    let parsedTime;

    // Handle different date formats
    if (appointment_date.includes(',')) {
      const dateStr = appointment_date.replace(/^[A-Za-z]+,\s*/, '');
      parsedDate = new Date(dateStr);
    } else {
      parsedDate = new Date(appointment_date);
    }

    // Handle different time formats
    if (appointment_time.includes('AM') || appointment_time.includes('PM')) {
      const [time, period] = appointment_time.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);

      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }

      parsedTime = `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
    } else {
      parsedTime = appointment_time.includes(':') ? `${appointment_time}:00` : appointment_time;
    }

    const appointmentDateTime = new Date(parsedDate);
    const [hours, minutes] = parsedTime.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return appointmentDateTime;
  }

  static async checkSchedulingConflict(doctorId, appointmentDateTime, excludeAppointmentId = null) {
    const appointmentRepo = getAppointmentRepository();
    return await appointmentRepo.checkSchedulingConflict(doctorId, appointmentDateTime, excludeAppointmentId);
  }

  static async createAppointmentRecord(data) {
    const appointmentRepo = getAppointmentRepository();
    return await appointmentRepo.createAppointment(data);
  }

  static async findAppointmentById(appointmentId) {
    const appointmentRepo = getAppointmentRepository();
    return await appointmentRepo.findAppointmentById(appointmentId);
  }

  static async updateAppointmentRecord(appointmentId, updateData) {
    const appointmentRepo = getAppointmentRepository();
    return await appointmentRepo.updateAppointment(appointmentId, updateData);
  }

  static async getAppointmentsByConditions(conditions, options) {
    const appointmentRepo = getAppointmentRepository();
    return await appointmentRepo.getAppointmentsByConditions(conditions, options);
  }

  static async countAppointmentsByConditions(conditions) {
    const appointmentRepo = getAppointmentRepository();
    return await appointmentRepo.countAppointmentsByConditions(conditions);
  }

  static formatAppointmentResponse(appointment, doctor = null, patient = null) {
    return {
      id: appointment.id,
      appointment_datetime: appointment.appointment_datetime,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      status: appointment.status,
      location: appointment.location,
      reason_for_visit: appointment.reason_for_visit,
      additional_notes: appointment.additional_notes,

      // Nested patient object
      patient: patient ? {
        id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone: patient.phone
      } : {
        id: appointment.patient_id,
        first_name: null,
        last_name: null,
        email: null,
        phone: null
      },

      // Nested doctor object
      doctor: doctor ? {
        id: doctor.id,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        specialization: doctor.specialization,
        phone_number: doctor.phone_number,
        email: doctor.email
      } : {
        id: appointment.doctor_id,
        first_name: null,
        last_name: null,
        specialization: null,
        phone_number: null,
        email: null
      },

      created_at: appointment.created_at,
      updated_at: appointment.updated_at
    };
  }

  /**
   * Get doctor availability for a specific date
   * @param {number} doctorId - Doctor ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object} Doctor availability data
   */
  static async getDoctorAvailability(doctorId, date) {
    try {
      const doctorRepo = getDoctorRepository();
      const userRepo = getUserRepository();

      // Get doctor details
      const doctor = await doctorRepo.findById(doctorId);
      if (!doctor || doctor.status !== 'active') {
        throw new NotFoundError('Doctor not found or inactive', '4041');
      }

      // Parse the date and get day of week (1-7)
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay() || 7; // Convert Sunday from 0 to 7

      // Get doctor's schedule for the day
      const schedule = await doctorRepo.getDoctorSchedule(doctorId, dayOfWeek);

      if (!schedule || !schedule.is_available) {
        return {
          is_available: false,
          available_slots: [],
          working_hours: null,
          total_slots: 0,
          booked_slots: 0,
          accepts_walkin: false,
          message: `Dr. ${doctor.first_name} ${doctor.last_name} is not available on this day`
        };
      }

      // Get existing appointments for the date
      const existingAppointments = await userRepo.findAppointmentsByDate(doctorId, date);

      // Generate available time slots
      const availableSlots = AppointmentService.generateTimeSlots(
        schedule.start_time,
        schedule.end_time,
        30, // 30-minute slots
        existingAppointments
      );

      return {
        is_available: availableSlots.length > 0,
        available_slots: availableSlots,
        working_hours: {
          start_time: schedule.start_time,
          end_time: schedule.end_time
        },
        accepts_walkin: schedule.accepts_walkin,
        total_slots: availableSlots.length + existingAppointments.length,
        booked_slots: existingAppointments.length,
        doctor_info: {
          id: doctor.id,
          name: `${doctor.first_name} ${doctor.last_name}`,
          specialization: doctor.specialization
        }
      };
    } catch (error) {
      api.error('Get doctor availability service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to get doctor availability', '5045');
    }
  }

  /**
   * Get doctor availability for multiple days
   * @param {number} doctorId - Doctor ID
   * @param {number} daysAhead - Number of days to look ahead
   * @returns {Array} Array of availability data for each day
   */
  static async getDoctorAvailabilityRange(doctorId, daysAhead = 30) {
    try {
      const availability = [];
      const today = new Date();

      for (let i = 0; i < daysAhead; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        try {
          const dayAvailability = await AppointmentService.getDoctorAvailability(doctorId, dateStr);
          availability.push({
            date: dateStr,
            day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
            ...dayAvailability
          });
        } catch (error) {
          // If there's an error for a specific day, include it but mark as unavailable
          availability.push({
            date: dateStr,
            day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
            is_available: false,
            available_slots: [],
            error: error.message
          });
        }
      }

      return availability;
    } catch (error) {
      api.error('Get doctor availability range service error:', error);
      throw new InternalServerError('Failed to get doctor availability range', '5046');
    }
  }

  /**
   * Generate available time slots for a day
   * @param {string} startTime - Start time (HH:MM format)
   * @param {string} endTime - End time (HH:MM format)  
   * @param {number} slotDuration - Duration of each slot in minutes
   * @param {Array} existingAppointments - Existing appointments
   * @returns {Array} Available time slots
   */
  static generateTimeSlots(startTime, endTime, slotDuration = 30, existingAppointments = []) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Get booked time slots
    const bookedSlots = existingAppointments.map(apt => {
      const time = apt.appointment_time || apt.time;
      if (time) {
        const [hour, minute] = time.split(':').map(Number);
        return hour * 60 + minute;
      }
      return null;
    }).filter(Boolean);

    // Generate slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      // Check if this slot is already booked
      const isBooked = bookedSlots.some(bookedMinutes =>
        Math.abs(minutes - bookedMinutes) < slotDuration
      );

      if (!isBooked) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Convert to 12-hour format for display
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;

        slots.push({
          time: timeStr,
          display_time: displayTime,
          available: true,
          duration_minutes: slotDuration
        });
      }
    }

    return slots;
  }

  /**
   * Check if a specific time slot is available
   * @param {number} doctorId - Doctor ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} time - Time in HH:MM format
   * @param {number} duration - Duration in minutes
   * @returns {Object} Availability check result
   */
  static async checkSlotAvailability(doctorId, date, time, duration = 30) {
    try {
      const availability = await AppointmentService.getDoctorAvailability(doctorId, date);

      if (!availability.is_available) {
        return {
          available: false,
          message: 'Doctor is not available on this date',
          alternatives: []
        };
      }

      // Check if the specific time slot is available
      const requestedSlot = availability.available_slots.find(slot => slot.time === time);

      if (requestedSlot) {
        return {
          available: true,
          message: 'Time slot is available',
          slot: requestedSlot
        };
      } else {
        return {
          available: false,
          message: 'Requested time slot is not available',
          alternatives: availability.available_slots.slice(0, 5) // Return first 5 alternatives
        };
      }
    } catch (error) {
      api.error('Check slot availability service error:', error);
      throw new InternalServerError('Failed to check slot availability', '5047');
    }
  }
}

module.exports = AppointmentService; 