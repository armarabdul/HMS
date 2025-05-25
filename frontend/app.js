// public/app.js - Frontend JavaScript for Hospital Management System

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Global state
let patients = [];
let doctors = [];
let appointments = [];

// Utility Functions
const showLoading = () => document.getElementById('loadingIndicator').classList.remove('hidden');
const hideLoading = () => document.getElementById('loadingIndicator').classList.add('hidden');

const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  } text-white`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
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
      throw new Error(data.error || data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
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
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.add('hidden'));
  document.getElementById(sectionName).classList.remove('hidden');
  
  // Load data when showing specific sections
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
  }
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenu.classList.toggle('hidden');
}

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
  if (modalId === 'appointmentModal') {
    populateAppointmentSelects();
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  // Reset forms
  const form = document.getElementById(modalId.replace('Modal', 'Form'));
  if (form) form.reset();
  
  // Reset modal titles
  const titleElement = document.getElementById(modalId.replace('Modal', 'ModalTitle'));
  if (titleElement) {
    if (modalId === 'patientModal') titleElement.textContent = 'Add New Patient';
    else if (modalId === 'doctorModal') titleElement.textContent = 'Add New Doctor';
    else if (modalId === 'appointmentModal') titleElement.textContent = 'Schedule New Appointment';
  }
}

// Patient Functions
async function loadPatients() {
  try {
    showLoading();
    const response = await patientAPI.getAll();
    patients = response.data;
    displayPatients(patients);
  } catch (error) {
    showNotification('Failed to load patients: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

function displayPatients(patientsToShow) {
  const tbody = document.getElementById('patientsTableBody');
  tbody.innerHTML = '';
  
  patientsToShow.forEach(patient => {
    const row = `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${patient.id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${patient.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${patient.age}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${patient.phone || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${patient.email}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="editPatient(${patient.id})" class="text-indigo-600 hover:text-indigo-900 mr-3" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deletePatient(${patient.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

async function savePatient(patientData) {
  try {
    showLoading();
    if (patientData.id) {
      await patientAPI.update(patientData.id, patientData);
      showNotification('Patient updated successfully', 'success');
    } else {
      await patientAPI.create(patientData);
      showNotification('Patient created successfully', 'success');
    }
    loadPatients();
    updateDashboardStats();
  } catch (error) {
    showNotification('Failed to save patient: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function editPatient(id) {
  try {
    const response = await patientAPI.getById(id);
    const patient = response.data;
    
    document.getElementById('patientModalTitle').textContent = 'Edit Patient';
    document.getElementById('patientId').value = patient.id;
    document.getElementById('patientName').value = patient.name;
    document.getElementById('patientAge').value = patient.age;
    document.getElementById('patientPhone').value = patient.phone || '';
    document.getElementById('patientEmail').value = patient.email;
    document.getElementById('patientAddress').value = patient.address || '';
    openModal('patientModal');
  } catch (error) {
    showNotification('Failed to load patient: ' + error.message, 'error');
  }
}

async function deletePatient(id) {
  if (!confirm('Are you sure you want to delete this patient?')) return;
  
  try {
    showLoading();
    await patientAPI.delete(id);
    showNotification('Patient deleted successfully', 'success');
    loadPatients();
    updateDashboardStats();
  } catch (error) {
    showNotification('Failed to delete patient: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Doctor Functions
async function loadDoctors() {
  try {
    showLoading();
    const response = await doctorAPI.getAll();
    doctors = response.data;
    displayDoctors(doctors);
  } catch (error) {
    showNotification('Failed to load doctors: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

function displayDoctors(doctorsToShow) {
  const tbody = document.getElementById('doctorsTableBody');
  tbody.innerHTML = '';
  
  doctorsToShow.forEach(doctor => {
    const row = `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${doctor.id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${doctor.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${doctor.specialization}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${doctor.phone || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${doctor.email}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="editDoctor(${doctor.id})" class="text-indigo-600 hover:text-indigo-900 mr-3" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteDoctor(${doctor.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

async function saveDoctor(doctorData) {
  try {
    showLoading();
    if (doctorData.id) {
      await doctorAPI.update(doctorData.id, doctorData);
      showNotification('Doctor updated successfully', 'success');
    } else {
      await doctorAPI.create(doctorData);
      showNotification('Doctor created successfully', 'success');
    }
    loadDoctors();
    updateDashboardStats();
  } catch (error) {
    showNotification('Failed to save doctor: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function editDoctor(id) {
  try {
    const response = await doctorAPI.getById(id);
    const doctor = response.data;
    
    document.getElementById('doctorModalTitle').textContent = 'Edit Doctor';
    document.getElementById('doctorId').value = doctor.id;
    document.getElementById('doctorName').value = doctor.name;
    document.getElementById('doctorSpecialization').value = doctor.specialization;
    document.getElementById('doctorPhone').value = doctor.phone || '';
    document.getElementById('doctorEmail').value = doctor.email;
    openModal('doctorModal');
  } catch (error) {
    showNotification('Failed to load doctor: ' + error.message, 'error');
  }
}

async function deleteDoctor(id) {
  if (!confirm('Are you sure you want to delete this doctor?')) return;
  
  try {
    showLoading();
    await doctorAPI.delete(id);
    showNotification('Doctor deleted successfully', 'success');
    loadDoctors();
    updateDashboardStats();
  } catch (error) {
    showNotification('Failed to delete doctor: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Appointment Functions
async function loadAppointments() {
  try {
    showLoading();
    const response = await appointmentAPI.getAll();
    appointments = response.data;
    displayAppointments(appointments);
  } catch (error) {
    showNotification('Failed to load appointments: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

function displayAppointments(appointmentsToShow) {
  const tbody = document.getElementById('appointmentsTableBody');
  tbody.innerHTML = '';
  
  appointmentsToShow.forEach(appointment => {
    const statusColor = appointment.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                      appointment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800';
    
    const row = `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${appointment.id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${appointment.patient_name || 'Unknown'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${appointment.doctor_name || 'Unknown'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(appointment.appointment_date).toLocaleDateString()}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${appointment.appointment_time}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
            ${appointment.status}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="editAppointment(${appointment.id})" class="text-indigo-600 hover:text-indigo-900 mr-3" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteAppointment(${appointment.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

async function saveAppointment(appointmentData) {
  try {
    showLoading();
    // Convert date format if needed
    if (appointmentData.appointment_date) {
      appointmentData.appointment_date = appointmentData.appointment_date;
    }
    if (appointmentData.appointment_time) {
      appointmentData.appointment_time = appointmentData.appointment_time;
    }
    
    if (appointmentData.id) {
      await appointmentAPI.update(appointmentData.id, appointmentData);
      showNotification('Appointment updated successfully', 'success');
    } else {
      await appointmentAPI.create(appointmentData);
      showNotification('Appointment created successfully', 'success');
    }
    loadAppointments();
    updateDashboardStats();
  } catch (error) {
    showNotification('Failed to save appointment: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function editAppointment(id) {
  try {
    const response = await appointmentAPI.getById(id);
    const appointment = response.data;
    
    document.getElementById('appointmentModalTitle').textContent = 'Edit Appointment';
    document.getElementById('appointmentId').value = appointment.id;
    document.getElementById('appointmentPatient').value = appointment.patient_id;
    document.getElementById('appointmentDoctor').value = appointment.doctor_id;
    document.getElementById('appointmentDate').value = appointment.appointment_date;
    document.getElementById('appointmentTime').value = appointment.appointment_time;
    document.getElementById('appointmentStatus').value = appointment.status;
    
    await populateAppointmentSelects();
    openModal('appointmentModal');
  } catch (error) {
    showNotification('Failed to load appointment: ' + error.message, 'error');
  }
}

async function deleteAppointment(id) {
  if (!confirm('Are you sure you want to delete this appointment?')) return;
  
  try {
    showLoading();
    await appointmentAPI.delete(id);
    showNotification('Appointment deleted successfully', 'success');
    loadAppointments();
    updateDashboardStats();
  } catch (error) {
    showNotification('Failed to delete appointment: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function populateAppointmentSelects() {
  try {
    const [patientsResponse, doctorsResponse] = await Promise.all([
      patientAPI.getAll(),
      doctorAPI.getAll()
    ]);
    
    const patientSelect = document.getElementById('appointmentPatient');
    const doctorSelect = document.getElementById('appointmentDoctor');
    
    // Clear existing options except first one
    patientSelect.innerHTML = '<option value="">Select Patient</option>';
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
    
    // Populate patients
    patientsResponse.data.forEach(patient => {
      patientSelect.innerHTML += `<option value="${patient.id}">${patient.name}</option>`;
    });
    
    // Populate doctors
    doctorsResponse.data.forEach(doctor => {
      doctorSelect.innerHTML += `<option value="${doctor.id}">Dr. ${doctor.name} - ${doctor.specialization}</option>`;
    });
  } catch (error) {
    showNotification('Failed to load patients and doctors: ' + error.message, 'error');
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
    
    // Update last updated time
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
    
    // Update main stats
    document.getElementById('totalPatients').textContent = patientStats.data.total;
    document.getElementById('totalDoctors').textContent = doctorStats.data.total;
    document.getElementById('totalAppointments').textContent = appointmentStats.data.total;
    document.getElementById('specializations').textContent = doctorStats.data.specializations;
    document.getElementById('todayAppointments').textContent = appointmentStats.data.today;
    document.getElementById('completedToday').textContent = appointmentStats.data.completedToday;
    document.getElementById('newPatientsThisWeek').textContent = patientStats.data.newThisWeek;
    
    // Update status distribution
    const statusDist = appointmentStats.data.statusDistribution;
    document.getElementById('completedCount').textContent = statusDist.Completed || 0;
    document.getElementById('scheduledCount').textContent = statusDist.Scheduled || 0;
    document.getElementById('cancelledCount').textContent = statusDist.Cancelled || 0;
    
  } catch (error) {
    console.error('Failed to update dashboard stats:', error);
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
    displayPatients(response.data);
  } catch (error) {
    showNotification('Search failed: ' + error.message, 'error');
  }
}

// Form Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Patient form
  document.getElementById('patientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const patientData = {
      id: document.getElementById('patientId').value || undefined,
      name: formData.get('name') || document.getElementById('patientName').value,
      age: parseInt(formData.get('age') || document.getElementById('patientAge').value),
      phone: formData.get('phone') || document.getElementById('patientPhone').value,
      email: formData.get('email') || document.getElementById('patientEmail').value,
      address: formData.get('address') || document.getElementById('patientAddress').value
    };
    
    savePatient(patientData);
    closeModal('patientModal');
  });

  // Doctor form
  document.getElementById('doctorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const doctorData = {
      id: document.getElementById('doctorId').value || undefined,
      name: formData.get('name') || document.getElementById('doctorName').value,
      specialization: formData.get('specialization') || document.getElementById('doctorSpecialization').value,
      phone: formData.get('phone') || document.getElementById('doctorPhone').value,
      email: formData.get('email') || document.getElementById('doctorEmail').value
    };
    
    saveDoctor(doctorData);
    closeModal('doctorModal');
  });

  // Appointment form
  document.getElementById('appointmentForm').addEventListener('submit', function(e) {
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

  // Search functionality
  document.getElementById('patientSearch').addEventListener('input', function(e) {
    const searchTerm = e.target.value;
    if (searchTerm.length >= 2 || searchTerm.length === 0) {
      searchPatients(searchTerm);
    }
  });

  // Initialize app
  showSection('dashboard');
});