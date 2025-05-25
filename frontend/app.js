// Modern Hospital Management System - app.js
// Enhanced version with better error handling and UI interactions

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Global state
let patients = [];
let doctors = [];
let appointments = [];
let currentSection = 'dashboard';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Update date/time immediately and then every second
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Initialize default section
    showSection('dashboard');
    
    // Setup form event listeners
    setupFormListeners();
    
    // Setup search functionality
    setupSearchListeners();
    
    // Show welcome message
    setTimeout(() => {
        showNotification('Welcome', 'Unity Healthcare Management System is ready!', 'success');
    }, 1000);
}

// Date/Time Functions
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    const dateTimeElement = document.getElementById('currentDateTime');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleString('en-US', options);
    }
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = now.toLocaleTimeString();
    }
}

// Utility Functions
const showLoading = () => {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
};

const hideLoading = () => {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
};

const showNotification = (title, message, type = 'info') => {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    
    if (!notification || !icon || !titleEl || !messageEl) {
        // Fallback to console if notification elements don't exist
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        return;
    }
    
    // Set content
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Reset classes
    notification.className = 'fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 max-w-sm';
    
    // Set styling based on type
    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
        icon.className = 'fas fa-check-circle text-2xl mr-3';
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
        icon.className = 'fas fa-exclamation-circle text-2xl mr-3';
    } else if (type === 'warning') {
        notification.classList.add('bg-yellow-500', 'text-white');
        icon.className = 'fas fa-exclamation-triangle text-2xl mr-3';
    } else {
        notification.classList.add('bg-blue-500', 'text-white');
        icon.className = 'fas fa-info-circle text-2xl mr-3';
    }
    
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
};

// API Functions
const apiRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Provide user-friendly error messages
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Please check your connection and try again.');
        }
        
        throw error;
    }
};

// Patient API Functions
const patientAPI = {
    getAll: () => apiRequest('/patients'),
    getById: (id) => apiRequest(`/patients/${id}`),
    create: (data) => apiRequest('/patients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/patients/${id}`, { method: 'DELETE' }),
    getStats: () => apiRequest('/patients/stats'),
    search: (query) => apiRequest(`/patients?search=${encodeURIComponent(query)}`)
};

// Doctor API Functions
const doctorAPI = {
    getAll: () => apiRequest('/doctors'),
    getById: (id) => apiRequest(`/doctors/${id}`),
    create: (data) => apiRequest('/doctors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/doctors/${id}`, { method: 'DELETE' }),
    getStats: () => apiRequest('/doctors/stats')
};

// Appointment API Functions
const appointmentAPI = {
    getAll: () => apiRequest('/appointments'),
    getById: (id) => apiRequest(`/appointments/${id}`),
    create: (data) => apiRequest('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/appointments/${id}`, { method: 'DELETE' }),
    getStats: () => apiRequest('/appointments/stats'),
    getToday: () => apiRequest('/appointments/today')
};

// Navigation Functions
function showSection(sectionName) {
    try {
        currentSection = sectionName;
        
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.add('hidden'));
        
        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        } else {
            console.error(`Section ${sectionName} not found`);
            return;
        }
        
        // Update navigation active state
        updateActiveNavigation(sectionName);
        
        // Load data for the selected section
        loadSectionData(sectionName);
        
    } catch (error) {
        console.error('Error showing section:', error);
        showNotification('Error', 'Failed to load section', 'error');
    }
}

function updateActiveNavigation(sectionName) {
    // Remove active state from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-white', 'bg-opacity-20');
    });
    
    // Add active state to current nav item (this is tricky without proper selectors)
    // We'll skip this for now as it requires event handling
}

function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            updateDashboardStats();
            break;
        case 'patients':
            loadPatients();
            break;
        case 'doctors':
            loadDoctors();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'reports':
            // Reports section - placeholder for now
            break;
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        
        // Special handling for appointment modal
        if (modalId === 'appointmentModal') {
            populateAppointmentSelects();
        }
        
        // Focus on first input field
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([type="hidden"]), select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        
        // Reset form
        const form = document.getElementById(modalId.replace('Modal', 'Form'));
        if (form) {
            form.reset();
        }
        
        // Reset modal title
        resetModalTitle(modalId);
    }
}

