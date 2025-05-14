
// Check if API_BASE_URL is already defined to avoid redeclaration errors
if (typeof window.API_BASE_URL === 'undefined') {
  const API_BASE_URL = 'http://127.0.0.1:8000/';
  
  // Assign to window to make it globally available
  window.API_BASE_URL = API_BASE_URL;
}


function buildRequestConfig(method, authToken, data) {
  
  const headers = {
    'Content-Type': 'application/json',
  };

  
  if (authToken) {
    headers['Authorization'] = `Token ${authToken}`;
  }

  
  const config = {
    method: method,
    headers: headers,
  };

  
  if (data) {
    
    if ('contacts' in data) {
      delete data.contacts;
    }

    config.body = JSON.stringify(data);
  }

  return config;
}


function buildRequestUrl(endpoint, authToken, sessionIdentifier) {
  
  const baseUrl = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.replace(/^\/+/, '')}`;

  
  if (!authToken) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}guest_id=${sessionIdentifier}`;
  }

  return baseUrl;
}


async function processApiResponse(response) {
  
  const contentType = response.headers.get('content-type');
  const isJsonResponse =
    contentType && contentType.includes('application/json');

  if (!isJsonResponse) {
    return null;
  }

  
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`❌ API error (${response.status}):`, errorData);
    return errorData;
  }

  
  return await response.json();
}


async function makeApiRequest(endpoint, method = 'GET', data = null) {
  console.log(`Making API request to ${endpoint} with method ${method}`);
  
  const authToken = localStorage.getItem('token');
  const guestId = sessionStorage.getItem('guest_id');
  
  
  const url = buildRequestUrl(endpoint, authToken, guestId);
  console.log('Request URL:', url);
  
  
  const config = buildRequestConfig(method, authToken, data);
  console.log('Request config:', { ...config, headers: { ...config.headers } });
  
  try {
    
    console.log('Sending fetch request...');
    const response = await fetch(url, config);
    console.log('Response status:', response.status);
    
    
    const processedResponse = await processApiResponse(response);
    console.log('Processed response:', processedResponse);
    return processedResponse;
  } catch (error) {
    console.error(`🔥 Network error for ${endpoint}:`, error);
    throw error;
  }
}


async function getApiData(endpoint) {
  return makeApiRequest(endpoint, 'GET');
}


async function postApiData(endpoint, data) {
  return makeApiRequest(endpoint, 'POST', data);
}


async function putApiData(endpoint, data) {
  return makeApiRequest(endpoint, 'PUT', data);
}


async function patchApiData(endpoint, data) {
  return makeApiRequest(endpoint, 'PATCH', data);
}


async function deleteApiData(endpoint) {
  return makeApiRequest(endpoint, 'DELETE');
}
