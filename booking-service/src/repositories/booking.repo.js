const { getDb } = require('../config/index.js');

const createBooking = async (booking) => {
  const db = getDb();
  const [row] = await db
    .insertInto('bookings')
    .values(booking)
    .returningAll()
    .execute();
  return row;
};

const getBookingById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('bookings')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateBooking = async (id, booking) => {
  const db = getDb();
  const [row] = await db
    .updateTable('bookings')
    .set(booking)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const deleteBooking = async (id) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('bookings')
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const listBookings = async () => {
  const db = getDb();
  return db.selectFrom('bookings').selectAll().execute();
};

module.exports = {
  createBooking,
  getBookingById,
  updateBooking,
  deleteBooking,
  listBookings,
};
