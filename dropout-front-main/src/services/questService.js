import api from './api';

const questService = {
  getDailyQuests: async (studentId) => {
    return await api.get('/api/quests/daily', {
      params: { student_id: studentId }
    });
  },

  submitProof: async (questId, studentId, data) => {
    const formData = new FormData();
    formData.append('student_id', studentId);
    
    if (data.submissionText) {
      formData.append('submission_text', data.submissionText);
    }
    
    if (data.file) {
      formData.append('file', data.file);
    }

    return await api.post(`/api/quests/submit/${questId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default questService;
