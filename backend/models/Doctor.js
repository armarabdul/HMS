// models/Doctor.js
const { executeQuery } = require('../config/database');

class Doctor {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.specialization = data.specialization;
    this.phone = data.phone;
    this.email = data.email;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll(limit = 100, offset = 0) {
    const query = `SELECT * FROM doctors ORDER BY name LIMIT ? OFFSET ?`;
    const results = await executeQuery(query, [limit, offset]);
    return results.map(row => new Doctor(row));
  }

  static async findById(id) {
    const query = 'SELECT * FROM doctors WHERE id = ?';
    const results = await executeQuery(query, [id]);
    return results.length ? new Doctor(results[0]) : null;
  }

  static async create(doctorData) {
    const { name, specialization, phone, email } = doctorData;
    const query = `INSERT INTO doctors (name, specialization, phone, email) VALUES (?, ?, ?, ?)`;
    const result = await executeQuery(query, [name, specialization, phone, email]);
    return await Doctor.findById(result.insertId);
  }

  async update(updateData) {
    const { name, specialization, phone, email } = updateData;
    const query = `UPDATE doctors SET name = ?, specialization = ?, phone = ?, email = ? WHERE id = ?`;
    await executeQuery(query, [name, specialization, phone, email, this.id]);
    return await Doctor.findById(this.id);
  }

  async delete() {
    const query = 'DELETE FROM doctors WHERE id = ?';
    await executeQuery(query, [this.id]);
    return true;
  }

  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM doctors',
      'SELECT COUNT(DISTINCT specialization) as specializations FROM doctors'
    ];
    const [totalResult, specializationsResult] = await Promise.all(
      queries.map(query => executeQuery(query))
    );
    return {
      total: totalResult[0].total,
      specializations: specializationsResult[0].specializations
    };
  }
}

module.exports = Doctor;