// server-production.js - Production-ready server with strict security
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import database connection
const { testConnection } = require('./config/database');

// Import routes
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// Security middleware for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for Tailwind
        "https://cdn.tailwindcss.com", 
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: [
        "'self'", 
        ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []), // Only in development
        "https://cdn.tailwindcss.com"
      ],
      fontSrc: [
        "'self'", 
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:"
      ],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: !isDev ? [] : null, // Only in production
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression());

// Rate limiting with different limits for dev/prod
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // Higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints (future use)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Logging middleware
if (isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint (no authentication required)
app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Serve static files with proper caching headers
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: isDev ? 0 : '1d', // Cache for 1 day in production
  etag: true,
  lastModified: true
}));

// API Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// API health check
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.status(200).json({
      status: 'OK',
      message: 'Hospital Management API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Unity Healthcare Management System API',
    version: '1.0.0',
    description: 'RESTful API for hospital management operations',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    authentication: 'Bearer token (future implementation)',
    endpoints: {
      patients: {
        'GET /api/patients': {
          description: 'Get all patients',
          parameters: {
            limit: 'number (default: 50)',
            offset: 'number (default: 0)',
            search: 'string (optional)'
          }
        },
        'GET /api/patients/:id': 'Get patient by ID',
        'POST /api/patients': 'Create new patient',
        'PUT /api/patients/:id': 'Update patient',
        'DELETE /api/patients/:id': 'Delete patient',
        'GET /api/patients/stats': 'Get patient statistics'
      },
      doctors: {
        'GET /api/doctors': 'Get all doctors',
        'GET /api/doctors/:id': 'Get doctor by ID',
        'POST /api/doctors': 'Create new doctor',
        'PUT /api/doctors/:id': 'Update doctor',
        'DELETE /api/doctors/:id': 'Delete doctor',
        'GET /api/doctors/stats': 'Get doctor statistics'
      },
      appointments: {
        'GET /api/appointments': 'Get all appointments',
        'GET /api/appointments/:id': 'Get appointment by ID',
        'POST /api/appointments': 'Create new appointment',
        'PUT /api/appointments/:id': 'Update appointment',
        'DELETE /api/appointments/:id': 'Delete appointment',
        'GET /api/appointments/stats': 'Get appointment statistics',
        'GET /api/appointments/today': 'Get today\'s appointments'
      }
    },
    rateLimits: {
      general: '100 requests per 15 minutes',
      auth: '5 requests per 15 minutes (future)'
    }
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: isDev ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    timestamp: new Date().toISOString(),
    ...(isDev && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    status: 404,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully`);
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    require('./config/database').closePool()
      .then(() => {
        console.log('✅ Database connections closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Error closing database connections:', err);
        process.exit(1);
      });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    const server = app.listen(PORT, () => {
      console.log('🎉 Unity Healthcare Management System Started!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`🏥 Frontend: http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
      console.log(`📚 Docs: http://localhost:${PORT}/api/docs`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: ${isDev ? 'Development' : 'Production'} mode`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    
    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('💡 Check database connection and configuration');
    process.exit(1);
  }
};

// Export for testing
if (require.main === module) {
  startServer();
}

module.exports = app;