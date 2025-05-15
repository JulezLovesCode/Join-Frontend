function returnToHomepage() {
  window.location.href = 'index.html';
}


document.addEventListener('DOMContentLoaded', setupRegistrationForm);
document
  .getElementById('backArrow')
  .addEventListener('click', returnToHomepage);


function setupRegistrationForm() {
  const registrationForm = document.getElementById('signupForm');
  const submitButton = document.getElementById('signupButton');
  const termsCheckbox = document.getElementById('acceptPolicy');

  if (registrationForm && submitButton && termsCheckbox) {
    attachFormHandler(registrationForm);
  }
}


function attachFormHandler(formElement) {
  formElement.addEventListener('submit', processRegistrationSubmit);
}


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


function collectFormData() {
  return {
    fullName: document.getElementById('name').value.trim(),
    emailAddress: document.getElementById('email').value.trim(),
    userPassword: document.getElementById('password').value,
    passwordConfirm: document.getElementById('confirmPassword').value,
  };
}


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


function checkNameValidity(fullName) {
  const nameComponents = fullName.split(' ');
  return nameComponents.length >= 2 && nameComponents[0] && nameComponents[1];
}


function verifyEmailFormat(emailAddress) {
  const emailValidator = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailValidator.test(emailAddress);
}


function displayPasswordMismatchError() {
  document.getElementById('wrongPasswordConteiner').innerHTML =
    "Your Passwords don't match. Try again.";
  document.getElementById('confirm-conteiner').classList.add('signup-red');
}


function handleRegistrationError(error) {
  // Handle registration errors silently
}


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
    alert(
      'Registration failed due to a network error. Please try again later.'
    );
  }
}


function formatUsername(fullName) {
  return fullName.replace(/ /g, '_');
}


function prepareRegistrationPayload(userData, formattedUsername) {
  return {
    username: formattedUsername,
    email: userData.emailAddress,
    password: userData.userPassword,
    repeated_password: userData.passwordConfirm,
  };
}


async function sendRegistrationRequest(payload) {
  // Use the API_CONFIG constants to ensure consistency
  const url = buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.REGISTER);
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}


function handleSuccessfulRegistration(responseData) {
  // Never store the token after registration, always redirect to login page
  if (responseData.email) {
    sessionStorage.setItem('registered_email', responseData.email);
  }
  
  // Clear any existing token to ensure login is required
  localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);

  showRegistrationSuccess();
}


function storeUserSession(responseData) {
  // Not storing token immediately after registration
  // Only storing username for display in success message
  const username = responseData.username || responseData.email;
  sessionStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, username);
}


function handleRegistrationFailure(responseData) {
  alert('Registration failed: ' + JSON.stringify(responseData));
}


function showRegistrationSuccess() {
  const notificationElement = document.getElementById('successMessage');
  notificationElement.classList.add('show');

  setTimeout(function () {
    notificationElement.classList.remove('show');
    // Redirect to login page instead of summary
    window.location.href = 'index.html';
  }, 2000);
}


function clearUserSessionData() {
  // Clear any authentication data to ensure proper login flow
  localStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
}


function switchTermsAgreementState() {
  const checkboxImage = document.getElementById('acceptPolicy');
  const submitButton = document.getElementById('signupButton');

  if (checkboxImage.src.includes('Rectangle1.png')) {
    enableTermsAgreement(checkboxImage, submitButton);
  } else {
    disableTermsAgreement(checkboxImage, submitButton);
  }
}


function enableTermsAgreement(checkboxImage, submitButton) {
  checkboxImage.src = 'img/Rectangle2.png';
  submitButton.disabled = false;
}


function disableTermsAgreement(checkboxImage, submitButton) {
  checkboxImage.src = 'img/Rectangle1.png';
  submitButton.disabled = true;
}


window.switchTermsAgreementState = switchTermsAgreementState;
window.registerNewAccount = registerNewAccount;