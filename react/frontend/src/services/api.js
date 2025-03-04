import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create a configured axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors globally
    if (error.response && error.response.status === 401) {
      // Clear invalid tokens
      localStorage.removeItem('authToken');
      
      // You could dispatch an event or use a global state management to handle this
      const authErrorEvent = new CustomEvent('auth-error', { detail: error.response });
      window.dispatchEvent(authErrorEvent);
    }
    return Promise.reject(error);
  }
);

// Authentication service
const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  socialAuth: async (provider, profile) => {
    const response = await api.post('/auth/social', { 
      provider,
      name: profile.name,
      email: profile.email
    });
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, password) => {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
  }
};

// TTS service
const ttsService = {
  generateSpeech: async (text, voice, voiceProfile) => {
    const payload = { text, voice };
    if (voiceProfile) {
      payload.voice_profile = voiceProfile;
    }
    
    const response = await api.post('/tts', payload);
    return response.data;
  },
  
  getVoices: async () => {
    const response = await api.get('/tts/voices');
    return response.data;
  },
  
  uploadVoiceProfile: async (audioFile) => {
    const formData = new FormData();
    formData.append('reference_audio', audioFile);
    
    const response = await api.post('/tts/voice-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  generateLipSync: async (text, audioUrl) => {
    const response = await api.post('/tts/lip-sync', { text, audioUrl });
    return response.data;
  }
};

// WebSocket for real-time speech to text
const createSpeechWebSocket = () => {
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5001/ws/speech';
  let ws = null;
  let reconnectTimer = null;
  const listeners = [];
  
  const connect = () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        listeners.forEach(listener => listener(data));
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected, trying to reconnect...');
      
      // Attempt to reconnect
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };
  
  return {
    connect,
    
    disconnect: () => {
      if (ws) {
        ws.close();
      }
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    },
    
    sendAudio: (audioBlob) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(audioBlob);
        return true;
      }
      return false;
    },
    
    onTranscription: (callback) => {
      listeners.push(callback);
      
      // Return a function to unsubscribe
      return () => {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    }
  };
};

export { api, authService, ttsService, createSpeechWebSocket };
