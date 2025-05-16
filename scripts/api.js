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
    // Handle special case for contacts
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
    return errorData;
  }

  return await response.json();
}

async function makeApiRequest(endpoint, method = 'GET', data = null) {
  const authToken = localStorage.getItem('token');
  const guestId = sessionStorage.getItem('guest_id');
  
  const url = buildRequestUrl(endpoint, authToken, guestId);
  const config = buildRequestConfig(method, authToken, data);
  
  try {
    const response = await fetch(url, config);
    const processedResponse = await processApiResponse(response);
    return processedResponse;
  } catch (error) {
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

// Export functions globally with API prefixes to match expected naming
window.apiGet = async function(endpoint) {
  console.log(`Making API GET request to: ${endpoint}`);
  return getApiData(endpoint);
};

window.apiPost = async function(endpoint, data) {
  console.log(`Making API POST request to: ${endpoint}`, data);
  return postApiData(endpoint, data);
};

window.apiPatch = async function(endpoint, data) {
  console.log(`Making API PATCH request to: ${endpoint}`, data);
  return patchApiData(endpoint, data);
};

window.apiDelete = async function(endpoint) {
  console.log(`Making API DELETE request to: ${endpoint}`);
  return deleteApiData(endpoint);
};

console.log("API functions initialized and exported globally");