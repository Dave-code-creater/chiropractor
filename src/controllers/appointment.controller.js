const { 
  AppointmentCreatedSuccess, 
  AppointmentsRetrievedSuccess, 
  SuccessResponse, 
  ErrorResponse 
} = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { appointmentCreateSchema, quickScheduleSchema, appointmentUpdateSchema } = require('../validators');
const AppointmentService = require('../services/AppointmentService');
const { api, error: logError, info } = require('../utils/logger');

const { getDoctorRepository } = require('../repositories');

/**
 * ===============================================
 * APPOINTMENT BOOKING CONTROLLER
 * ===============================================
 * 
 * Comprehensive appointment management system for chiropractor clinic
 * Handles all appointment booking, scheduling, and management operations
 * 
 * Flow: [Routing] -> [Controller] -> [Service] -> [Repository] -> [Database]
 */
class AppointmentController {
  
  // ===============================================
  // APPOINTMENT BOOKING ENDPOINTS
  // ===============================================

  /**
   * Create a new appointment booking
   * POST /appointments
   * 
   * Supports both registered patients and walk-in bookings
   */
  static async createAppointment(req, res) {
    try {
      api.info(' Creating new appointment:', req.body);
      
      const appointmentData = {
        ...req.body,
        // Map frontend fields to backend expected fields
        appointment_date: req.body.date || req.body.appointment_date,
        appointment_time: req.body.time || req.body.appointment_time,
        duration_minutes: req.body.duration || req.body.duration_minutes || 30,
        created_by: req.user?.id
      };

      const appointment = await AppointmentService.createAppointment(appointmentData, req);
      
      api.info(' Appointment created successfully:', appointment.id);
      
      return new AppointmentCreatedSuccess({ 
        appointment,
        message: 'Appointment booked successfully! You will receive a confirmation email shortly.'
      }).send(res);
      
    } catch (error) {
      api.error(' Appointment creation error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse(
        'Failed to book appointment. Please try again or contact our office.',
        500,
        '5000'
      ).send(res);
    }
  }

  /**
   * Book appointment for current user (Patient self-booking)
   * POST /appointments/book
   * 
   * Allows patients to book appointments for themselves
   */
  static async bookAppointmentForSelf(req, res) {
    try {


      const user = req.user;

      const appointmentData = {
        ...req.body,
        // Map frontend fields to backend expected fields
        appointment_date: req.body.date || req.body.appointment_date,
        appointment_time: req.body.time || req.body.appointment_time,
        duration_minutes: req.body.duration || req.body.duration_minutes || 30,
        // Link to current user (from JWT payload)
        patient_user_id: user.id,
        patient_name: req.body.patient_name || user.email.split('@')[0],
        patient_phone: req.body.patient_phone || user.phone_number,
        patient_email: user.email,
        appointment_type: req.body.appointment_type || 'consultation',
        status: 'scheduled',
        created_by: user.id
      };

      const appointment = await AppointmentService.createAppointment(appointmentData, req);
      
      api.info(' Patient self-booking successful:', appointment.id);
      
      return new SuccessResponse(
        'Appointment booked successfully! You will receive a confirmation email shortly.',
        201,
        {
          appointment,
          next_steps: [
            'Check your email for appointment confirmation',
            'Please arrive 15 minutes early for check-in',
            'Bring a valid ID and insurance card if you have one',
            'You can reschedule or cancel up to 24 hours before your appointment'
          ],
          contact_info: {
            message: 'If you have any questions, please contact our office',
            phone: process.env.CLINIC_PHONE || '(555) 123-4567',
            email: process.env.CLINIC_EMAIL || 'appointments@clinic.com'
          }
        }
      ).send(res);
      
    } catch (error) {
      api.error(' Patient self-booking error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse(
        'Failed to book appointment. Please try again or contact our office.',
        500,
        '5002'
      ).send(res);
    }
  }

