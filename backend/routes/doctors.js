// routes/doctors.js - Fixed with proper parameter handling
const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Doctor = require('../models/Doctor');

const router = express.Router();

// Helper function to safely parse integers
const safeParseInt = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
};

const validateDoctor = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('specialization').trim().isLength({ min: 2, max: 50 }).withMessage('Specialization must be between 2 and 50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Phone must be valid'),
  body('email').isEmail().normalizeEmail().withMessage('Email must be valid')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// GET /api/doctors
router.get('/', async (req, res) => {
  try {
    // Safely parse query parameters
    const limit = safeParseInt(req.query.limit, 50);
    const offset = safeParseInt(req.query.offset, 0);
    
    console.log('Fetching doctors with params:', { limit, offset });
    
    const doctors = await Doctor.findAll(limit, offset);
    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors', message: error.message });
  }
});

// GET /api/doctors/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Doctor.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    res.status(500).json({ error: 'Failed to fetch doctor stats', message: error.message });
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    const doctorId = safeParseInt(req.params.id, 0);
    
    if (doctorId <= 0) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Failed to fetch doctor', message: error.message });
  }
});

// POST /api/doctors
router.post('/', validateDoctor, handleValidationErrors, async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: 'Failed to create doctor', message: error.message });
  }
});

// PUT /api/doctors/:id
router.put('/:id', validateDoctor, handleValidationErrors, async (req, res) => {
  try {
    const doctorId = safeParseInt(req.params.id, 0);
    
    if (doctorId <= 0) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    const updatedDoctor = await doctor.update(req.body);
    res.json({ success: true, message: 'Doctor updated successfully', data: updatedDoctor });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Failed to update doctor', message: error.message });
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', async (req, res) => {
  try {
    const doctorId = safeParseInt(req.params.id, 0);
    
    if (doctorId <= 0) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    await doctor.delete();
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Failed to delete doctor', message: error.message });
  }
});

module.exports = router;