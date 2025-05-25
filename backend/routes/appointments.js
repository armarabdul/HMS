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
}

module.exports = Appointment;

// routes/appointments.js
const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Appointment = require('../models/Appointment');

const router = express.Router();

const validateAppointment = [
  body('patient_id').isInt({ min: 1 }).withMessage('Patient ID must be a positive integer'),
  body('doctor_id').isInt({ min: 1 }).withMessage('Doctor ID must be a positive integer'),
  body('appointment_date').isISO8601().withMessage('Date must be valid (YYYY-MM-DD)'),
  body('appointment_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be valid (HH:MM)'),
  body('status').optional().isIn(['Scheduled', 'Completed', 'Cancelled']).withMessage('Status must be valid'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const appointments = await Appointment.findAll(parseInt(limit), parseInt(offset));
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments', message: error.message });
  }
});

// GET /api/appointments/today
router.get('/today', async (req, res) => {
  try {
    const appointments = await Appointment.getTodaysAppointments();
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s appointments', message: error.message });
  }
});

// GET /api/appointments/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Appointment.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment stats', message: error.message });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment', message: error.message });
  }
});

// POST /api/appointments
router.post('/', validateAppointment, handleValidationErrors, async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    res.status(201).json({ success: true, message: 'Appointment created successfully', data: appointment });
  } catch (error) {
    if (error.message.includes('not available')) {
      return res.status(409).json({ error: 'Time conflict', message: error.message });
    }
    res.status(500).json({ error: 'Failed to create appointment', message: error.message });
  }
});

// PUT /api/appointments/:id
router.put('/:id', validateAppointment, handleValidationErrors, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    const updatedAppointment = await appointment.update(req.body);
    res.json({ success: true, message: 'Appointment updated successfully', data: updatedAppointment });
  } catch (error) {
    if (error.message.includes('not available')) {
      return res.status(409).json({ error: 'Time conflict', message: error.message });
    }
    res.status(500).json({ error: 'Failed to update appointment', message: error.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    await appointment.delete();
    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment', message: error.message });
  }
});

module.exports = router;