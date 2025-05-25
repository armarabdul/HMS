// routes/appointments.js - Fixed with proper parameter handling
const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Appointment = require('../models/Appointment');

const router = express.Router();

// Helper function to safely parse integers
const safeParseInt = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
};

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
    // Safely parse query parameters
    const limit = safeParseInt(req.query.limit, 50);
    const offset = safeParseInt(req.query.offset, 0);
    
    console.log('Fetching appointments with params:', { limit, offset });
    
    const appointments = await Appointment.findAll(limit, offset);
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments', message: error.message });
  }
});

// GET /api/appointments/today
router.get('/today', async (req, res) => {
  try {
    const appointments = await Appointment.getTodaysAppointments();
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s appointments', message: error.message });
  }
});

// GET /api/appointments/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Appointment.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ error: 'Failed to fetch appointment stats', message: error.message });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const appointmentId = safeParseInt(req.params.id, 0);
    
    if (appointmentId <= 0) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment', message: error.message });
  }
});

// POST /api/appointments
router.post('/', validateAppointment, handleValidationErrors, async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    res.status(201).json({ success: true, message: 'Appointment created successfully', data: appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error.message.includes('not available')) {
      return res.status(409).json({ error: 'Time conflict', message: error.message });
    }
    res.status(500).json({ error: 'Failed to create appointment', message: error.message });
  }
});

// PUT /api/appointments/:id
router.put('/:id', validateAppointment, handleValidationErrors, async (req, res) => {
  try {
    const appointmentId = safeParseInt(req.params.id, 0);
    
    if (appointmentId <= 0) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const updatedAppointment = await appointment.update(req.body);
    res.json({ success: true, message: 'Appointment updated successfully', data: updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    if (error.message.includes('not available')) {
      return res.status(409).json({ error: 'Time conflict', message: error.message });
    }
    res.status(500).json({ error: 'Failed to update appointment', message: error.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const appointmentId = safeParseInt(req.params.id, 0);
    
    if (appointmentId <= 0) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    await appointment.delete();
    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment', message: error.message });
  }
});

module.exports = router;