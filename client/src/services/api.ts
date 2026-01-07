import axios from 'axios';

// In production, use relative URLs. In dev, use env var or localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; role: string; hospitalId?: string }) =>
    api.post('/auth/register', data),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Normalize backend response to frontend format
const normalizePatient = (patient: any) => ({
  ...patient,
  triageLevel: patient.priority, // Map priority -> triageLevel
  recommendedSpecialty: patient.recommended_specialty || 'General',
  specialty: patient.recommended_specialty || 'General', // Add specialty alias
  doctorId: patient.doctor_id,
  patientId: patient.patient_id,
  waitingTime: patient.waiting_time_minutes,
  latestVitals: patient.latest_vitals,
  vitals: patient.latest_vitals ? {
    hr: patient.latest_vitals.heart_rate,
    rr: patient.latest_vitals.respiratory_rate,
    bpSys: patient.latest_vitals.systolic_bp,
    bpDia: patient.latest_vitals.diastolic_bp,
    spo2: patient.latest_vitals.oxygen_saturation,
    temp: patient.latest_vitals.temperature,
    avpu: patient.latest_vitals.consciousness
  } : {},
  symptoms: Array.isArray(patient.symptoms) ? patient.symptoms.map((s: any) => 
    typeof s === 'string' ? s : s.symptom
  ) : [],
  claimedBy: patient.doctor_id ? `Doctor #${patient.doctor_id}` : null
});

export const patientAPI = {
  createPatient: (data: any) =>
    api.post('/patients', data),
  
  getPatients: async (filters?: any) => {
    const response = await api.get('/patients/queue', { params: filters });
    // Normalize the response
    if (response.data) {
      const patients = Array.isArray(response.data) ? response.data : response.data.patients || [];
      return {
        ...response,
        data: {
          patients: patients.map(normalizePatient)
        }
      };
    }
    return response;
  },
  
  getPatient: (id: string) =>
    api.get(`/patients/${id}`),
  
  updatePatient: (id: string, data: any) =>
    api.patch(`/patients/${id}`, data),
  
  triagePatient: (id: string) =>
    api.post(`/patients/${id}/triage`),
  
  assignDoctor: (id: string, doctorId: string) =>
    api.post(`/patients/${id}/assign`, { doctorId }),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/patients/${id}/status`, { status }),

  // Update patient vitals
  updateVitals: (id: string, vitalSigns: any) =>
    api.put(`/patients/${id}/vitals`, { vitalSigns }),
};

export const hospitalAPI = {
  getHospitals: () =>
    api.get('/hospitals'),
  
  getHospital: (id: string) =>
    api.get(`/hospitals/${id}`),
  
  createHospital: (data: any) =>
    api.post('/hospitals', data),
  
  updateCapacity: (id: string, data: any) =>
    api.patch(`/hospitals/${id}/capacity`, data),
  
  getStats: (id: string) =>
    api.get(`/hospitals/${id}/stats`),
  
  updateBeds: (id: string | number, data: { available_beds: number; available_icu_beds: number }) =>
    api.patch(`/hospitals/${id}/capacity`, data),
  
  updateStaff: (id: string, role: string, availableCount: number, totalCount: number) =>
    api.put(`/hospitals/${id}/staff`, { role, availableCount, totalCount }),
  
  checkOverload: (id: string) =>
    api.get(`/hospitals/${id}/overload`),
  
  getAlerts: (id: string) =>
    api.get(`/hospitals/${id}/alerts`),
  
  acknowledgeAlert: (alertId: string) =>
    api.put(`/hospitals/alerts/${alertId}/acknowledge`),
};

export const analyticsAPI = {
  getOverview: (hospitalId?: string) =>
    api.get('/analytics/overview', { params: { hospitalId } }),
  
  getTriageStats: (filters?: any) =>
    api.get('/analytics/triage', { params: filters }),
  
  getWaitTimes: (hospitalId?: string) =>
    api.get('/analytics/wait-times', { params: { hospitalId } }),
  
  getLoadMetrics: (hospitalId?: string) =>
    api.get('/analytics/load', { params: { hospitalId } }),
  
  generateReport: (hospitalId: string, date?: Date) =>
    api.post('/analytics/reports/generate', { hospitalId, date }),
  
  getReports: (hospitalId?: string, startDate?: Date, endDate?: Date) =>
    api.get('/analytics/reports', { params: { hospitalId, startDate, endDate } }),
  
  getGovernmentDashboard: (startDate?: Date, endDate?: Date) =>
    api.get('/analytics/government/dashboard', { params: { startDate, endDate } }),
  
  getCrowdSurge: () =>
    api.get('/analytics/crowd-surge'),
};

export default api;
