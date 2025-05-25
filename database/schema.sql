-- Database Schema for Hospital Management System
-- Run this file to create the database and tables with sample data

-- Create database
CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- Drop existing tables (if you want to recreate)
-- DROP TABLE IF EXISTS appointments;
-- DROP TABLE IF EXISTS doctors;
-- DROP TABLE IF EXISTS patients;

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
    
    -- Indexes for better performance
    INDEX idx_email (email),
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
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
    
    -- Indexes for better performance
    INDEX idx_specialization (specialization),
    INDEX idx_email (email),
    INDEX idx_name (name)
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
    
    -- Foreign key constraints
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_datetime (appointment_date, appointment_time),
    
    -- Unique constraint to prevent double-booking
    UNIQUE KEY unique_doctor_datetime (doctor_id, appointment_date, appointment_time)
);

-- Insert sample patients
INSERT INTO patients (name, age, phone, email, address) VALUES
('John Doe', 34, '(555) 123-4567', 'john.doe@email.com', '123 Main Street, Springfield, IL 62701'),
('Jane Smith', 28, '(555) 234-5678', 'jane.smith@email.com', '456 Oak Avenue, Springfield, IL 62702'),
('Robert Johnson', 45, '(555) 345-6789', 'robert.johnson@email.com', '789 Pine Road, Springfield, IL 62703'),
('Emily Davis', 31, '(555) 456-7890', 'emily.davis@email.com', '321 Elm Street, Springfield, IL 62704'),
('Michael Wilson', 52, '(555) 567-8901', 'michael.wilson@email.com', '654 Maple Drive, Springfield, IL 62705'),
('Sarah Brown', 29, '(555) 678-9012', 'sarah.brown@email.com', '987 Cedar Lane, Springfield, IL 62706'),
('David Martinez', 67, '(555) 789-0123', 'david.martinez@email.com', '147 Birch Boulevard, Springfield, IL 62707'),
('Lisa Anderson', 23, '(555) 890-1234', 'lisa.anderson@email.com', '258 Willow Way, Springfield, IL 62708'),
('James Taylor', 41, '(555) 901-2345', 'james.taylor@email.com', '369 Spruce Street, Springfield, IL 62709'),
('Maria Garcia', 38, '(555) 012-3456', 'maria.garcia@email.com', '741 Aspen Avenue, Springfield, IL 62710');

-- Insert sample doctors
INSERT INTO doctors (name, specialization, phone, email) VALUES
('Dr. Amanda Richards', 'Cardiology', '(555) 111-2222', 'a.richards@springfieldhospital.com'),
('Dr. James Chen', 'Pediatrics', '(555) 222-3333', 'j.chen@springfieldhospital.com'),
('Dr. Lisa Martinez', 'Dermatology', '(555) 333-4444', 'l.martinez@springfieldhospital.com'),
('Dr. David Thompson', 'Orthopedics', '(555) 444-5555', 'd.thompson@springfieldhospital.com'),
('Dr. Rachel Green', 'Neurology', '(555) 555-6666', 'r.green@springfieldhospital.com'),
('Dr. Kevin Park', 'Internal Medicine', '(555) 666-7777', 'k.park@springfieldhospital.com'),
('Dr. Maria Santos', 'Pediatrics', '(555) 777-8888', 'm.santos@springfieldhospital.com'),
('Dr. Thomas Lee', 'Cardiology', '(555) 888-9999', 't.lee@springfieldhospital.com'),
('Dr. Jennifer White', 'Psychiatry', '(555) 999-0000', 'j.white@springfieldhospital.com'),
('Dr. Mark Johnson', 'Emergency Medicine', '(555) 000-1111', 'm.johnson@springfieldhospital.com');

-- Insert sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, notes) VALUES
-- Today's appointments
(1, 1, CURDATE(), '09:00:00', 'Scheduled', 'Regular checkup for heart condition'),
(2, 2, CURDATE(), '10:30:00', 'Completed', 'Child vaccination - MMR'),
(3, 3, CURDATE(), '14:00:00', 'Scheduled', 'Skin rash examination'),
(4, 4, CURDATE(), '15:30:00', 'Completed', 'Knee injury follow-up'),
(5, 5, CURDATE(), '16:00:00', 'Cancelled', 'Patient requested reschedule'),

-- Tomorrow's appointments
(6, 6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30:00', 'Scheduled', 'Annual physical examination'),
(7, 7, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 'Scheduled', 'Child wellness visit'),
(8, 8, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:00:00', 'Scheduled', 'Cardiac stress test'),
(9, 9, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:30:00', 'Scheduled', 'Mental health consultation'),
(10, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00:00', 'Scheduled', 'Emergency follow-up'),

-- Yesterday's appointments
(1, 6, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', 'Completed', 'Blood pressure monitoring'),
(3, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '11:30:00', 'Completed', 'EKG test results review'),
(5, 4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '14:00:00', 'Completed', 'Physical therapy evaluation'),
(7, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '15:30:00', 'Completed', 'Growth chart review'),
(9, 5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'Cancelled', 'Weather-related cancellation'),

-- Future appointments (next week)
(2, 3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '09:30:00', 'Scheduled', 'Mole examination'),
(4, 1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:00:00', 'Scheduled', 'Cardiology consultation'),
(6, 5, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '14:00:00', 'Scheduled', 'Neurological assessment'),
(8, 7, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '15:30:00', 'Scheduled', 'Pediatric consultation'),
(10, 6, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '16:30:00', 'Scheduled', 'Follow-up examination');

-- Create views for common queries
CREATE OR REPLACE VIEW patient_appointment_summary AS
SELECT 
    p.id as patient_id,
    p.name as patient_name,
    p.email as patient_email,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN a.status = 'Scheduled' THEN 1 END) as scheduled_appointments,
    COUNT(CASE WHEN a.status = 'Cancelled' THEN 1 END) as cancelled_appointments,
    MAX(a.appointment_date) as last_appointment_date
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
GROUP BY p.id, p.name, p.email;

CREATE OR REPLACE VIEW doctor_appointment_summary AS
SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.specialization,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN a.status = 'Scheduled' THEN 1 END) as scheduled_appointments,
    COUNT(CASE WHEN DATE(a.appointment_date) = CURDATE() THEN 1 END) as todays_appointments
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id
GROUP BY d.id, d.name, d.specialization;

CREATE OR REPLACE VIEW todays_schedule AS
SELECT 
    a.id as appointment_id,
    a.appointment_time,
    a.status,
    p.name as patient_name,
    p.phone as patient_phone,
    d.name as doctor_name,
    d.specialization,
    a.notes
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE DATE(a.appointment_date) = CURDATE()
ORDER BY a.appointment_time;

-- Show summary after creation
SELECT 'Database initialized successfully!' as status;
SELECT COUNT(*) as total_patients FROM patients;
SELECT COUNT(*) as total_doctors FROM doctors;
SELECT COUNT(*) as total_appointments FROM appointments;
SELECT COUNT(*) as todays_appointments FROM appointments WHERE DATE(appointment_date) = CURDATE();