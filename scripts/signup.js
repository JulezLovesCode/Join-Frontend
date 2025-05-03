/**
 * Returns to the homepage when back arrow is clicked
 */
function returnToHomepage() {
  window.location.href = 'index.html';
}

/**
 * Sets up event listeners when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', setupRegistrationForm);
document
  .getElementById('backArrow')
  .addEventListener('click', returnToHomepage);

/**
 * Initializes registration form components and handlers
 */
function setupRegistrationForm() {
  const registrationForm = document.getElementById('signupForm');
  const submitButton = document.getElementById('signupButton');
  const termsCheckbox = document.getElementById('acceptPolicy');

  if (registrationForm && submitButton && termsCheckbox) {
    attachFormHandler(registrationForm);
  }
}

/**
 * Attaches form submission handler to the form element
 * @param {HTMLFormElement} formElement - The registration form
 */
function attachFormHandler(formElement) {
  formElement.addEventListener('submit', processRegistrationSubmit);
}

/**
 * Processes registration form submission and validates input
 * @param {Event} evt - Form submission event
 */
async function processRegistrationSubmit(evt) {
  evt.preventDefault();

  const userCredentials = collectFormData();

  if (!validateUserInput(userCredentials)) {
    return;
  }

  try {
    await registerNewAccount(userCredentials);
  } catch (error) {
    handleRegistrationError(error);
  }
}

/**
 * Collects user input from registration form
 * @returns {Object} Object containing user input values
 */
function collectFormData() {
  return {
    fullName: document.getElementById('name').value.trim(),
    emailAddress: document.getElementById('email').value.trim(),
    userPassword: document.getElementById('password').value,
    passwordConfirm: document.getElementById('confirmPassword').value,
  };
}

/**
 * Validates all user input from the registration form
 * @param {Object} userData - User input data
 * @returns {boolean} True if all validation passes, false otherwise
 */
function validateUserInput(userData) {
  if (!checkNameValidity(userData.fullName)) {
    alert('Please enter both your first and last name.');
    return false;
  }

  if (!verifyEmailFormat(userData.emailAddress)) {
    alert('Please enter a valid email address.');
    return false;
  }

  if (userData.userPassword !== userData.passwordConfirm) {
    displayPasswordMismatchError();
    return false;
  }

  return true;
}

/**
 * Validates name format to ensure it has at least first and last name
 * @param {string} fullName - User's full name
 * @returns {boolean} Whether name is valid
 */
function checkNameValidity(fullName) {
  const nameComponents = fullName.split(' ');
  return nameComponents.length >= 2 && nameComponents[0] && nameComponents[1];
}

/**
 * Validates email using regular expression pattern
 * @param {string} emailAddress - User's email address
 * @returns {boolean} Whether email format is valid
 */
function verifyEmailFormat(emailAddress) {
  const emailValidator = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailValidator.test(emailAddress);
}

/**
 * Displays error message for password mismatch
 */
function displayPasswordMismatchError() {
  document.getElementById('wrongPasswordConteiner').innerHTML =
    "Your Passwords don't match. Try again.";
  document.getElementById('confirm-conteiner').classList.add('signup-red');
}

/**
 * Handles registration errors
 * @param {Error} error - The error that occurred
 */
function handleRegistrationError(error) {
  console.error('Registration failed:', error);
}

/**
 * Registers a new user account with the backend
 * @param {Object} userData - User registration data
 */
async function registerNewAccount(userData) {
  const formattedUsername = formatUsername(userData.fullName);
  const requestPayload = prepareRegistrationPayload(
    userData,
    formattedUsername
  );

  try {
    const response = await sendRegistrationRequest(requestPayload);
    const responseData = await response.json();

    if (response.ok) {
      handleSuccessfulRegistration(responseData);
    } else {
      handleRegistrationFailure(responseData);
    }
  } catch (error) {
    console.error('Network error during registration:', error);
    alert(
      'Registration failed due to a network error. Please try again later.'
    );
  }
}

/**
 * Formats username by replacing spaces with underscores
 * @param {string} fullName - User's full name
 * @returns {string} Formatted username
 */
function formatUsername(fullName) {
  return fullName.replace(/ /g, '_');
}

/**
 * Prepares registration payload for API request
 * @param {Object} userData - User input data
 * @param {string} formattedUsername - Formatted username
 * @returns {Object} API request payload
 */
function prepareRegistrationPayload(userData, formattedUsername) {
  return {
    username: formattedUsername,
    email: userData.emailAddress,
    password: userData.userPassword,
    repeated_password: userData.passwordConfirm,
  };
}

/**
 * Sends registration request to backend API
 * @param {Object} payload - Registration request payload
 * @returns {Promise<Response>} Fetch API response
 */
async function sendRegistrationRequest(payload) {
  return fetch('http://127.0.0.1:8000/api/auth/registration/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Handles successful registration response
 * @param {Object} responseData - API response data
 */
function handleSuccessfulRegistration(responseData) {
  if (responseData.token) {
    storeUserSession(responseData);
  }

  showRegistrationSuccess();
}

/**
 * Stores user session data after successful registration
 * @param {Object} responseData - API response data
 */
function storeUserSession(responseData) {
  localStorage.setItem('token', responseData.token);
  localStorage.setItem('userProfile', JSON.stringify(responseData.user || {}));

  const username =
    (responseData.user && responseData.user.username) || responseData.email;
  sessionStorage.setItem('userName', username);
}

/**
 * Handles registration failure
 * @param {Object} responseData - API error response
 */
function handleRegistrationFailure(responseData) {
  console.error('Registration error:', responseData);
  alert('Registration failed: ' + JSON.stringify(responseData));
}

/**
 * Displays success message and redirects to login page
 */
function showRegistrationSuccess() {
  const notificationElement = document.getElementById('successMessage');
  notificationElement.classList.add('show');

  setTimeout(function () {
    notificationElement.classList.remove('show');
    clearUserSessionData();
    returnToHomepage();
  }, 2000);
}

/**
 * Clears user session data
 */
function clearUserSessionData() {
  localStorage.removeItem('token');
  localStorage.removeItem('userProfile');
  sessionStorage.removeItem('userName');
}

/**
 * Toggles acceptance checkbox and updates submit button state
 */
function switchTermsAgreementState() {
  const checkboxImage = document.getElementById('acceptPolicy');
  const submitButton = document.getElementById('signupButton');

  if (checkboxImage.src.includes('Rectangle1.png')) {
    enableTermsAgreement(checkboxImage, submitButton);
  } else {
    disableTermsAgreement(checkboxImage, submitButton);
  }
}

/**
 * Enables terms agreement checkbox and submit button
 * @param {HTMLElement} checkboxImage - Checkbox image element
 * @param {HTMLElement} submitButton - Submit button element
 */
function enableTermsAgreement(checkboxImage, submitButton) {
  checkboxImage.src = 'img/Rectangle2.png';
  submitButton.disabled = false;
}

/**
 * Disables terms agreement checkbox and submit button
 * @param {HTMLElement} checkboxImage - Checkbox image element
 * @param {HTMLElement} submitButton - Submit button element
 */
function disableTermsAgreement(checkboxImage, submitButton) {
  checkboxImage.src = 'img/Rectangle1.png';
  submitButton.disabled = true;
}

// Expose functions to window object for HTML event handlers
window.switchTermsAgreementState = switchTermsAgreementState;
window.registerNewAccount = registerNewAccount;
