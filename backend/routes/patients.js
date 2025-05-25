// routes/patients.js
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Patient = require('../models/Patient');

const router = express.Router();

// Validation middleware
const validatePatient = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be a valid number between 0 and 150'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Phone must be a valid mobile number'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email must be valid'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters')
];

const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/patients - Get all patients with optional search and pagination
router.get('/', [
  query('search').optional().trim().isLength({ max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
], handleValidationErrors, async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    
    let patients;
    if (search) {
      patients = await Patient.search(search, limit);
    } else {
      patients = await Patient.findAll(limit, offset);
    }

    res.json({
      success: true,
      data: patients,
      count: patients.length,
      pagination: {
        limit,
        offset,
        hasMore: patients.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      error: 'Failed to fetch patients',
      message: error.message
    });
  }
});

// GET /api/patients/stats - Get patient statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Patient.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({
      error: 'Failed to fetch patient statistics',
      message: error.message
    });
  }
});

// GET /api/patients/:id - Get patient by ID
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      error: 'Failed to fetch patient',
      message: error.message
    });
  }
});

// GET /api/patients/:id/appointments - Get patient's appointments
router.get('/:id/appointments', validateId, handleValidationErrors, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    const appointments = await patient.getAppointments();
    
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      error: 'Failed to fetch patient appointments',
      message: error.message
    });
  }
});

// POST /api/patients - Create new patient
router.post('/', validatePatient, handleValidationErrors, async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Patient already exists',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to create patient',
      message: error.message
    });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', [...validateId, ...validatePatient], handleValidationErrors, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    const updatedPatient = await patient.update(req.body);
    
    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Email already exists',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to update patient',
      message: error.message
    });
  }
});

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    await patient.delete();
    
    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      error: 'Failed to delete patient',
      message: error.message
    });
  }
});

module.exports = router;