  /**
   * Quick appointment booking (simplified form)
   * POST /appointments/quick-book
   * 
   * For emergency or walk-in appointments
   */
  static async quickBookAppointment(req, res) {
    try {
      api.info('⚡ Quick booking appointment:', req.body);
      
      const quickBookingData = {
        patient_name: req.body.patient_name,
        patient_phone: req.body.patient_phone,
        patient_email: req.body.patient_email,
        doctor_id: req.body.doctor_id,
        appointment_date: req.body.appointment_date,
        appointment_time: req.body.appointment_time,
        reason_for_visit: req.body.reason_for_visit || 'Walk-in consultation',
        appointment_type: 'walk-in',
        status: 'scheduled',
        duration_minutes: req.body.duration_minutes || 30,
        created_by: req.user?.id
      };

      const appointment = await AppointmentService.createAppointment(quickBookingData, req);
      
      return new SuccessResponse(
        'Quick appointment booked successfully!',
        201,
        {
          appointment,
          next_steps: [
            'Please arrive 15 minutes early for check-in',
            'Bring a valid ID and insurance card',
            'Complete intake forms online or at the clinic'
          ]
        }
      ).send(res);
      
    } catch (error) {
      api.error(' Quick booking error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse(
        'Failed to book quick appointment. Please call our office.',
        500,
        '5001'
      ).send(res);
    }
  }

  // ===============================================
  // APPOINTMENT RETRIEVAL ENDPOINTS
  // ===============================================

