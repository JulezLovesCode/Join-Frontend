
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
  console.error('Registration failed:', error);
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
    console.error('Network error during registration:', error);
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
  if (responseData.token) {
    storeUserSession(responseData);
  } else {
    console.error('No token received from registration');
  }

  showRegistrationSuccess();
}


function storeUserSession(responseData) {
  // Store token in localStorage using the consistent key from API_CONFIG
  localStorage.setItem(API_CONFIG.TOKEN_STORAGE_KEY, responseData.token);
  
  // Store username in both localStorage and sessionStorage for consistency
  const username = responseData.username || responseData.email;
  localStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, username);
  sessionStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, username);
}


function handleRegistrationFailure(responseData) {
  console.error('Registration error:', responseData);
  alert('Registration failed: ' + JSON.stringify(responseData));
}


function showRegistrationSuccess() {
  const notificationElement = document.getElementById('successMessage');
  notificationElement.classList.add('show');

  setTimeout(function () {
    notificationElement.classList.remove('show');
    // Redirect straight to summary page since user is now logged in
    window.location.href = 'summary.html';
  }, 2000);
}


function clearUserSessionData() {
  // This function is no longer needed as we want to keep the user logged in
  // after registration. Don't clear auth data here.
  return;
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
