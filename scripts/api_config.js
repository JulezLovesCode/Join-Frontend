


const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000/',
  ENDPOINTS: {
    TASKS: 'api/tasks/',
    SUBTASKS: 'api/subtasks/',
    CONTACTS: 'api/contacts/',
    AUTH: {
      LOGIN: 'api/auth/login/',
      REGISTER: 'api/auth/registration/',
      LOGOUT: 'api/auth/logout/',
      GUEST_LOGIN: 'api/auth/guest-login/'
    },
    BOARD: 'api/board/',
    SUMMARY: 'api/summary/'
  },
  TOKEN_STORAGE_KEY: 'token',
  USERNAME_STORAGE_KEY: 'userName',
  GUEST_ID_KEY: 'guest_id'
};


function buildApiUrl(endpoint) {
  
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  
  return `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
}


function createAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
  if (token) {
    
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      
      if (tokenData.exp && tokenData.exp < now) {
        console.warn("Token appears to be expired, not using it");
        localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
        return headers;
      }
    } catch (e) {
      
      console.warn("Could not parse token, using it anyway");
    }
    
    headers['Authorization'] = `Token ${token}`;
  }
  
  return headers;
}


async function apiGet(endpoint, requiresAuth = true) {
  const url = buildApiUrl(endpoint);
  const headers = requiresAuth ? createAuthHeaders() : { 'Content-Type': 'application/json' };
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    return handleApiResponse(response);
  } catch (error) {
    console.error(`API GET Error (${endpoint}):`, error);
    throw error;
  }
}


async function apiPost(endpoint, data, requiresAuth = true) {
  const url = buildApiUrl(endpoint);
  const headers = requiresAuth ? createAuthHeaders() : { 'Content-Type': 'application/json' };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    return handleApiResponse(response);
  } catch (error) {
    console.error(`API POST Error (${endpoint}):`, error);
    throw error;
  }
}


async function apiPut(endpoint, data) {
  const url = buildApiUrl(endpoint);
  const headers = createAuthHeaders();
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    
    return handleApiResponse(response);
  } catch (error) {
    console.error(`API PUT Error (${endpoint}):`, error);
    throw error;
  }
}


async function apiPatch(endpoint, data) {
  const url = buildApiUrl(endpoint);
  const headers = createAuthHeaders();
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });
    
    return handleApiResponse(response);
  } catch (error) {
    console.error(`API PATCH Error (${endpoint}):`, error);
    throw error;
  }
}


async function apiDelete(endpoint) {
  const url = buildApiUrl(endpoint);
  const headers = createAuthHeaders();
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    
    
    if (response.status === 204) {
      return { success: true };
    }
    
    return handleApiResponse(response);
  } catch (error) {
    console.error(`API DELETE Error (${endpoint}):`, error);
    throw error;
  }
}


async function handleApiResponse(response) {
  
  if (!response.ok) {
    
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { detail: 'Unable to parse error details' };
    }
    
    
    const error = new Error(`API Error ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.details = errorDetails;
    
    
    if (response.status === 401 || response.status === 403) {
      console.warn("Authentication error detected, clearing token");
      localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
      
      
      sessionStorage.setItem('auth_failed', 'true');
    }
    
    throw error;
  }
  
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  
  return { success: true };
}


function isAuthenticated() {
  return !!localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
}


function getCurrentUsername() {
  return localStorage.getItem(API_CONFIG.USERNAME_STORAGE_KEY) || 
         sessionStorage.getItem(API_CONFIG.USERNAME_STORAGE_KEY) || 
         'Guest';
}


function handleAuthentication(authData) {
  if (authData && authData.token) {
    localStorage.setItem(API_CONFIG.TOKEN_STORAGE_KEY, authData.token);
    
    if (authData.username) {
      localStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, authData.username);
      sessionStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, authData.username);
    }
    
    return true;
  }
  return false;
}


function clearAuthentication() {
  localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
  localStorage.removeItem(API_CONFIG.USERNAME_STORAGE_KEY);
  sessionStorage.removeItem(API_CONFIG.USERNAME_STORAGE_KEY);
}


window.API_CONFIG = API_CONFIG;
window.buildApiUrl = buildApiUrl;
window.createAuthHeaders = createAuthHeaders;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiPatch = apiPatch;
window.apiDelete = apiDelete;
window.handleApiResponse = handleApiResponse;
window.isAuthenticated = isAuthenticated;
window.getCurrentUsername = getCurrentUsername;
window.handleAuthentication = handleAuthentication;
window.clearAuthentication = clearAuthentication;