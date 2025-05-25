// models/Patient.js
const { executeQuery } = require('../config/database');

class Patient {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.age = data.age;
    this.phone = data.phone;
    this.email = data.email;
    this.address = data.address;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Get all patients
  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT * FROM patients 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(query, [limit, offset]);
    return results.map(row => new Patient(row));
  }

  // Get patient by ID
  static async findById(id) {
    const query = 'SELECT * FROM patients WHERE id = ?';
    const results = await executeQuery(query, [id]);
    return results.length ? new Patient(results[0]) : null;
  }

  // Get patient by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM patients WHERE email = ?';
    const results = await executeQuery(query, [email]);
    return results.length ? new Patient(results[0]) : null;
  }

  // Search patients
  static async search(searchTerm, limit = 50) {
    const query = `
      SELECT * FROM patients 
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
      ORDER BY name
      LIMIT ?
    `;
    const searchPattern = `%${searchTerm}%`;
    const results = await executeQuery(query, [searchPattern, searchPattern, searchPattern, limit]);
    return results.map(row => new Patient(row));
  }

  // Create new patient
  static async create(patientData) {
    const { name, age, phone, email, address } = patientData;
    
    // Check if email already exists
    const existingPatient = await Patient.findByEmail(email);
    if (existingPatient) {
      throw new Error('Patient with this email already exists');
    }

    const query = `
      INSERT INTO patients (name, age, phone, email, address)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await executeQuery(query, [name, age, phone, email, address]);
    
    // Return the created patient
    return await Patient.findById(result.insertId);
  }

  // Update patient
  async update(updateData) {
    const { name, age, phone, email, address } = updateData;
    
    // Check if email is being changed and if it already exists
    if (email && email !== this.email) {
      const existingPatient = await Patient.findByEmail(email);
      if (existingPatient && existingPatient.id !== this.id) {
        throw new Error('Patient with this email already exists');
      }
    }

    const query = `
      UPDATE patients 
      SET name = ?, age = ?, phone = ?, email = ?, address = ?
      WHERE id = ?
    `;
    await executeQuery(query, [name, age, phone, email, address, this.id]);
    
    // Return updated patient
    return await Patient.findById(this.id);
  }

  // Delete patient
  async delete() {
    const query = 'DELETE FROM patients WHERE id = ?';
    await executeQuery(query, [this.id]);
    return true;
  }

  // Get patient's appointments
  async getAppointments() {
    const query = `
      SELECT a.*, d.name as doctor_name, d.specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    return await executeQuery(query, [this.id]);
  }

  // Get statistics
  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM patients',
      'SELECT AVG(age) as average_age FROM patients',
      'SELECT COUNT(*) as new_this_week FROM patients WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)'
    ];

    const [totalResult, avgAgeResult, newThisWeekResult] = await Promise.all(
      queries.map(query => executeQuery(query))
    );

    return {
      total: totalResult[0].total,
      averageAge: Math.round(avgAgeResult[0].average_age || 0),
      newThisWeek: newThisWeekResult[0].new_this_week
    };
  }

  // Convert to JSON (remove sensitive data if needed)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      age: this.age,
      phone: this.phone,
      email: this.email,
      address: this.address,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Patient;