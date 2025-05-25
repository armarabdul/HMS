// test-db.js - Simple database connection and query test
require('dotenv').config();
const { testConnection, executeQuery } = require('./config/database');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    await testConnection();
    
    console.log('\n🔍 Testing basic queries...');
    
    // Test simple query without parameters
    const tables = await executeQuery('SHOW TABLES');
    console.log('✅ SHOW TABLES query successful:', tables.length, 'tables found');
    
    // Test query with parameters
    const patientCount = await executeQuery('SELECT COUNT(*) as count FROM patients');
    console.log('✅ Patient count query successful:', patientCount[0].count, 'patients');
    
    const doctorCount = await executeQuery('SELECT COUNT(*) as count FROM doctors');
    console.log('✅ Doctor count query successful:', doctorCount[0].count, 'doctors');
    
    // Test LIMIT query with parameters
    console.log('\n🔍 Testing LIMIT queries...');
    const patients = await executeQuery('SELECT * FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?', [5, 0]);
    console.log('✅ Patient LIMIT query successful:', patients.length, 'patients returned');
    
    const doctors = await executeQuery('SELECT * FROM doctors ORDER BY name LIMIT ? OFFSET ?', [5, 0]);
    console.log('✅ Doctor LIMIT query successful:', doctors.length, 'doctors returned');
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage
    });
  } finally {
    process.exit(0);
  }
}

testDatabase();