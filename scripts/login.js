/**
 * Login Module
 * Handles user authentication and session management
 */

window.addEventListener('load', function () {
  initializeLoginSystem();
});

/**
 * Sets up the login system on page load
 */
function initializeLoginSystem() {
  const saveCredentials = localStorage.getItem('saveCredentials');
  const checkboxElement = document.getElementById('checkbox');
  const userIdentifier = document.getElementById('loginEmail');
  const userSecret = document.getElementById('loginPassword');

  // Apply saved credentials if remember me was checked
  if (saveCredentials === 'true') {
    checkboxElement.src = '../assets/images/Rectangle2.png';
    userIdentifier.value = localStorage.getItem('userIdentifier');
    userSecret.value = localStorage.getItem('userSecret');
  } else {
    checkboxElement.src = '../assets/images/Rectangle1.png';
  }

  // Check if already logged in
  if (isAuthenticated()) {
    updateInterfaceForLoggedInUser();
  }

  setupEventHandlers();
}

/**
 * Configures all event handlers for login functionality
 */
function setupEventHandlers() {
  const authForm = document.getElementById('signinForm');
  if (authForm) {
    authForm.addEventListener('submit', processAuthRequest);
  }

  document
    .getElementById('checkbox')
    .addEventListener('click', toggleRememberOption);
  document
    .getElementById('signupButton')
    .addEventListener('click', navigateToRegistration);
  document
    .getElementById('guestLoginButton')
    .addEventListener('click', initiateGuestSession);
}

/**
 * Redirects user to registration page
 */
function navigateToRegistration() {
  window.location.href = 'signup.html';
}

/**
 * Initiates a guest session without authentication
 */
async function initiateGuestSession() {
  try {
    // Try to create a guest session via the API
    const guestResponse = await apiPost(API_CONFIG.ENDPOINTS.AUTH.GUEST_LOGIN, {}, false);
    
    if (guestResponse && guestResponse.token) {
      // If guest login returns a token, use it
      handleAuthentication({
        token: guestResponse.token,
        username: 'Guest'
      });
    } else {
      // If API fails, just set session-only guest
      sessionStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, 'Guest');
    }
    
    // Reset greeting for guest session
    localStorage.removeItem('greetingShown');
    
    // Redirect to summary
    window.location.href = 'summary.html';
  } catch (error) {
    console.warn('Guest login API failed, using local guest session:', error);
    sessionStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, 'Guest');
    localStorage.removeItem('greetingShown');
    window.location.href = 'summary.html';
  }
}

/**
 * Handles the "remember me" checkbox toggle
 */
function toggleRememberOption() {
  const checkboxElement = document.getElementById('checkbox');
  const saveCredentials = localStorage.getItem('saveCredentials');
  const userIdentifier = document.getElementById('loginEmail').value;
  const userSecret = document.getElementById('loginPassword').value;

  if (saveCredentials === 'true') {
    clearSavedCredentials(checkboxElement);
  } else {
    saveUserCredentials(checkboxElement, userIdentifier, userSecret);
  }
}

/**
 * Clears saved credentials when "remember me" is unchecked
 * @param {HTMLElement} checkboxElement - The checkbox element
 */
function clearSavedCredentials(checkboxElement) {
  checkboxElement.src = '../assets/images/Rectangle1.png';
  localStorage.setItem('saveCredentials', 'false');
  localStorage.removeItem('userIdentifier');
  localStorage.removeItem('userSecret');
}

/**
 * Saves user credentials when "remember me" is checked
 * @param {HTMLElement} checkboxElement - The checkbox element
 * @param {string} userIdentifier - The user's email
 * @param {string} userSecret - The user's password
 */
function saveUserCredentials(checkboxElement, userIdentifier, userSecret) {
  checkboxElement.src = '../assets/images/Rectangle2.png';
  localStorage.setItem('saveCredentials', 'true');
  localStorage.setItem('userIdentifier', userIdentifier);
  localStorage.setItem('userSecret', userSecret);
}

/**
 * Updates UI elements for already logged-in users
 */
function updateInterfaceForLoggedInUser() {
  document.getElementById('signinForm').style.display = 'none';

  const registrationButton = document.getElementById('signupButton');
  registrationButton.innerText = 'Logout';
  registrationButton.removeEventListener('click', navigateToRegistration);
  registrationButton.addEventListener('click', terminateUserSession);
}

/**
 * Processes the authentication request
 * @param {Event} event - The form submission event
 */
async function processAuthRequest(event) {
  event.preventDefault();

  const userIdentifier = document.getElementById('loginEmail').value;
  const userSecret = document.getElementById('loginPassword').value;

  try {
    const authResult = await authenticateUser(userIdentifier, userSecret);
    if (authResult.success) {
      completeSuccessfulLogin(userIdentifier, authResult.username);
    } else {
      displayAuthError();
    }
  } catch (error) {
    handleLoginFailure(error);
  }
}

/**
 * Attempts to authenticate user against backend
 * @param {string} userIdentifier - User's email
 * @param {string} userSecret - User's password
 * @returns {Promise<Object>} Authentication result
 */
async function authenticateUser(userIdentifier, userSecret) {
  try {
    const data = {
      email: userIdentifier,
      password: userSecret,
    };
    
    // Use the API config to make the request
    const responseData = await apiPost(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data, false);

    if (responseData && responseData.token) {
      // Use central function to store auth data
      handleAuthentication(responseData);
      return { success: true, username: responseData.username };
    } else {
      console.error('Authentication failed:', responseData);
      return { success: false };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error };
  }
}

/**
 * Displays authentication error message to user
 */
function displayAuthError() {
  document.getElementById('wrongPasswordConteiner').innerHTML =
    'Incorrect email or password. Try again.';
  document.getElementById('pasowrdConteiner').classList.add('login-red');
}

/**
 * Handles login failure
 * @param {Error} error - The error that caused login failure
 */
function handleLoginFailure(error) {
  console.error('Login failed:', error);
  
  // Handle specific error types
  if (error.status === 401) {
    displayAuthError();
  } else if (error.status === 0 || error.name === 'TypeError') {
    // Network error - server might be down
    document.getElementById('wrongPasswordConteiner').innerHTML =
      'Could not connect to server. Please try again later.';
  } else {
    displayAuthError();
  }
}

/**
 * Completes the login process after successful authentication
 * @param {string} userIdentifier - User's email
 * @param {string} displayName - User's username
 */
function completeSuccessfulLogin(userIdentifier, displayName) {
  // Save additional user data if needed
  localStorage.setItem('userEmail', userIdentifier);
  localStorage.removeItem('greetingShown');
  
  // Redirect to summary page
  window.location.href = 'summary.html';
}

/**
 * Terminates the current user session (logout)
 */
async function terminateUserSession() {
  try {
    // Try to call logout API if authenticated
    if (isAuthenticated()) {
      await apiPost(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
    }
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // Always clear local data regardless of API success
    clearAuthentication();
    
    // Clear additional storage items
    sessionStorage.clear();
    localStorage.removeItem('userEmail');
    localStorage.removeItem('greetingShown');
    localStorage.removeItem('saveCredentials');
    localStorage.removeItem('userIdentifier');
    localStorage.removeItem('userSecret');
    
    // Reset form fields
    const formElements = [
      document.getElementById('loginEmail'),
      document.getElementById('loginPassword'),
    ];
    formElements.forEach(element => {
      if (element) element.value = '';
    });
    
    // Redirect to login page
    window.location.href = 'index.html';
  }
}

// Export for use in other modules
window.authenticateUser = authenticateUser;
