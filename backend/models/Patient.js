// models/Patient.js - Simplified version using query() method
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
    // Ensure parameters are valid integers
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 100));
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    
    console.log('Patient.findAll called with:', { limit: safeLimit, offset: safeOffset });
    
    const query = `
      SELECT * FROM patients 
      ORDER BY created_at DESC 
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    
    const results = await executeQuery(query);
    return results.map(row => new Patient(row));
  }

  // Get patient by ID
  static async findById(id) {
    const patientId = parseInt(id);
    if (isNaN(patientId) || patientId <= 0) {
      return null;
    }
    
    const query = `SELECT * FROM patients WHERE id = ${patientId}`;
    const results = await executeQuery(query);
    return results.length ? new Patient(results[0]) : null;
  }

  // Get patient by email
  static async findByEmail(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }
    
    const query = `SELECT * FROM patients WHERE email = '${email.replace(/'/g, "''")}'`;
    const results = await executeQuery(query);
    return results.length ? new Patient(results[0]) : null;
  }

  // Search patients
  static async search(searchTerm, limit = 50) {
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 100));
    const safeTerm = searchTerm.replace(/'/g, "''"); // Basic SQL injection protection
    
    const query = `
      SELECT * FROM patients 
      WHERE name LIKE '%${safeTerm}%' 
         OR email LIKE '%${safeTerm}%' 
         OR phone LIKE '%${safeTerm}%'
      ORDER BY name
      LIMIT ${safeLimit}
    `;
    
    const results = await executeQuery(query);
    return results.map(row => new Patient(row));
  }

  // Create new patient
  static async create(patientData) {
    const { name, age, phone, email, address } = patientData;
    
    // Validate required fields
    if (!name || !email || !age) {
      throw new Error('Name, email, and age are required');
    }
    
    // Check if email already exists
    const existingPatient = await Patient.findByEmail(email);
    if (existingPatient) {
      throw new Error('Patient with this email already exists');
    }

    const safeName = name.replace(/'/g, "''");
    const safeEmail = email.replace(/'/g, "''");
    const safePhone = phone ? phone.replace(/'/g, "''") : '';
    const safeAddress = address ? address.replace(/'/g, "''") : '';
    const safeAge = parseInt(age) || 0;

    const query = `
      INSERT INTO patients (name, age, phone, email, address)
      VALUES ('${safeName}', ${safeAge}, '${safePhone}', '${safeEmail}', '${safeAddress}')
    `;
    
    const result = await executeQuery(query);
    
    // Return the created patient
    return await Patient.findById(result.insertId);
  }

  // Update patient
  async update(updateData) {
    const { name, age, phone, email, address } = updateData;
    
    // Validate required fields
    if (!name || !email || !age) {
      throw new Error('Name, email, and age are required');
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== this.email) {
      const existingPatient = await Patient.findByEmail(email);
      if (existingPatient && existingPatient.id !== this.id) {
        throw new Error('Patient with this email already exists');
      }
    }

    const safeName = name.replace(/'/g, "''");
    const safeEmail = email.replace(/'/g, "''");
    const safePhone = phone ? phone.replace(/'/g, "''") : '';
    const safeAddress = address ? address.replace(/'/g, "''") : '';
    const safeAge = parseInt(age) || 0;

    const query = `
      UPDATE patients 
      SET name = '${safeName}', 
          age = ${safeAge}, 
          phone = '${safePhone}', 
          email = '${safeEmail}', 
          address = '${safeAddress}'
      WHERE id = ${this.id}
    `;
    
    await executeQuery(query);
    
    // Return updated patient
    return await Patient.findById(this.id);
  }

  // Delete patient
  async delete() {
    const query = `DELETE FROM patients WHERE id = ${this.id}`;
    await executeQuery(query);
    return true;
  }

  // Get patient's appointments
  async getAppointments() {
    const query = `
      SELECT a.*, d.name as doctor_name, d.specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ${this.id}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    return await executeQuery(query);
  }

  // Get statistics
  static async getStats() {
    try {
      const totalResult = await executeQuery('SELECT COUNT(*) as total FROM patients');
      const avgAgeResult = await executeQuery('SELECT AVG(age) as average_age FROM patients');
      const newThisWeekResult = await executeQuery('SELECT COUNT(*) as new_this_week FROM patients WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)');

      return {
        total: totalResult[0].total,
        averageAge: Math.round(avgAgeResult[0].average_age || 0),
        newThisWeek: newThisWeekResult[0].new_this_week
      };
    } catch (error) {
      console.error('Error getting patient stats:', error);
      return {
        total: 0,
        averageAge: 0,
        newThisWeek: 0
      };
    }
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