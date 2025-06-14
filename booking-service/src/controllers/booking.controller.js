const {
  createBooking,
  getBookingById,
  updateBooking,
  listBookings,
  deleteBooking,
} = require('../repositories/booking.repo.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
} = require('../utils/httpResponses.js');

class BookingController {
  static async create(req, res) {
    try {
      const booking = await createBooking(req.body);
      return new CREATED({ metadata: booking }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating booking').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const booking = await getBookingById(Number(req.params.id));
      if (!booking) return new NotFoundError('not found').send(res);
      return new OK({ metadata: booking }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching booking').send(res);
    }
  }

  static async update(req, res) {
    try {
      const booking = await updateBooking(Number(req.params.id), req.body);
      if (!booking) return new NotFoundError('not found').send(res);
      return new OK({ metadata: booking }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating booking').send(res);
    }
  }

  static async delete(req, res) {
    try {
      const booking = await deleteBooking(Number(req.params.id));
      if (!booking) return new NotFoundError('not found').send(res);
      return new OK({ metadata: booking }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error deleting booking').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const bookings = await listBookings();
      return new OK({ metadata: bookings }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing bookings').send(res);
    }
  }
}

module.exports = BookingController;
