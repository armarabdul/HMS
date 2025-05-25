// models/Appointment.js
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
    const query = `
      SELECT a.*, p.name as patient_name, d.name as doctor_name, d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(query, [limit, offset]);
    return results.map(row => new Appointment(row));
  }

  static async findById(id) {
    const query = `
      SELECT a.*, p.name as patient_name, d.name as doctor_name, d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
    `;
    const results = await executeQuery(query, [id]);
    return results.length ? new Appointment(results[0]) : null;
  }

  static async create(appointmentData) {
    const { patient_id, doctor_id, appointment_date, appointment_time, status = 'Scheduled', notes } = appointmentData;
    
    // Check for conflicts
    const conflictQuery = `
      SELECT COUNT(*) as count FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'Cancelled'
    `;
    const conflictResult = await executeQuery(conflictQuery, [doctor_id, appointment_date, appointment_time]);
    
    if (conflictResult[0].count > 0) {
      throw new Error('Doctor is not available at this time');
    }

    const query = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await executeQuery(query, [patient_id, doctor_id, appointment_date, appointment_time, status, notes]);
    return await Appointment.findById(result.insertId);
  }

  async update(updateData) {
    const { patient_id, doctor_id, appointment_date, appointment_time, status, notes } = updateData;
    
    // Check for conflicts if time/date/doctor is being changed
    if (doctor_id !== this.doctor_id || appointment_date !== this.appointment_date || appointment_time !== this.appointment_time) {
      const conflictQuery = `
        SELECT COUNT(*) as count FROM appointments 
        WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'Cancelled' AND id != ?
      `;
      const conflictResult = await executeQuery(conflictQuery, [doctor_id, appointment_date, appointment_time, this.id]);
      
      if (conflictResult[0].count > 0) {
        throw new Error('Doctor is not available at this time');
      }
    }

    const query = `
      UPDATE appointments 
      SET patient_id = ?, doctor_id = ?, appointment_date = ?, appointment_time = ?, status = ?, notes = ?
      WHERE id = ?
    `;
    await executeQuery(query, [patient_id, doctor_id, appointment_date, appointment_time, status, notes, this.id]);
    return await Appointment.findById(this.id);
  }

  async delete() {
    const query = 'DELETE FROM appointments WHERE id = ?';
    await executeQuery(query, [this.id]);
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
    const queries = [
      'SELECT COUNT(*) as total FROM appointments',
      'SELECT COUNT(*) as today FROM appointments WHERE DATE(appointment_date) = CURDATE()',
      'SELECT COUNT(*) as completed_today FROM appointments WHERE DATE(appointment_date) = CURDATE() AND status = "Completed"',
      'SELECT status, COUNT(*) as count FROM appointments GROUP BY status'
    ];

    const [totalResult, todayResult, completedTodayResult, statusResult] = await Promise.all(
      queries.map(query => executeQuery(query))
    );

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