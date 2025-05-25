// config/database.js - Final fix using query() instead of execute()
const mysql = require('mysql2');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_db',
  port: process.env.DB_PORT || 3306,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000,
  multipleStatements: true,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    await connection.ping();
    console.log('✅ Database connected successfully');
    console.log(`📊 Connected to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check your database credentials (username/password)');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure MySQL server is running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Database does not exist. Run: npm run init-db');
    }
    
    throw error;
  }
};

// Sanitize and validate parameters
const sanitizeParams = (params) => {
  if (!Array.isArray(params)) {
    return [];
  }
  
  return params.map(param => {
    // Handle numeric parameters
    if (typeof param === 'string' && !isNaN(param) && param !== '') {
      const num = parseInt(param, 10);
      return isNaN(num) ? 0 : num;
    }
    
    // Handle undefined/null
    if (param === undefined || param === null) {
      return null;
    }
    
    // Handle NaN
    if (typeof param === 'number' && isNaN(param)) {
      return 0;
    }
    
    return param;
  });
};

// Execute query using .query() method instead of .execute() to avoid prepared statement issues
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await promisePool.getConnection();
    
    // Sanitize parameters
    const sanitizedParams = sanitizeParams(params);
    
    console.log('Executing query:', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      originalParams: params,
      sanitizedParams: sanitizedParams
    });
    
    // Use .query() method for all queries to avoid prepared statement issues
    let results;
    
    if (sanitizedParams.length === 0) {
      // No parameters - use simple query
      [results] = await connection.query(query);
    } else {
      // With parameters - use parameterized query
      [results] = await connection.query(query, sanitizedParams);
    }
    
    console.log(`✅ Query executed successfully, returned ${Array.isArray(results) ? results.length : 1} rows`);
    return results;
    
  } catch (error) {
    console.error('Database query error:', {
      query: query.substring(0, 200),
      originalParams: params,
      sanitizedParams: sanitizeParams(params),
      error: error.message,
      code: error.code
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Execute transaction with rollback support
const executeTransaction = async (queries) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const sanitizedParams = sanitizeParams(params || []);
      let result;
      
      if (sanitizedParams.length === 0) {
        [result] = await connection.query(query);
      } else {
        [result] = await connection.query(query, sanitizedParams);
      }
      
      results.push(result);
    }
    
    await connection.commit();
    console.log(`✅ Transaction completed successfully (${queries.length} queries)`);
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('❌ Transaction rolled back due to error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Check if database exists
const checkDatabase = async () => {
  try {
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    const tempPool = mysql.createPool(tempConfig);
    const tempPromisePool = tempPool.promise();
    
    const [databases] = await tempPromisePool.query(
      'SHOW DATABASES LIKE ?', 
      [dbConfig.database]
    );
    
    await tempPool.end();
    return databases.length > 0;
  } catch (error) {
    console.error('Error checking database existence:', error.message);
    return false;
  }
};

// Create database if it doesn't exist
const createDatabase = async () => {
  try {
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    const tempPool = mysql.createPool(tempConfig);
    const tempPromisePool = tempPool.promise();
    
    await tempPromisePool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`✅ Database '${dbConfig.database}' created or verified`);
    
    await tempPool.end();
    return true;
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    throw error;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const dbExists = await checkDatabase();
    if (!dbExists) {
      await createDatabase();
    }
    
    // Basic table creation queries
    const createQueries = [
      `CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        age INT NOT NULL CHECK (age >= 0 AND age <= 150),
        phone VARCHAR(20),
        email VARCHAR(100) UNIQUE NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_name (name)
      )`,
      
      `CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        specialization VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_specialization (specialization),
        INDEX idx_email (email)
      )`,
      
      `CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        INDEX idx_appointment_date (appointment_date),
        INDEX idx_patient_id (patient_id),
        INDEX idx_doctor_id (doctor_id),
        UNIQUE KEY unique_doctor_datetime (doctor_id, appointment_date, appointment_time)
      )`
    ];
    
    // Execute each query separately
    for (const query of createQueries) {
      await executeQuery(query);
    }
    
    console.log('✅ Database tables initialized successfully');
    
    // Verify tables exist
    const tables = await executeQuery('SHOW TABLES');
    console.log(`📋 Tables found: ${tables.map(t => Object.values(t)[0]).join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database tables:', error.message);
    throw error;
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
  pool,
  promisePool,
  testConnection,
  executeQuery,
  executeTransaction,
  initializeDatabase,
  checkDatabase,
  createDatabase,
  closePool
};