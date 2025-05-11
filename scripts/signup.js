
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
  return fetch('http://127.0.0.1:8000/api/auth/registration/', {
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
  }

  showRegistrationSuccess();
}


function storeUserSession(responseData) {
  localStorage.setItem('token', responseData.token);
  localStorage.setItem('userProfile', JSON.stringify(responseData.user || {}));

  const username =
    (responseData.user && responseData.user.username) || responseData.email;
  sessionStorage.setItem('userName', username);
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
    clearUserSessionData();
    returnToHomepage();
  }, 2000);
}


function clearUserSessionData() {
  localStorage.removeItem('token');
  localStorage.removeItem('userProfile');
  sessionStorage.removeItem('userName');
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
