// models/Appointment.js - Simplified version using query() method
const { executeQuery } = require('../config/database');

class Appointment {
  constructor(data) {
    this.id = data.id;
    this.patient_id = data.patient_id;
    this.doctor_id = data.doctor_id;
    this.appointment_date = data.appointment_date;
    this.appointment_time = data.appointment_time;
    this.status = data.status;
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    // Additional fields from joins
    this.patient_name = data.patient_name;
    this.doctor_name = data.doctor_name;
    this.doctor_specialization = data.doctor_specialization;
  }

  static async findAll(limit = 100, offset = 0) {
    // Ensure parameters are valid integers
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 100));
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    
    console.log('Appointment.findAll called with:', { limit: safeLimit, offset: safeOffset });
    
    const query = `
      SELECT a.*, p.name as patient_name, d.name as doctor_name, d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    
    const results = await executeQuery(query);
    return results.map(row => new Appointment(row));
  }

  static async findById(id) {
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId) || appointmentId <= 0) {
      return null;
    }
    
    const query = `
      SELECT a.*, p.name as patient_name, d.name as doctor_name, d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ${appointmentId}
    `;
    
    const results = await executeQuery(query);
    return results.length ? new Appointment(results[0]) : null;
  }

  static async create(appointmentData) {
    const { patient_id, doctor_id, appointment_date, appointment_time, status = 'Scheduled', notes } = appointmentData;
    
    // Validate required fields
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      throw new Error('Patient ID, Doctor ID, appointment date, and time are required');
    }
    
    const safePatientId = parseInt(patient_id);
    const safeDoctorId = parseInt(doctor_id);
    const safeStatus = status.replace(/'/g, "''");
    const safeNotes = notes ? notes.replace(/'/g, "''") : '';
    
    // Check for conflicts
    const conflictQuery = `
      SELECT COUNT(*) as count FROM appointments 
      WHERE doctor_id = ${safeDoctorId} 
        AND appointment_date = '${appointment_date}' 
        AND appointment_time = '${appointment_time}' 
        AND status != 'Cancelled'
    `;
    
    const conflictResult = await executeQuery(conflictQuery);
    
    if (conflictResult[0].count > 0) {
      throw new Error('Doctor is not available at this time');
    }

    const query = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, notes)
      VALUES (${safePatientId}, ${safeDoctorId}, '${appointment_date}', '${appointment_time}', '${safeStatus}', '${safeNotes}')
    `;
    
    const result = await executeQuery(query);
    return await Appointment.findById(result.insertId);
  }

  async update(updateData) {
    const { patient_id, doctor_id, appointment_date, appointment_time, status, notes } = updateData;
    
    // Validate required fields
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      throw new Error('Patient ID, Doctor ID, appointment date, and time are required');
    }
    
    const safePatientId = parseInt(patient_id);
    const safeDoctorId = parseInt(doctor_id);
    const safeStatus = status ? status.replace(/'/g, "''") : 'Scheduled';
    const safeNotes = notes ? notes.replace(/'/g, "''") : '';
    
    // Check for conflicts if time/date/doctor is being changed
    if (safeDoctorId !== this.doctor_id || appointment_date !== this.appointment_date || appointment_time !== this.appointment_time) {
      const conflictQuery = `
        SELECT COUNT(*) as count FROM appointments 
        WHERE doctor_id = ${safeDoctorId} 
          AND appointment_date = '${appointment_date}' 
          AND appointment_time = '${appointment_time}' 
          AND status != 'Cancelled' 
          AND id != ${this.id}
      `;
      
      const conflictResult = await executeQuery(conflictQuery);
      
      if (conflictResult[0].count > 0) {
        throw new Error('Doctor is not available at this time');
      }
    }

    const query = `
      UPDATE appointments 
      SET patient_id = ${safePatientId}, 
          doctor_id = ${safeDoctorId}, 
          appointment_date = '${appointment_date}', 
          appointment_time = '${appointment_time}', 
          status = '${safeStatus}', 
          notes = '${safeNotes}'
      WHERE id = ${this.id}
    `;
    
    await executeQuery(query);
    return await Appointment.findById(this.id);
  }

  async delete() {
    const query = `DELETE FROM appointments WHERE id = ${this.id}`;
    await executeQuery(query);
    return true;
  }

  static async getTodaysAppointments() {
    const query = `
      SELECT a.*, p.name as patient_name, d.name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE DATE(a.appointment_date) = CURDATE()
      ORDER BY a.appointment_time
    `;
    
    const results = await executeQuery(query);
    return results.map(row => new Appointment(row));
  }

  static async getStats() {
    try {
      const totalResult = await executeQuery('SELECT COUNT(*) as total FROM appointments');
      const todayResult = await executeQuery('SELECT COUNT(*) as today FROM appointments WHERE DATE(appointment_date) = CURDATE()');
      const completedTodayResult = await executeQuery('SELECT COUNT(*) as completed_today FROM appointments WHERE DATE(appointment_date) = CURDATE() AND status = "Completed"');
      const statusResult = await executeQuery('SELECT status, COUNT(*) as count FROM appointments GROUP BY status');

      const statusCounts = {};
      statusResult.forEach(row => {
        statusCounts[row.status] = row.count;
      });

      return {
        total: totalResult[0].total,
        today: todayResult[0].today,
        completedToday: completedTodayResult[0].completed_today,
        statusDistribution: statusCounts
      };
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      return {
        total: 0,
        today: 0,
        completedToday: 0,
        statusDistribution: {}
      };
    }
  }

  toJSON() {
    return {
      id: this.id,
      patient_id: this.patient_id,
      doctor_id: this.doctor_id,
      appointment_date: this.appointment_date,
      appointment_time: this.appointment_time,
      status: this.status,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at,
      patient_name: this.patient_name,
      doctor_name: this.doctor_name,
      doctor_specialization: this.doctor_specialization
    };
  }
}

module.exports = Appointment;