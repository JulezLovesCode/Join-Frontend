/**
 * API Base URL Configuration
 */
const API_BASE_URL = 'http://127.0.0.1:8000/';

/**
 * Builds request configuration object with appropriate headers and body
 *
 * @param {string} method - HTTP method
 * @param {string} authToken - Authentication token
 * @param {Object} data - Request payload
 * @returns {Object} Request configuration
 */
function buildRequestConfig(method, authToken, data) {
  // Initialize headers
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add authorization if token is present
  if (authToken) {
    headers['Authorization'] = `Token ${authToken}`;
  }

  // Create request config
  const config = {
    method: method,
    headers: headers,
  };

  // Add request body if data is provided
  if (data) {
    // Clean data of any legacy fields
    if ('contacts' in data) {
      delete data.contacts;
    }

    config.body = JSON.stringify(data);
  }

  return config;
}

/**
 * Builds complete request URL with appropriate query parameters
 *
 * @param {string} endpoint - API endpoint path
 * @param {string} authToken - Authentication token
 * @param {string} sessionIdentifier - Guest session identifier
 * @returns {string} Complete request URL
 */
function buildRequestUrl(endpoint, authToken, sessionIdentifier) {
  // Determine if URL is absolute or relative
  const baseUrl = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.replace(/^\/+/, '')}`;

  // Add guest session identifier if user is not authenticated
  if (!authToken) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}guest_id=${sessionIdentifier}`;
  }

  return baseUrl;
}

/**
 * Processes API response and extracts data or error information
 *
 * @param {Response} response - Fetch API response object
 * @returns {Promise<Object|null>} Parsed response data or null
 */
async function processApiResponse(response) {
  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  const isJsonResponse =
    contentType && contentType.includes('application/json');

  if (!isJsonResponse) {
    return null;
  }

  // Handle error responses
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`❌ API error (${response.status}):`, errorData);
    return errorData;
  }

  // Parse and return successful response
  return await response.json();
}

/**
 * Performs API request with proper configuration
 * 
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} data - Request data
 * @returns {Promise<Object>} Response data
 */
async function makeApiRequest(endpoint, method = 'GET', data = null) {
  console.log(`Making API request to ${endpoint} with method ${method}`);
  
  const authToken = localStorage.getItem('token');
  const guestId = sessionStorage.getItem('guest_id');
  
  // Build request URL with guest ID if not authenticated
  const url = buildRequestUrl(endpoint, authToken, guestId);
  console.log('Request URL:', url);
  
  // Build request configuration
  const config = buildRequestConfig(method, authToken, data);
  console.log('Request config:', { ...config, headers: { ...config.headers } });
  
  try {
    // Send request
    console.log('Sending fetch request...');
    const response = await fetch(url, config);
    console.log('Response status:', response.status);
    
    // Process response
    const processedResponse = await processApiResponse(response);
    console.log('Processed response:', processedResponse);
    return processedResponse;
  } catch (error) {
    console.error(`🔥 Network error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * GET request convenience method
 * 
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>} Response data
 */
async function getApiData(endpoint) {
  return makeApiRequest(endpoint, 'GET');
}

/**
 * POST request convenience method
 * 
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @returns {Promise<Object>} Response data
 */
async function postApiData(endpoint, data) {
  return makeApiRequest(endpoint, 'POST', data);
}

/**
 * PUT request convenience method
 * 
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @returns {Promise<Object>} Response data
 */
async function putApiData(endpoint, data) {
  return makeApiRequest(endpoint, 'PUT', data);
}

/**
 * PATCH request convenience method
 * 
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @returns {Promise<Object>} Response data
 */
async function patchApiData(endpoint, data) {
  return makeApiRequest(endpoint, 'PATCH', data);
}

/**
 * DELETE request convenience method
 * 
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>} Response data
 */
async function deleteApiData(endpoint) {
  return makeApiRequest(endpoint, 'DELETE');
}
