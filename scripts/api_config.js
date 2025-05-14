
// Check if API_CONFIG is already defined to avoid redeclaration errors
if (typeof window.API_CONFIG === 'undefined') {
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
  
  // Assign to window to make it globally available
  window.API_CONFIG = API_CONFIG;
}


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
  
  // Get token from storage
  const token = localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
  const guestId = sessionStorage.getItem(API_CONFIG.GUEST_ID_KEY);
  
  if (token) {
    // Add token to headers for authenticated requests
    headers['Authorization'] = `Token ${token}`;
  }
  
  // Removed X-Request-Time header to avoid CORS issues
  
  return headers;
}


async function apiGet(endpoint, requiresAuth = true) {
  const url = buildApiUrl(endpoint);
  const headers = requiresAuth ? createAuthHeaders() : { 'Content-Type': 'application/json' };
  
  // Add guest_id to URL if available and token is not present
  let finalUrl = url;
  if (!localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY)) {
    const guestId = sessionStorage.getItem(API_CONFIG.GUEST_ID_KEY);
    if (guestId && !finalUrl.includes('guest_id=')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}guest_id=${guestId}`;
    }
  }
  
  try {
    const response = await fetch(finalUrl, {
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
  
  // Add guest_id to URL if available and token is not present
  let finalUrl = url;
  if (!localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY) && !endpoint.includes('login')) {
    const guestId = sessionStorage.getItem(API_CONFIG.GUEST_ID_KEY);
    if (guestId && !finalUrl.includes('guest_id=')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}guest_id=${guestId}`;
    }
  }
  
  try {
    const response = await fetch(finalUrl, {
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
      console.warn("Authentication error detected");
      
      // Check if we've had too many recent auth failures
      const lastFailTime = sessionStorage.getItem('last_auth_fail_time');
      const now = new Date().getTime();
      
      if (!lastFailTime || (now - parseInt(lastFailTime)) > 30000) { // 30 second cooldown
        // Record this failure time
        sessionStorage.setItem('last_auth_fail_time', now.toString());
        sessionStorage.setItem('auth_failed', 'true');
        console.warn("Auth failure cooldown started - clearing token");
        localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
      } else {
        // Still in cooldown period, don't clear token yet
        console.log("Too many auth failures in short period, not clearing token yet");
      }
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