  /**
   * Get current user's appointments (for patients)
   * GET /appointments/me
   */
  static async getMyAppointments(req, res) {
    try {


      // Use the same service method as getAllAppointments but with specific user filtering
      const appointments = await AppointmentService.getAllAppointments(req.query, req.user);
      
      api.info(' Service returned my appointments:', { 
        count: appointments.appointments?.length || 0,
        hasData: !!appointments.appointments,
        pagination: appointments.pagination 
      });

      // Add cache-busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Format appointments with enhanced data for patient view
      const formattedAppointments = (appointments.appointments || []).map(appointment => ({
        id: appointment.id,
        // Doctor information
        doctor: {
          id: appointment.doctor_id,
          name: appointment.doctor_first_name && appointment.doctor_last_name 
            ? `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`
            : 'Unknown Doctor',
          specialization: appointment.doctor_specialization,
          phone: appointment.doctor_phone
        },
        // Patient information
        patient: {
          name: appointment.patient_name,
          phone: appointment.patient_phone,
          email: appointment.patient_email
        },
        // Appointment details
        appointment_datetime: appointment.appointment_datetime,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        appointment_type: appointment.appointment_type,
        reason_for_visit: appointment.reason_for_visit,
        additional_notes: appointment.additional_notes,
        duration_minutes: appointment.duration_minutes,
        status: appointment.status,
        // Metadata
        created_at: appointment.created_at,
        updated_at: appointment.updated_at,
        // Status information
        is_upcoming: new Date(appointment.appointment_datetime) > new Date(),
        can_cancel: appointment.status === 'scheduled' && new Date(appointment.appointment_datetime) > new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours notice
        can_reschedule: appointment.status === 'scheduled' && new Date(appointment.appointment_datetime) > new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours notice
      }));

      const total = appointments.pagination?.total || formattedAppointments.length;
      const page = parseInt(req.query.page || 1);
      const limit = parseInt(req.query.limit || 50);

      return new SuccessResponse('Your appointments retrieved successfully', 200, {
        appointments: formattedAppointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrevious: page > 1
        },
        summary: {
          total_appointments: total,
          upcoming_appointments: formattedAppointments.filter(a => a.is_upcoming).length,
          completed_appointments: formattedAppointments.filter(a => a.status === 'completed').length,
          cancelled_appointments: formattedAppointments.filter(a => a.status === 'cancelled').length
        }
      }).send(res);

    } catch (error) {
      api.error(' Get my appointments error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to retrieve your appointments', 500, '5000').send(res);
    }
  }

  /**
   * Get all appointments (admin/staff view with role-based filtering)
   * GET /appointments
   */
  static async getAllAppointments(req, res) {
    try {
      api.info('📋 Getting all appointments for user:', req.user?.role);

      
      const appointments = await AppointmentService.getAllAppointments(req.query, req.user);
      
      api.info(' Service returned appointments:', { 
        count: appointments.appointments?.length || 0,
        hasData: !!appointments.appointments,
        pagination: appointments.pagination 
      });
      
      // Add cache-busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      return new SuccessResponse('Appointments retrieved successfully', 200, {
        appointments: appointments.appointments || appointments.data || appointments,
        pagination: appointments.pagination,
        filters_applied: req.query,
        user_role: req.user?.role
      }).send(res);
      
    } catch (error) {
      api.error(' Get all appointments error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to retrieve appointments', 500, '5002').send(res);
    }
  }

  /**
   * Get specific appointment by ID
   * GET /appointments/:id
   */
  static async getAppointmentById(req, res) {
    try {
      const appointmentId = req.params.id;
  
      
      const appointment = await AppointmentService.getAppointmentById(appointmentId);
      
      // Add additional context for the appointment
      const enhancedAppointment = {
        ...appointment,
        can_cancel: appointment.status === 'scheduled' && new Date(appointment.appointment_datetime) > new Date(Date.now() + 24 * 60 * 60 * 1000),
        can_reschedule: appointment.status === 'scheduled' && new Date(appointment.appointment_datetime) > new Date(Date.now() + 2 * 60 * 60 * 1000),
        time_until_appointment: new Date(appointment.appointment_datetime) - new Date(),
        is_past: new Date(appointment.appointment_datetime) < new Date()
      };
      
      return new SuccessResponse('Appointment retrieved successfully', 200, enhancedAppointment).send(res);
      
    } catch (error) {
      api.error(' Get appointment by ID error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to retrieve appointment', 500, '5003').send(res);
    }
  }

  // ===============================================
  // APPOINTMENT MANAGEMENT ENDPOINTS
  // ===============================================

  /**
   * Update appointment
   * PUT /appointments/:id
   */
  static async updateAppointment(req, res) {
    try {
      const appointmentId = req.params.id;
      api.info('✏️ Updating appointment:', appointmentId, req.body);
      
      const updateData = {
        ...req.body,
        updated_by: req.user?.id,
        updated_at: new Date()
      };
      
      const appointment = await AppointmentService.updateAppointment(appointmentId, updateData);
      
      return new SuccessResponse('Appointment updated successfully', 200, {
        appointment,
        message: 'Appointment has been updated. Confirmation email sent to patient.'
      }).send(res);
      
    } catch (error) {
      api.error(' Update appointment error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to update appointment', 500, '5004').send(res);
    }
  }

  /**
   * Cancel appointment
   * DELETE /appointments/:id
   */
  static async cancelAppointment(req, res) {
    try {
      const appointmentId = req.params.id;
      const { reason, notify_patient = true } = req.body;
      
      api.info('❌ Cancelling appointment:', appointmentId, { reason, notify_patient });
      
      const appointment = await AppointmentService.cancelAppointment(appointmentId, reason, {
        cancelled_by: req.user?.id,
        notify_patient
      });
      
      return new SuccessResponse('Appointment cancelled successfully', 200, {
        appointment,
        message: notify_patient 
          ? 'Appointment cancelled. Patient has been notified via email.'
          : 'Appointment cancelled.'
      }).send(res);
      
    } catch (error) {
      api.error(' Cancel appointment error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to cancel appointment', 500, '5005').send(res);
    }
  }

  /**
   * Reschedule appointment
   * PUT /appointments/:id/reschedule
   */
  static async rescheduleAppointment(req, res) {
    try {
      const appointmentId = req.params.id;
      const { new_date, new_time, reason } = req.body;
      
      api.info('🔄 Rescheduling appointment:', appointmentId, { new_date, new_time, reason });
      
      const appointment = await AppointmentService.rescheduleAppointment(appointmentId, {
        new_date,
        new_time,
        reason,
        rescheduled_by: req.user?.id
      });
      
      return new SuccessResponse('Appointment rescheduled successfully', 200, {
        appointment,
        message: 'Appointment has been rescheduled. Confirmation email sent to patient.'
      }).send(res);
      
    } catch (error) {
      api.error(' Reschedule appointment error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to reschedule appointment', 500, '5006').send(res);
    }
  }

  // ===============================================
  // DOCTOR AND AVAILABILITY ENDPOINTS
  // ===============================================

  /**
   * Get all available doctors
   * GET /appointments/doctors
   */
  static async getAllDoctors(req, res) {
    try {
      api.info('👨‍⚕️ Getting all doctors with filters:', req.query);
      
      const { getDoctorRepository } = require('../repositories');
      const doctorRepo = getDoctorRepository();
      
      // Get query parameters for filtering
      const { is_available, specialization, limit, offset, page, date } = req.query;
      
      // Build options object for pagination
      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);
      if (page && limit) {
        options.offset = (parseInt(page) - 1) * parseInt(limit);
      }
      
      let doctors;
      
      // If filtering by specialization
      if (specialization) {
        doctors = await doctorRepo.getDoctorsBySpecialization(specialization, options);
      } else {
        doctors = await doctorRepo.getActiveDoctors(options);
      }
      
      // If checking availability for a specific date, filter further
      if (date && is_available === 'true') {
        const availableDoctors = [];
        
        for (const doctor of doctors) {
          const availability = await AppointmentService.getDoctorAvailability(doctor.id, date);
          if (availability && availability.available_slots && availability.available_slots.length > 0) {
            availableDoctors.push({
              ...doctor,
              available_slots: availability.available_slots,
              next_available: availability.available_slots[0]
            });
          }
        }
        
        doctors = availableDoctors;
      }
      
      // Format the response for frontend - supporting multiple field name formats
      const formattedDoctors = doctors.map(doctor => ({
        // Multiple ID formats for frontend compatibility
        id: doctor.id,
        userID: doctor.user_id,
        user_id: doctor.user_id,
        
        // Name formats
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        full_name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        display_name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        
        // Professional information
        specialization: doctor.specialization,
        specialty: doctor.specialization,
        years_of_experience: doctor.years_of_experience,
        
        // Contact information
        email: doctor.email,
        phone: doctor.phone,
        office_phone: doctor.phone,
        
        // Status and availability
        is_active: doctor.is_active,
        isActive: doctor.is_active,
        status: doctor.is_active ? 'active' : 'inactive',
        
        // Schedule information
        consultation_fee: doctor.consultation_fee,
        consultationFee: doctor.consultation_fee,
        available_slots: doctor.available_slots || [],
        next_available: doctor.next_available || null,
        
        // Metadata
        created_at: doctor.created_at,
        updated_at: doctor.updated_at
      }));

      api.info(' Returning doctors:', { 
        count: formattedDoctors.length,
        filters: { is_available, specialization, date }
      });

      // Add cache-busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      return new SuccessResponse('Doctors retrieved successfully', 200, {
        doctors: formattedDoctors,
        total: formattedDoctors.length,
        filters_applied: req.query,
        available_specializations: [...new Set(formattedDoctors.map(d => d.specialization).filter(Boolean))]
      }).send(res);
      
    } catch (error) {
      api.error(' Get doctors error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to retrieve doctors', 500, '5007').send(res);
    }
  }

  /**
   * Get doctor availability
   * GET /appointments/doctors/:doctorId/availability
   */
  static async getDoctorAvailability(req, res) {
    try {
      const { doctorId } = req.params;
      const { date, days_ahead = 30 } = req.query;
      
      api.info(' Getting doctor availability:', { doctorId, date, days_ahead });

      const doctorRepo = getDoctorRepository();
      
      // Get doctor's weekly schedule, create default if doesn't exist
      let weeklySchedule = await doctorRepo.getDoctorWeeklySchedule(doctorId);
      
      // If no schedule exists, create default schedules
      if (weeklySchedule.length === 0) {
        api.info(' No schedule found for doctor, creating default schedules:', { doctorId });
        weeklySchedule = await doctorRepo.createDefaultSchedules(doctorId);
      }
      
      // Convert schedule to frontend format
      const workingHours = {
        monday: { start: "00:00", end: "00:00", enabled: false },
        tuesday: { start: "00:00", end: "00:00", enabled: false },
        wednesday: { start: "00:00", end: "00:00", enabled: false },
        thursday: { start: "00:00", end: "00:00", enabled: false },
        friday: { start: "00:00", end: "00:00", enabled: false },
        saturday: { start: "00:00", end: "00:00", enabled: false },
        sunday: { start: "00:00", end: "00:00", enabled: false }
      };

      // Map day numbers to day names
      const dayMap = {
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
        7: 'sunday'
      };

      // Fill in the actual schedule
      weeklySchedule.forEach(schedule => {
        const dayName = dayMap[schedule.day_of_week];
        workingHours[dayName] = {
          start: schedule.start_time.slice(0, 5), // Convert "09:00:00" to "09:00"
          end: schedule.end_time.slice(0, 5),
          enabled: schedule.is_available,
          accepts_walkin: schedule.accepts_walkin
        };
      });
      
      if (date) {
        // Get availability for specific date
        const availability = await AppointmentService.getDoctorAvailability(doctorId, date);
        
        // Add cache-busting headers
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });

        return new SuccessResponse('Doctor availability retrieved successfully', 200, {
          doctor_id: doctorId,
          date,
          workingHours,
          ...availability,
          booking_instructions: [
            'Select your preferred time slot',
            'Appointments are typically 30-60 minutes',
            'Please arrive 15 minutes early',
            'Bring valid ID and insurance information'
          ]
        }).send(res);
      }

      // If no date specified, just return the working hours
      return new SuccessResponse('Doctor schedule retrieved successfully', 200, {
        doctor_id: doctorId,
        workingHours
      }).send(res);
      
    } catch (error) {
      api.error('Get doctor availability error:', error);
      return new ErrorResponse(
        error.message || 'Failed to retrieve doctor availability',
        error.statusCode || 500,
        error.code || '5008'
      ).send(res);
    }
  }

  // ===============================================
  // PATIENT-SPECIFIC ENDPOINTS
  // ===============================================

  /**
   * Get patient appointments
   * GET /appointments/patient/:patientId
   */
  static async getPatientAppointments(req, res) {
    try {
      const { patientId } = req.params;
  
      
      const appointments = await AppointmentService.getPatientAppointments(patientId, req.query);
      
      return new SuccessResponse('Patient appointments retrieved successfully', 200, {
        patient_id: patientId,
        appointments: appointments.data || appointments,
        pagination: appointments.pagination,
        summary: appointments.summary
      }).send(res);
      
    } catch (error) {
      api.error(' Get patient appointments error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to retrieve patient appointments', 500, '5009').send(res);
    }
  }

  // ===============================================
  // UTILITY ENDPOINTS
  // ===============================================

  /**
   * Check appointment availability
   * POST /appointments/check-availability
   */
  static async checkAvailability(req, res) {
    try {
      const { doctor_id, date, time, duration_minutes = 30 } = req.body;
      
  
      
      const availability = await AppointmentService.checkSlotAvailability(
        doctor_id, 
        date, 
        time, 
        duration_minutes
      );
      
      return new SuccessResponse('Availability checked successfully', 200, {
        doctor_id,
        requested_slot: { date, time, duration_minutes },
        is_available: availability.available,
        conflicts: availability.conflicts || [],
        alternative_slots: availability.alternatives || [],
        message: availability.available 
          ? 'Time slot is available for booking'
          : 'Time slot is not available. Please choose an alternative time.'
      }).send(res);

      } catch (error) {
      api.error(' Check availability error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to check availability', 500, '5010').send(res);
    }
  }

  /**
   * Get appointment statistics
   * GET /appointments/stats
   */
  static async getAppointmentStats(req, res) {
    try {
      api.info('📊 Getting appointment statistics for user:', req.user?.role);
      
      const stats = await AppointmentService.getAppointmentStatistics(req.user, req.query);
      
      return new SuccessResponse('Appointment statistics retrieved successfully', 200, {
        ...stats,
        generated_at: new Date(),
        user_role: req.user?.role
      }).send(res);
      
    } catch (error) {
      api.error(' Get appointment stats error:', error);
      
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      return new ErrorResponse('Failed to retrieve appointment statistics', 500, '5011').send(res);
    }
  }
}

module.exports = AppointmentController; 