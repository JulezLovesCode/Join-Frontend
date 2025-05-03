/**
 * API Configuration Module
 * 
 * Central configuration for all API-related settings and utilities.
 * Use this file for any API interaction to ensure consistency across the application.
 */

// Base configuration
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

/**
 * Builds a complete API URL from the endpoint path
 * @param {string} endpoint - The API endpoint path
 * @returns {string} - The complete URL
 */
function buildApiUrl(endpoint) {
  // If endpoint is already a full URL, return it
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Combine base URL and endpoint
  return `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
}

/**
 * Creates authentication headers with token if available
 * @returns {Object} - The headers object
 */
function createAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
  if (token) {
    // Check if token might be expired (simple check)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // If token has expiration and is expired, don't use it
      if (tokenData.exp && tokenData.exp < now) {
        console.warn("Token appears to be expired, not using it");
        localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
        return headers;
      }
    } catch (e) {
      // If token isn't a JWT or can't be parsed, still try to use it
      console.warn("Could not parse token, using it anyway");
    }
    
    headers['Authorization'] = `Token ${token}`;
  }
  
  return headers;
}

/**
 * GET request to API
 * @param {string} endpoint - The API endpoint
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Promise<Object>} - The response data
 */
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

/**
 * POST request to API
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - The data to send
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Promise<Object>} - The response data
 */
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

/**
 * PUT request to API
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - The data to send
 * @returns {Promise<Object>} - The response data
 */
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

/**
 * PATCH request to API
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - The data to send
 * @returns {Promise<Object>} - The response data
 */
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

/**
 * DELETE request to API
 * @param {string} endpoint - The API endpoint
 * @returns {Promise<Object>} - The response data
 */
async function apiDelete(endpoint) {
  const url = buildApiUrl(endpoint);
  const headers = createAuthHeaders();
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    
    // For DELETE, we often don't expect content back
    if (response.status === 204) {
      return { success: true };
    }
    
    return handleApiResponse(response);
  } catch (error) {
    console.error(`API DELETE Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Handles API response processing
 * @param {Response} response - The fetch response
 * @returns {Promise<Object>} - The processed response data
 * @throws {Error} - If the response is not ok
 */
async function handleApiResponse(response) {
  // First check if the response is ok (status in the 200-299 range)
  if (!response.ok) {
    // Try to get error details from response
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { detail: 'Unable to parse error details' };
    }
    
    // Create an error with status and details
    const error = new Error(`API Error ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.details = errorDetails;
    
    // Special handling for authentication errors
    if (response.status === 401 || response.status === 403) {
      console.warn("Authentication error detected, clearing token");
      localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
      
      // Set a flag to indicate auth failure for this session
      sessionStorage.setItem('auth_failed', 'true');
    }
    
    throw error;
  }
  
  // Check if response has content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  // Return success for non-JSON responses
  return { success: true };
}

/**
 * Checks if user is authenticated by verifying token exists
 * @returns {boolean} - Whether user is authenticated
 */
function isAuthenticated() {
  return !!localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
}

/**
 * Gets the current username
 * @returns {string} - Username or 'Guest'
 */
function getCurrentUsername() {
  return localStorage.getItem(API_CONFIG.USERNAME_STORAGE_KEY) || 
         sessionStorage.getItem(API_CONFIG.USERNAME_STORAGE_KEY) || 
         'Guest';
}

/**
 * Handles authentication by saving token and username
 * @param {Object} authData - Authentication data with token and username
 */
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

/**
 * Clears authentication data for logout
 */
function clearAuthentication() {
  localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
  localStorage.removeItem(API_CONFIG.USERNAME_STORAGE_KEY);
  sessionStorage.removeItem(API_CONFIG.USERNAME_STORAGE_KEY);
}

// Export API functions globally for use in other scripts
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