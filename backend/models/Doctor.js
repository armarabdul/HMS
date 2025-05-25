// models/Doctor.js - Simplified version using query() method
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
    // Ensure parameters are valid integers
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 100));
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    
    console.log('Doctor.findAll called with:', { limit: safeLimit, offset: safeOffset });
    
    const query = `SELECT * FROM doctors ORDER BY name LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    const results = await executeQuery(query);
    return results.map(row => new Doctor(row));
  }

  static async findById(id) {
    const doctorId = parseInt(id);
    if (isNaN(doctorId) || doctorId <= 0) {
      return null;
    }
    
    const query = `SELECT * FROM doctors WHERE id = ${doctorId}`;
    const results = await executeQuery(query);
    return results.length ? new Doctor(results[0]) : null;
  }

  static async findByEmail(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }
    
    const query = `SELECT * FROM doctors WHERE email = '${email.replace(/'/g, "''")}'`;
    const results = await executeQuery(query);
    return results.length ? new Doctor(results[0]) : null;
  }

  static async create(doctorData) {
    const { name, specialization, phone, email } = doctorData;
    
    // Validate required fields
    if (!name || !specialization || !email) {
      throw new Error('Name, specialization, and email are required');
    }
    
    // Check if email already exists
    const existingDoctor = await Doctor.findByEmail(email);
    if (existingDoctor) {
      throw new Error('Doctor with this email already exists');
    }
    
    const safeName = name.replace(/'/g, "''");
    const safeSpecialization = specialization.replace(/'/g, "''");
    const safePhone = phone ? phone.replace(/'/g, "''") : '';
    const safeEmail = email.replace(/'/g, "''");
    
    const query = `INSERT INTO doctors (name, specialization, phone, email) VALUES ('${safeName}', '${safeSpecialization}', '${safePhone}', '${safeEmail}')`;
    const result = await executeQuery(query);
    return await Doctor.findById(result.insertId);
  }

  async update(updateData) {
    const { name, specialization, phone, email } = updateData;
    
    // Validate required fields
    if (!name || !specialization || !email) {
      throw new Error('Name, specialization, and email are required');
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== this.email) {
      const existingDoctor = await Doctor.findByEmail(email);
      if (existingDoctor && existingDoctor.id !== this.id) {
        throw new Error('Doctor with this email already exists');
      }
    }
    
    const safeName = name.replace(/'/g, "''");
    const safeSpecialization = specialization.replace(/'/g, "''");
    const safePhone = phone ? phone.replace(/'/g, "''") : '';
    const safeEmail = email.replace(/'/g, "''");
    
    const query = `UPDATE doctors SET name = '${safeName}', specialization = '${safeSpecialization}', phone = '${safePhone}', email = '${safeEmail}' WHERE id = ${this.id}`;
    await executeQuery(query);
    return await Doctor.findById(this.id);
  }

  async delete() {
    const query = `DELETE FROM doctors WHERE id = ${this.id}`;
    await executeQuery(query);
    return true;
  }

  static async getStats() {
    try {
      const totalResult = await executeQuery('SELECT COUNT(*) as total FROM doctors');
      const specializationsResult = await executeQuery('SELECT COUNT(DISTINCT specialization) as specializations FROM doctors');
      
      return {
        total: totalResult[0].total,
        specializations: specializationsResult[0].specializations
      };
    } catch (error) {
      console.error('Error getting doctor stats:', error);
      return {
        total: 0,
        specializations: 0
      };
    }
  }
}

module.exports = Doctor;