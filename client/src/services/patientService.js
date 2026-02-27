import api from './api';

// ===== Patient APIs =====
export const getPatients = (params) => api.get('/patients', { params });
export const getPatient = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);
export const uploadPrescription = (id, formData) =>
    api.post(`/patients/${id}/prescription`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
export const sendEmergency = (id, data) => api.post(`/patients/${id}/emergency`, data);

// ===== Medication APIs =====
export const getMedications = (patientId) => api.get(`/medications/${patientId}`);
export const addMedication = (data) => api.post('/medications', data);
export const bulkAddMedications = (data) => api.post('/medications/bulk', data);
export const updateMedication = (id, data) => api.put(`/medications/${id}`, data);
export const deleteMedication = (id) => api.delete(`/medications/${id}`);

// ===== Recovery APIs =====
export const getRecoveryLogs = (patientId, params) => api.get(`/recovery/${patientId}`, { params });
export const addRecoveryLog = (patientId, data) => api.post(`/recovery/${patientId}`, data);

// ===== Alert APIs =====
export const getAlerts = (params) => api.get('/alerts', { params });
export const resolveAlert = (id) => api.put(`/alerts/${id}/resolve`);
export const getAlertStats = () => api.get('/alerts/stats');

// ===== Dashboard APIs =====
export const getDashboardStats = () => api.get('/dashboard/stats');

// ===== Nutrition APIs =====
export const getNutritionSchedule = (patientId) => api.get(`/nutrition/${patientId}`);
export const setNutritionSchedule = (patientId, data) => api.post(`/nutrition/${patientId}`, data);
