const API_BASE_URL = 'http://localhost:5000/api';

export const registerApi = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return await response.json();
  } catch (error) {
    console.error('API register error:', error);
    return { success: false, message: 'Unable to connect to server.' };
  }
};

export const loginApi = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    return await response.json();
  } catch (error) {
    console.error('API login error:', error);
    return { success: false, message: 'Unable to connect to server.' };
  }
};

// Resume API Services
export const createResumeApi = async (resumeData, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ ...resumeData, user_id: userId })
    });
    return await response.json();
  } catch (error) {
    console.error('API createResume error:', error);
    return { success: false, message: 'Unable to save resume. Server error.' };
  }
};

export const getUserResumesApi = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'x-user-id': userId
      }
    });
    return await response.json();
  } catch (error) {
    console.error('API getUserResumes error:', error);
    return { success: false, resumes: [] };
  }
};

export const getSingleResumeApi = async (resumeId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'x-user-id': userId
      }
    });
    return await response.json();
  } catch (error) {
    console.error('API getSingleResume error:', error);
    return { success: false, message: 'Unable to load resume.' };
  }
};

export const updateResumeApi = async (resumeId, resumeData, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ ...resumeData, user_id: userId })
    });
    return await response.json();
  } catch (error) {
    console.error('API updateResume error:', error);
    return { success: false, message: 'Unable to update resume.' };
  }
};

export const deleteResumeApi = async (resumeId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId
      }
    });
    return await response.json();
  } catch (error) {
    console.error('API deleteResume error:', error);
    return { success: false, message: 'Unable to delete resume.' };
  }
};

// PDF Download Trigger
export const downloadResumePdfApi = async (resumeId, userId, studentName = 'Student') => {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}/pdf?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'x-user-id': userId
      }
    });

    if (!response.ok) throw new Error('PDF Generation failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${cleanName}_Resume.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return { success: true };
  } catch (error) {
    console.error('API downloadResumePdf error:', error);
    return { success: false, message: 'Failed to download PDF.' };
  }
};

// Analysis API Services
export const runAnalysisApi = async (resumeId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyse/${resumeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      }
    });
    return await response.json();
  } catch (error) {
    console.error('API runAnalysis error:', error);
    return { success: false, message: 'Unable to run analysis.' };
  }
};

export const getAnalysisHistoryApi = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/history?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'x-user-id': userId
      }
    });
    return await response.json();
  } catch (error) {
    console.error('API getAnalysisHistory error:', error);
    return { success: false, history: [] };
  }
};

export const getSingleAnalysisApi = async (analysisId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'x-user-id': userId
      }
    });
    return await response.json();
  } catch (error) {
    console.error('API getSingleAnalysis error:', error);
    return { success: false, message: 'Unable to fetch analysis.' };
  }
};