function resetModalTitle(modalId) {
    const titleElement = document.getElementById(modalId.replace('Modal', 'ModalTitle'));
    if (titleElement) {
        const defaultTitles = {
            'patientModal': 'Add New Patient',
            'doctorModal': 'Add New Doctor',
            'appointmentModal': 'Schedule New Appointment'
        };
        titleElement.textContent = defaultTitles[modalId] || 'Modal';
    }
}

// Patient Functions
async function loadPatients() {
    try {
        showLoading();
        const response = await patientAPI.getAll();
        patients = response.data || [];
        displayPatients(patients);
    } catch (error) {
        console.error('Failed to load patients:', error);
        showNotification('Error', 'Failed to load patients: ' + error.message, 'error');
        // Show empty state
        displayPatients([]);
    } finally {
        hideLoading();
    }
}

function displayPatients(patientsToShow) {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) {
        console.error('Patients table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (patientsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-user-injured text-4xl mb-4 opacity-50"></i>
                    <p class="text-lg">No patients found</p>
                    <p class="text-sm">Add your first patient to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    patientsToShow.forEach(patient => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">#${patient.id || 'N/A'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user text-blue-600"></i>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-gray-900">${patient.name || 'N/A'}</div>
                        <div class="text-sm text-gray-500">${patient.email || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${patient.phone || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">${patient.age || 'N/A'} years</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editPatient(${patient.id})" class="text-blue-600 hover:text-blue-800 mr-4 p-2 rounded-lg hover:bg-blue-50 transition" title="Edit Patient">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deletePatient(${patient.id})" class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition" title="Delete Patient">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function savePatient(patientData) {
    try {
        showLoading();
        
        // Validate required fields
        if (!patientData.name || !patientData.email || !patientData.age) {
            throw new Error('Please fill in all required fields');
        }
        
        if (patientData.id) {
            await patientAPI.update(patientData.id, patientData);
            showNotification('Success', 'Patient updated successfully', 'success');
        } else {
            await patientAPI.create(patientData);
            showNotification('Success', 'Patient created successfully', 'success');
        }
        
        // Refresh data
        await loadPatients();
        await updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to save patient:', error);
        showNotification('Error', 'Failed to save patient: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function editPatient(id) {
    try {
        showLoading();
        const response = await patientAPI.getById(id);
        const patient = response.data;
        
        if (!patient) {
            throw new Error('Patient not found');
        }
        
        // Populate form
        document.getElementById('patientModalTitle').textContent = 'Edit Patient';
        document.getElementById('patientId').value = patient.id || '';
        document.getElementById('patientName').value = patient.name || '';
        document.getElementById('patientAge').value = patient.age || '';
        document.getElementById('patientPhone').value = patient.phone || '';
        document.getElementById('patientEmail').value = patient.email || '';
        document.getElementById('patientAddress').value = patient.address || '';
        
        openModal('patientModal');
        
    } catch (error) {
        console.error('Failed to load patient:', error);
        showNotification('Error', 'Failed to load patient: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deletePatient(id) {
    if (!confirm('Are you sure you want to delete this patient?\n\nThis action cannot be undone and will also delete all associated appointments.')) {
        return;
    }
    
    try {
        showLoading();
        await patientAPI.delete(id);
        showNotification('Success', 'Patient deleted successfully', 'success');
        
        // Refresh data
        await loadPatients();
        await updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to delete patient:', error);
        showNotification('Error', 'Failed to delete patient: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Doctor Functions
async function loadDoctors() {
    try {
        showLoading();
        const response = await doctorAPI.getAll();
        doctors = response.data || [];
        displayDoctors(doctors);
    } catch (error) {
        console.error('Failed to load doctors:', error);
        showNotification('Error', 'Failed to load doctors: ' + error.message, 'error');
        displayDoctors([]);
    } finally {
        hideLoading();
    }
}

function displayDoctors(doctorsToShow) {
    const tbody = document.getElementById('doctorsTableBody');
    if (!tbody) {
        console.error('Doctors table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (doctorsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-user-md text-4xl mb-4 opacity-50"></i>
                    <p class="text-lg">No doctors found</p>
                    <p class="text-sm">Add your first doctor to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    doctorsToShow.forEach(doctor => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">#${doctor.id || 'N/A'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user-md text-green-600"></i>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-gray-900">Dr. ${doctor.name || 'N/A'}</div>
                        <div class="text-sm text-gray-500">${doctor.email || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">${doctor.specialization || 'N/A'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${doctor.phone || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editDoctor(${doctor.id})" class="text-green-600 hover:text-green-800 mr-4 p-2 rounded-lg hover:bg-green-50 transition" title="Edit Doctor">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteDoctor(${doctor.id})" class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition" title="Delete Doctor">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function saveDoctor(doctorData) {
    try {
        showLoading();
        
        // Validate required fields
        if (!doctorData.name || !doctorData.email || !doctorData.specialization) {
            throw new Error('Please fill in all required fields');
        }
        
        if (doctorData.id) {
            await doctorAPI.update(doctorData.id, doctorData);
            showNotification('Success', 'Doctor updated successfully', 'success');
        } else {
            await doctorAPI.create(doctorData);
            showNotification('Success', 'Doctor created successfully', 'success');
        }
        
        // Refresh data
        await loadDoctors();
        await updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to save doctor:', error);
        showNotification('Error', 'Failed to save doctor: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function editDoctor(id) {
    try {
        showLoading();
        const response = await doctorAPI.getById(id);
        const doctor = response.data;
        
        if (!doctor) {
            throw new Error('Doctor not found');
        }
        
        // Populate form
        document.getElementById('doctorModalTitle').textContent = 'Edit Doctor';
        document.getElementById('doctorId').value = doctor.id || '';
        document.getElementById('doctorName').value = doctor.name || '';
        document.getElementById('doctorSpecialization').value = doctor.specialization || '';
        document.getElementById('doctorPhone').value = doctor.phone || '';
        document.getElementById('doctorEmail').value = doctor.email || '';
        
        openModal('doctorModal');
        
    } catch (error) {
        console.error('Failed to load doctor:', error);
        showNotification('Error', 'Failed to load doctor: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteDoctor(id) {
    if (!confirm('Are you sure you want to delete this doctor?\n\nThis action cannot be undone and will also affect all associated appointments.')) {
        return;
    }
    
    try {
        showLoading();
        await doctorAPI.delete(id);
        showNotification('Success', 'Doctor deleted successfully', 'success');
        
        // Refresh data
        await loadDoctors();
        await updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to delete doctor:', error);
        showNotification('Error', 'Failed to delete doctor: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Appointment Functions
async function loadAppointments() {
    try {
        showLoading();
        const response = await appointmentAPI.getAll();
        appointments = response.data || [];
        displayAppointments(appointments);
    } catch (error) {
        console.error('Failed to load appointments:', error);
        showNotification('Error', 'Failed to load appointments: ' + error.message, 'error');
        displayAppointments([]);
    } finally {
        hideLoading();
    }
}

function displayAppointments(appointmentsToShow) {
    const tbody = document.getElementById('appointmentsTableBody');
    if (!tbody) {
        console.error('Appointments table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (appointmentsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-calendar-check text-4xl mb-4 opacity-50"></i>
                    <p class="text-lg">No appointments found</p>
                    <p class="text-sm">Schedule your first appointment to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    appointmentsToShow.forEach(appointment => {
        const statusColors = {
            'Scheduled': 'bg-yellow-100 text-yellow-800',
            'Completed': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800'
        };
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">#${appointment.id || 'N/A'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user text-blue-600 text-sm"></i>
                    </div>
                    <span class="text-sm font-medium text-gray-900">${appointment.patient_name || 'Unknown Patient'}</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user-md text-green-600 text-sm"></i>
                    </div>
                    <span class="text-sm font-medium text-gray-900">${appointment.doctor_name || 'Unknown Doctor'}</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                    <div class="font-medium">${formatDate(appointment.appointment_date)}</div>
                    <div class="text-gray-500">${formatTime(appointment.appointment_time)}</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 text-xs font-semibold rounded-full ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}">
                    ${appointment.status || 'Unknown'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editAppointment(${appointment.id})" class="text-purple-600 hover:text-purple-800 mr-4 p-2 rounded-lg hover:bg-purple-50 transition" title="Edit Appointment">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteAppointment(${appointment.id})" class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition" title="Delete Appointment">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Helper functions for date/time formatting
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    try {
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return timeString;
    }
}

async function saveAppointment(appointmentData) {
    try {
        showLoading();
        
        // Validate required fields
        if (!appointmentData.patient_id || !appointmentData.doctor_id || !appointmentData.appointment_date || !appointmentData.appointment_time) {
            throw new Error('Please fill in all required fields');
        }
        
        if (appointmentData.id) {
            await appointmentAPI.update(appointmentData.id, appointmentData);
            showNotification('Success', 'Appointment updated successfully', 'success');
        } else {
            await appointmentAPI.create(appointmentData);
            showNotification('Success', 'Appointment scheduled successfully', 'success');
        }
        
        // Refresh data
        await loadAppointments();
        await updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to save appointment:', error);
        showNotification('Error', 'Failed to save appointment: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function editAppointment(id) {
    try {
        showLoading();
        const response = await appointmentAPI.getById(id);
        const appointment = response.data;
        
        if (!appointment) {
            throw new Error('Appointment not found');
        }
        
        // Populate form
        document.getElementById('appointmentModalTitle').textContent = 'Edit Appointment';
        document.getElementById('appointmentId').value = appointment.id || '';
        document.getElementById('appointmentPatient').value = appointment.patient_id || '';
        document.getElementById('appointmentDoctor').value = appointment.doctor_id || '';
        document.getElementById('appointmentDate').value = appointment.appointment_date || '';
        document.getElementById('appointmentTime').value = appointment.appointment_time || '';
        document.getElementById('appointmentStatus').value = appointment.status || 'Scheduled';
        
        await populateAppointmentSelects();
        openModal('appointmentModal');
        
    } catch (error) {
        console.error('Failed to load appointment:', error);
        showNotification('Error', 'Failed to load appointment: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?\n\nThis action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading();
        await appointmentAPI.delete(id);
        showNotification('Success', 'Appointment deleted successfully', 'success');
        
        // Refresh data
        await loadAppointments();
        await updateDashboardStats();
        
    } catch (error) {
        console.error('Failed to delete appointment:', error);
        showNotification('Error', 'Failed to delete appointment: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function populateAppointmentSelects() {
    try {
        const [patientsResponse, doctorsResponse] = await Promise.all([
            patientAPI.getAll().catch(() => ({ data: [] })),
            doctorAPI.getAll().catch(() => ({ data: [] }))
        ]);
        
        const patientSelect = document.getElementById('appointmentPatient');
        const doctorSelect = document.getElementById('appointmentDoctor');
        
        if (!patientSelect || !doctorSelect) {
            console.error('Appointment select elements not found');
            return;
        }
        
        // Clear existing options except first one
        patientSelect.innerHTML = '<option value="">Select Patient</option>';
        doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
        
        // Populate patients
        (patientsResponse.data || []).forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.name} (${patient.email})`;
            patientSelect.appendChild(option);
        });
        
        // Populate doctors
        (doctorsResponse.data || []).forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `Dr. ${doctor.name} - ${doctor.specialization}`;
            doctorSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Failed to populate appointment selects:', error);
        showNotification('Warning', 'Failed to load patients and doctors for appointment form', 'warning');
    }
}

// Dashboard Functions
async function updateDashboardStats() {
    try {
        const [patientStats, doctorStats, appointmentStats] = await Promise.all([
            patientAPI.getStats().catch(() => ({ data: { total: 0, averageAge: 0, newThisWeek: 0 } })),
            doctorAPI.getStats().catch(() => ({ data: { total: 0, specializations: 0 } })),
            appointmentAPI.getStats().catch(() => ({ data: { total: 0, today: 0, completedToday: 0, statusDistribution: {} } }))
        ]);
        
        // Update main stats with null checks
        updateElementTextContent('totalPatients', patientStats.data?.total || 0);
        updateElementTextContent('totalDoctors', doctorStats.data?.total || 0);
        updateElementTextContent('totalAppointments', appointmentStats.data?.total || 0);
        updateElementTextContent('specializations', doctorStats.data?.specializations || 0);
        updateElementTextContent('todayAppointments', appointmentStats.data?.today || 0);
        updateElementTextContent('completedToday', appointmentStats.data?.completedToday || 0);
        updateElementTextContent('newPatientsThisWeek', patientStats.data?.newThisWeek || 0);
        
        // Update status distribution
        const statusDist = appointmentStats.data?.statusDistribution || {};
        updateElementTextContent('completedCount', statusDist.Completed || 0);
        updateElementTextContent('scheduledCount', statusDist.Scheduled || 0);
        updateElementTextContent('cancelledCount', statusDist.Cancelled || 0);
        
    } catch (error) {
        console.error('Failed to update dashboard stats:', error);
    }
}

function updateElementTextContent(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Search Functions
async function searchPatients(query) {
    if (!query.trim()) {
        displayPatients(patients);
        return;
    }
    
    try {
        const response = await patientAPI.search(query);
        displayPatients(response.data || []);
    } catch (error) {
        console.error('Search failed:', error);
        showNotification('Error', 'Search failed: ' + error.message, 'error');
    }
}

// Form Setup Functions
function setupFormListeners() {
    // Patient form
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const patientData = {
                id: document.getElementById('patientId').value || undefined,
                name: document.getElementById('patientName').value,
                age: parseInt(document.getElementById('patientAge').value),
                phone: document.getElementById('patientPhone').value,
                email: document.getElementById('patientEmail').value,
                address: document.getElementById('patientAddress').value
            };
            
            savePatient(patientData);
            closeModal('patientModal');
        });
    }

    // Doctor form
    const doctorForm = document.getElementById('doctorForm');
    if (doctorForm) {
        doctorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const doctorData = {
                id: document.getElementById('doctorId').value || undefined,
                name: document.getElementById('doctorName').value,
                specialization: document.getElementById('doctorSpecialization').value,
                phone: document.getElementById('doctorPhone').value,
                email: document.getElementById('doctorEmail').value
            };
            
            saveDoctor(doctorData);
            closeModal('doctorModal');
        });
    }

    // Appointment form
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const appointmentData = {
                id: document.getElementById('appointmentId').value || undefined,
                patient_id: parseInt(document.getElementById('appointmentPatient').value),
                doctor_id: parseInt(document.getElementById('appointmentDoctor').value),
                appointment_date: document.getElementById('appointmentDate').value,
                appointment_time: document.getElementById('appointmentTime').value,
                status: document.getElementById('appointmentStatus').value
            };
            
            saveAppointment(appointmentData);
            closeModal('appointmentModal');
        });
    }
}

function setupSearchListeners() {
    // Patient search functionality
    const patientSearch = document.getElementById('patientSearch');
    if (patientSearch) {
        patientSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                searchPatients(searchTerm);
            }
        });
    }
}

// Handle modal closing with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open modal
        const modals = document.querySelectorAll('.modal:not(.hidden)');
        modals.forEach(modal => {
            const modalId = modal.id;
            closeModal(modalId);
        });
    }
});

// Handle clicking outside modal to close
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// Export functions for global access (since we're not using modules)
window.showSection = showSection;
window.toggleMobileMenu = toggleMobileMenu;
window.openModal = openModal;
window.closeModal = closeModal;
window.editPatient = editPatient;
window.deletePatient = deletePatient;
window.editDoctor = editDoctor;
window.deleteDoctor = deleteDoctor;
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;