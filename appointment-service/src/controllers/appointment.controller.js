const AppointmentService = require('../services/index.service.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
  BadRequestError,
  ForbiddenError,
  ConflictRequestError,
} = require('../utils/httpResponses.js');

class AppointmentController {
  static async create(req, res) {
    try {
      // Convert date and time to scheduled_at timestamp
      const { date, time, ...otherData } = req.body;
      
      let scheduled_at = null;
      if (date && time) {
        try {
          // Parse the date and time into a proper timestamp
          // Handle format like "Wednesday, June 25, 2025" and "10:00 AM"
          const dateTimeString = `${date} ${time}`;
          const parsedDate = new Date(dateTimeString);
          
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date format');
          }
          
          scheduled_at = parsedDate.toISOString();
        } catch (dateError) {
          console.error('Date parsing error:', dateError);
          return new InternalServerError('Invalid date or time format').send(res);
        }
      }
      
      // Extract user ID from JWT and add to appointment data
      const appointmentData = {
        ...otherData,
        user_id: req.user.sub, // Store sub (user ID) from JWT as user_id
        scheduled_at,
        date, // Keep original date string
        time  // Keep original time string
      };
      
      const appt = await AppointmentService.createAppointment(appointmentData);
      return new CREATED({ metadata: appt }).send(res);
    } catch (err) {
      console.error('Appointment creation error:', err);
      return new InternalServerError('error creating appointment').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const appt = await AppointmentService.getAppointment(Number(req.params.id));
      if (!appt) return new NotFoundError('not found').send(res);
      
      // Authorization check: patients can only see their own appointments
      if (req.user.role === 'patient' && appt.user_id !== req.user.sub) {
        return new NotFoundError('not found').send(res);
      }
      
      return new OK({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching appointment').send(res);
    }
  }

  static async update(req, res) {
    try {
      // First check if appointment exists and user has permission
      const existingAppt = await AppointmentService.getAppointment(Number(req.params.id));
      if (!existingAppt) return new NotFoundError('not found').send(res);
      
      // Authorization check: patients can only update their own appointments
      if (req.user.role === 'patient' && existingAppt.user_id !== req.user.sub) {
        return new NotFoundError('not found').send(res);
      }
      
      const appt = await AppointmentService.updateAppointment(
        Number(req.params.id),
        req.body
      );
      if (!appt) return new NotFoundError('not found').send(res);
      return new OK({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating appointment').send(res);
    }
  }

  static async list(req, res) {
    try {
      let appts;
      if (req.user.role === 'doctor') {
        appts = await AppointmentService.listAppointmentsByDoctor(req.user.sub);
      } else {
        // For patients, use sub (user ID) to filter their appointments
        appts = await AppointmentService.listAppointmentsByPatient(req.user.sub);
      }
      return new OK({ metadata: appts }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing appointments').send(res);
    }
  }

  static async delete(req, res) {
    try {
      // First check if appointment exists and user has permission
      const existingAppt = await AppointmentService.getAppointment(Number(req.params.id));
      if (!existingAppt) return new NotFoundError('not found').send(res);
      
      // Authorization check: patients can only delete their own appointments
      if (req.user.role === 'patient' && existingAppt.user_id !== req.user.sub) {
        return new NotFoundError('not found').send(res);
      }
      
      const appt = await AppointmentService.deleteAppointment(
        Number(req.params.id)
      );
      if (!appt) return new NotFoundError('not found').send(res);
      return new OK({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error deleting appointment').send(res);
    }
  }

  static async reschedule(req, res) {
    try {
      const appointmentId = Number(req.params.id);
      const { scheduled_at, date, time, reschedule_reason } = req.body;
      
      // Validation: Check required fields
      if (!scheduled_at || !date || !time) {
        return new BadRequestError('scheduled_at, date, and time are required').send(res);
      }
      
      // Validation: Check that new time is in the future
      const newAppointmentTime = new Date(scheduled_at);
      if (newAppointmentTime <= new Date()) {
        return new BadRequestError('New appointment time cannot be in the past').send(res);
      }
      
      // Check if appointment exists and user has permission
      const existingAppt = await AppointmentService.getAppointment(appointmentId);
      if (!existingAppt) {
        return new NotFoundError('Appointment not found').send(res);
      }
      
      // Authorization check: patients can only reschedule their own appointments
      if (req.user.role === 'patient' && existingAppt.user_id !== req.user.sub) {
        return new ForbiddenError('You can only reschedule your own appointments').send(res);
      }
      
      // Business rule: Can only reschedule scheduled or confirmed appointments
      if (!['scheduled', 'confirmed'].includes(existingAppt.status)) {
        return new ConflictRequestError(`Cannot reschedule appointment with status: ${existingAppt.status}`).send(res);
      }
      
      // Prepare reschedule data
      const rescheduleData = {
        scheduled_at,
        date,
        time,
        reschedule_reason: reschedule_reason || null
      };
      
      // Perform the reschedule
      const rescheduledAppt = await AppointmentService.rescheduleAppointment(appointmentId, rescheduleData);
      
      if (!rescheduledAppt) {
        return new NotFoundError('Failed to reschedule appointment').send(res);
      }
      
      return new OK({ 
        metadata: rescheduledAppt,
        message: 'Appointment rescheduled successfully'
      }).send(res);
      
    } catch (err) {
      console.error('Reschedule error:', err);
      return new InternalServerError('Error rescheduling appointment').send(res);
    }
  }

  static async patientProfile(req, res) {
    try {
      const appt = await AppointmentService.getAppointment(Number(req.params.id));
      if (!appt) return new NotFoundError('not found').send(res);
      const profile = await AppointmentService.getUserProfile(appt.patient_id);
      return new OK({ metadata: profile }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching profile').send(res);
    }
  }
}

module.exports = AppointmentController;
