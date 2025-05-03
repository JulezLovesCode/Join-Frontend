/**
 * Error Handling Module
 * 
 * Provides centralized error handling functionality for the application.
 * Use this module to handle errors consistently across the application.
 */

// Error types
const ERROR_TYPES = {
  NETWORK: 'network_error',
  AUTH: 'authentication_error',
  VALIDATION: 'validation_error',
  SERVER: 'server_error',
  NOT_FOUND: 'not_found_error',
  UNKNOWN: 'unknown_error'
};

/**
 * Determines the type of error based on status code or error object
 * @param {Error|Object} error - The error object
 * @returns {string} - The error type from ERROR_TYPES
 */
function categorizeError(error) {
  // Network errors (offline, CORS, etc.)
  if (error.name === 'TypeError' || error.status === 0) {
    return ERROR_TYPES.NETWORK;
  }
  
  // Handle specific HTTP status codes
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

/**
 * Gets user-friendly error message based on error type and details
 * @param {string} errorType - The type of error from ERROR_TYPES
 * @param {Error|Object} error - The original error object
 * @returns {string} - User-friendly error message
 */
function getUserFriendlyMessage(errorType, error) {
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return 'Cannot connect to the server. Please check your internet connection and try again.';
    
    case ERROR_TYPES.AUTH:
      return 'Your session has expired or you do not have permission. Please log in again.';
    
    case ERROR_TYPES.VALIDATION:
      // Try to extract validation errors if available
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

/**
 * Handles API errors consistently
 * @param {Error|Object} error - The error that occurred
 * @param {Function} [callback] - Optional callback to handle the error
 * @returns {Object} - Error information object
 */
function handleApiError(error, callback) {
  // Determine error type
  const errorType = categorizeError(error);
  
  // Get user-friendly message
  const message = getUserFriendlyMessage(errorType, error);
  
  // Log error to console with details
  console.error(`API Error (${errorType}):`, error);
  
  // Build error information object
  const errorInfo = {
    type: errorType,
    message,
    originalError: error,
    timestamp: new Date().toISOString()
  };
  
  // Special handling for authentication errors
  if (errorType === ERROR_TYPES.AUTH) {
    // Clear authentication if it's an auth error
    if (typeof clearAuthentication === 'function') {
      clearAuthentication();
    }
  }
  
  // Execute callback if provided
  if (typeof callback === 'function') {
    callback(errorInfo);
  }
  
  return errorInfo;
}

/**
 * Shows an error notification to the user
 * @param {string} message - The error message to display
 * @param {number} [duration=5000] - How long to show the notification (ms)
 */
function showErrorNotification(message, duration = 5000) {
  // Look for existing notification container or create one
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
  
  // Create notification element
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
  
  // Add message
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);
  
  // Add close button
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
  
  // Add to container
  container.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    notification.remove();
  }, duration);
  
  return notification;
}

/**
 * Display fallback data when API fails
 * @param {string} errorType - The type of error from ERROR_TYPES
 * @param {Function} fallbackDataProvider - Function that returns fallback data
 * @returns {any} - The fallback data
 */
function useFallbackData(errorType, fallbackDataProvider) {
  // Only use fallback for certain error types
  if ([ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER, ERROR_TYPES.NOT_FOUND].includes(errorType) && 
      typeof fallbackDataProvider === 'function') {
    
    const fallbackData = fallbackDataProvider();
    console.log(`Using fallback data due to ${errorType}:`, fallbackData);
    return fallbackData;
  }
  
  return null;
}

// Export error handling functions for use in other modules
window.handleApiError = handleApiError;
window.showErrorNotification = showErrorNotification;
window.useFallbackData = useFallbackData;
window.ERROR_TYPES = ERROR_TYPES;