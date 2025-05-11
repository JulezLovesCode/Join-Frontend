


const ERROR_TYPES = {
  NETWORK: 'network_error',
  AUTH: 'authentication_error',
  VALIDATION: 'validation_error',
  SERVER: 'server_error',
  NOT_FOUND: 'not_found_error',
  UNKNOWN: 'unknown_error'
};


function categorizeError(error) {
  
  if (error.name === 'TypeError' || error.status === 0) {
    return ERROR_TYPES.NETWORK;
  }
  
  
  if (error.status) {
    switch (true) {
      case error.status === 401 || error.status === 403:
        return ERROR_TYPES.AUTH;
      case error.status === 400 || error.status === 422:
        return ERROR_TYPES.VALIDATION;
      case error.status === 404:
        return ERROR_TYPES.NOT_FOUND;
      case error.status >= 500:
        return ERROR_TYPES.SERVER;
      default:
        return ERROR_TYPES.UNKNOWN;
    }
  }
  
  return ERROR_TYPES.UNKNOWN;
}


function getUserFriendlyMessage(errorType, error) {
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return 'Cannot connect to the server. Please check your internet connection and try again.';
    
    case ERROR_TYPES.AUTH:
      return 'Your session has expired or you do not have permission. Please log in again.';
    
    case ERROR_TYPES.VALIDATION:
      
      if (error.details && typeof error.details === 'object') {
        const messages = [];
        for (const key in error.details) {
          if (Array.isArray(error.details[key])) {
            messages.push(`${key}: ${error.details[key].join(', ')}`);
          } else if (typeof error.details[key] === 'string') {
            messages.push(`${key}: ${error.details[key]}`);
          }
        }
        if (messages.length > 0) {
          return `Please check your input: ${messages.join('; ')}`;
        }
      }
      return 'The information you provided is not valid. Please check your input and try again.';
    
    case ERROR_TYPES.NOT_FOUND:
      return 'The requested information could not be found. It may have been deleted or moved.';
    
    case ERROR_TYPES.SERVER:
      return 'Something went wrong on our end. Please try again later.';
    
    case ERROR_TYPES.UNKNOWN:
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}


function handleApiError(error, callback) {
  
  const errorType = categorizeError(error);
  
  
  const message = getUserFriendlyMessage(errorType, error);
  
  
  console.error(`API Error (${errorType}):`, error);
  
  
  const errorInfo = {
    type: errorType,
    message,
    originalError: error,
    timestamp: new Date().toISOString()
  };
  
  
  if (errorType === ERROR_TYPES.AUTH) {
    
    if (typeof clearAuthentication === 'function') {
      clearAuthentication();
    }
  }
  
  
  if (typeof callback === 'function') {
    callback(errorInfo);
  }
  
  return errorInfo;
}


function showErrorNotification(message, duration = 5000) {
  
  let container = document.getElementById('error-notification-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'error-notification-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.left = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.style.backgroundColor = '#FF3D00';
  notification.style.color = 'white';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '8px';
  notification.style.marginTop = '10px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.style.display = 'flex';
  notification.style.justifyContent = 'space-between';
  notification.style.alignItems = 'center';
  notification.style.maxWidth = '400px';
  
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);
  
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '20px';
  closeButton.style.marginLeft = '10px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontWeight = 'bold';
  closeButton.onclick = () => {
    notification.remove();
  };
  notification.appendChild(closeButton);
  
  
  container.appendChild(notification);
  
  
  setTimeout(() => {
    notification.remove();
  }, duration);
  
  return notification;
}


function useFallbackData(errorType, fallbackDataProvider) {
  
  if ([ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER, ERROR_TYPES.NOT_FOUND].includes(errorType) && 
      typeof fallbackDataProvider === 'function') {
    
    const fallbackData = fallbackDataProvider();
    console.log(`Using fallback data due to ${errorType}:`, fallbackData);
    return fallbackData;
  }
  
  return null;
}


window.handleApiError = handleApiError;
window.showErrorNotification = showErrorNotification;
window.useFallbackData = useFallbackData;
window.ERROR_TYPES = ERROR_TYPES;