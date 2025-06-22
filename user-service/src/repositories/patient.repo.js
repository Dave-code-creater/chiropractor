const { getDb } = require('../config/index.js');

class PatientRepository {
  static async findAll({ search, status, limit, offset }) {
    const db = getDb();
    let query = db.selectFrom('patients');

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('first_name', 'ilike', `%${search}%`),
          eb('last_name', 'ilike', `%${search}%`),
          eb('email', 'ilike', `%${search}%`),
          eb('phone', 'ilike', `%${search}%`)
        ])
      );
    }

    if (status) {
      query = query.where('status', '=', status);
    }

    return await query
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  static async findById(id) {
    const db = getDb();
    return await db
      .selectFrom('patients')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  static async create(patientData) {
    const db = getDb();
    const [patient] = await db
      .insertInto('patients')
      .values(patientData)
      .returningAll()
      .execute();
    return patient;
  }

  static async update(id, updateData) {
    const db = getDb();
    const [patient] = await db
      .updateTable('patients')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .execute();
    return patient;
  }

  static async count({ search, status }) {
    const db = getDb();
    let query = db.selectFrom('patients');

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('first_name', 'ilike', `%${search}%`),
          eb('last_name', 'ilike', `%${search}%`),
          eb('email', 'ilike', `%${search}%`),
          eb('phone', 'ilike', `%${search}%`)
        ])
      );
    }

    if (status) {
      query = query.where('status', '=', status);
    }

    const result = await query
      .select((eb) => eb.fn.count('id').as('count'))
      .executeTakeFirst();

    return parseInt(result.count);
  }

  static async countNewPatientsThisMonth() {
    const db = getDb();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db
      .selectFrom('patients')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('created_at', '>=', startOfMonth)
      .executeTakeFirst();

    return parseInt(result.count);
  }

  static async delete(id) {
    const db = getDb();
    return await db
      .deleteFrom('patients')
      .where('id', '=', id)
      .execute();
  }
}

module.exports = PatientRepository; 