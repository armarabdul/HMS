const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Doctor = require('../models/Doctor');

const router = express.Router();

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
    const { limit = 50, offset = 0 } = req.query;
    const doctors = await Doctor.findAll(parseInt(limit), parseInt(offset));
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors', message: error.message });
  }
});

// GET /api/doctors/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Doctor.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor stats', message: error.message });
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor', message: error.message });
  }
});

// POST /api/doctors
router.post('/', validateDoctor, handleValidationErrors, async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create doctor', message: error.message });
  }
});

// PUT /api/doctors/:id
router.put('/:id', validateDoctor, handleValidationErrors, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    const updatedDoctor = await doctor.update(req.body);
    res.json({ success: true, message: 'Doctor updated successfully', data: updatedDoctor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor', message: error.message });
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    await doctor.delete();
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor', message: error.message });
  }
});

module.exports = router;