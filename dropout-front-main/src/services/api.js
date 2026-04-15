import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? '' : 'http://localhost:8000');

// Log the API URL for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout to 15 seconds
});

// Attach JWT token from Firebase if present
api.interceptors.request.use(
  (config) => {
    // Log request for debugging
    console.log('Making API request to:', config.url);
    
    if (!config.headers.Authorization) {
      const jwtToken = localStorage.getItem('jwt_token');
      if (jwtToken) {
        config.headers.Authorization = `Bearer ${jwtToken}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method
    });
    
    // Handle CORS errors specifically
    if (error.message === 'Network Error') {
      console.error('This appears to be a CORS or network connectivity issue.');
      console.error('Please ensure the backend is running and CORS is properly configured.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Email/Password authentication (legacy - may be removed)
  signup: (userData) => api.post('/api/auth/signup', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  
  // Firebase token would be auto-attached via interceptor
  me: () => api.get('/api/auth/me'),
  getDashboard: () => api.get('/api/auth/dashboard'),
  markFormCompleted: (studentId) => api.post('/api/auth/complete-form', { student_id: studentId }),
  
  // New methods for Firebase authentication
  firebaseAuthLogin: (idToken) => api.post('/api/auth/firebase-auth', {}, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  }),
  googleVerify: (data) => api.post('/api/auth/google-verify', data),
};

// Student API functions
export const studentAPI = {
  getAllStudents: (params = {}) => api.get('/api/students', { params }),
  getStudentById: (id) => api.get(`/api/students/${id}`),
  getMyProfile: () => api.get('/api/students/my-profile'),
  createStudent: (studentData) => api.post('/api/students', studentData),
  updateStudent: (id, studentData) => api.put(`/api/students/${id}`, studentData),
  deleteStudent: (id) => api.delete(`/api/students/${id}`),
  predictDropout: (studentData) => api.post('/api/students/predict', { student_data: studentData }),
  getStudentStats: () => api.get('/api/students/stats/overview'),
  getStudentsByRisk: (riskLevel) => api.get('/api/students', { params: { risk_level: riskLevel } }),
  createIntervention: (studentId, interventionData) => api.post(`/api/students/${studentId}/interventions`, interventionData),
  getStudentInterventions: (studentId) => api.get(`/api/students/${studentId}/interventions`),
  getAllInterventions: () => api.get('/api/students/interventions/all'),
  getDashboard: (studentId) => api.get(`/api/students/dashboard/${studentId}`),
  saveDashboardData: (studentId, dashboardData) => api.post(`/api/students/dashboard/${studentId}/save`, dashboardData),
  getAdvisorReport: (studentId) => api.get(`/api/students/advisor-report/${studentId}`),
  submitQuizResult: (resultData) => api.post('/api/quiz/submit_result', resultData),
  
  // Unified Gamification Endpoints
  getMyUnifiedData: () => api.get('/api/students/user/my-data'),
  logStudy: (hours) => api.post('/api/students/user/log-study', null, { params: { hours } }),
  updateProgress: (data) => api.put('/api/students/user/update-progress', data),
  
  // Report Card AI Analysis
  extractReportCard: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/students/report-card/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  saveReportCard: (data) => api.post('/api/students/report-card/save', data),
};

// ML API functions
export const mlAPI = {
  trainModel: (retrain = false) => api.post('/api/ml/train', null, { params: { retrain } }),
  getModelInfo: () => api.get('/api/ml/model-info'),
  getFeatureImportance: () => api.get('/api/ml/feature-importance'),
};

// Tenth Standard API functions
export const tenthStandardAPI = {
  submitForm: (formData) => api.post('/api/tenth-standard/submit', formData),
  getDashboard: (studentId) => api.get(`/api/tenth-standard/dashboard/${studentId}`),
  getRecommendations: (studentId) => api.get(`/api/tenth-standard/recommendations/${studentId}`),
  getStreak: (studentId) => api.get(`/api/tenth-standard/streak/${studentId}`),
  updateStreak: (studentId, data) => api.post(`/api/tenth-standard/streak/${studentId}`, data),
};

// Quest API
export const questAPI = {
  getDailyQuests: (studentId) => api.get('/api/quests/daily', { params: { student_id: studentId } }),
  startSession: (studentId, questId, duration) => 
    api.post('/api/quests/session/start', { quest_id: questId, expected_duration: duration }, { params: { student_id: studentId } }),
  endSession: (studentId, questId, timeSpent, isCompleted = true) => 
    api.post('/api/quests/session/end', { quest_id: questId, time_spent: timeSpent, is_completed: isCompleted }, { params: { student_id: studentId } }),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;