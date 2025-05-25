// config/init-db.js - Database initialization and seeding script
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

const initializeDatabase = async () => {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL server...');
    
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'hospital_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created or verified`);
    
    // Switch to the database
    await connection.execute(`USE ${dbName}`);
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    try {
      const schemaSQL = await fs.readFile(schemaPath, 'utf8');
      console.log('📄 Reading database schema...');
      
      // Execute schema
      await connection.execute(schemaSQL);
      console.log('✅ Database schema executed successfully');
      
      // Check if tables are created and have data
      const [patients] = await connection.execute('SELECT COUNT(*) as count FROM patients');
      const [doctors] = await connection.execute('SELECT COUNT(*) as count FROM doctors');
      const [appointments] = await connection.execute('SELECT COUNT(*) as count FROM appointments');
      
      console.log('\n📊 Database Statistics:');
      console.log(`   Patients: ${patients[0].count}`);
      console.log(`   Doctors: ${doctors[0].count}`);
      console.log(`   Appointments: ${appointments[0].count}`);
      
      if (patients[0].count === 0) {
        console.log('\n⚠️  Warning: No sample data found. Consider running the full schema.sql file.');
      }
      
    } catch (schemaError) {
      if (schemaError.code === 'ENOENT') {
        console.log('⚠️  Schema file not found. Creating basic tables...');
        await createBasicTables(connection);
      } else {
        throw schemaError;
      }
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log(`🌐 You can now start the server with: npm start`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check your database credentials in the .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure MySQL server is running');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

const createBasicTables = async (connection) => {
  const basicSchema = `
    -- Create patients table
    CREATE TABLE IF NOT EXISTS patients (
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
    );

    -- Create doctors table
    CREATE TABLE IF NOT EXISTS doctors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      specialization VARCHAR(50) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_specialization (specialization),
      INDEX idx_email (email)
    );

    -- Create appointments table
    CREATE TABLE IF NOT EXISTS appointments (
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
    );
  `;
  
  await connection.execute(basicSchema);
  console.log('✅ Basic tables created successfully');
};

const testConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      ...dbConfig,
      database: process.env.DB_NAME || 'hospital_db'
    });
    
    await connection.execute('SELECT 1');
    await connection.end();
    
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

const dropDatabase = async () => {
  const connection = await mysql.createConnection(dbConfig);
  const dbName = process.env.DB_NAME || 'hospital_db';
  
  const confirmed = process.argv.includes('--confirm');
  if (!confirmed) {
    console.log('⚠️  To drop the database, use: npm run drop-db -- --confirm');
    return;
  }
  
  await connection.execute(`DROP DATABASE IF EXISTS ${dbName}`);
  console.log(`🗑️  Database '${dbName}' dropped successfully`);
  await connection.end();
};

// CLI Commands
const command = process.argv[2];

switch (command) {
  case 'init':
    initializeDatabase();
    break;
  case 'test':
    testConnection();
    break;
  case 'drop':
    dropDatabase();
    break;
  default:
    console.log(`
🏥 Hospital Management System - Database Tools

Available commands:
  npm run init-db     - Initialize database and create tables
  npm run test-db     - Test database connection
  npm run drop-db     - Drop database (use with --confirm)

Examples:
  npm run init-db
  npm run test-db
  npm run drop-db -- --confirm
    `);
}

module.exports = {
  initializeDatabase,
  testConnection,
  dropDatabase
};