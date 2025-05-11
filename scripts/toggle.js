let visibilityController = document.getElementById('toggle_button');
let credentialInput = document.getElementById('loginPassword');
let confirmVisibilityToggle = document.getElementById('toggle_button_confirm');
let registrationSecret = document.getElementById('password');
let registrationSecretVerify = document.getElementById('confirmPassword');
let registrationVisibilityToggle = document.getElementById('toggle_button');


function managePasswordVisibility(inputField, iconElement) {
  if (inputField.type === 'password') {
    showPassword(inputField, iconElement);
  } else {
    hidePassword(inputField, iconElement);
  }
}


function showPassword(inputField, iconElement) {
  inputField.type = 'text';
  updateVisibilityIcon(iconElement, false);
}


function hidePassword(inputField, iconElement) {
  inputField.type = 'password';
  updateVisibilityIcon(iconElement, true);
}


function updateVisibilityIcon(iconElement, isHidden) {
  iconElement.src = isHidden
    ? './img/visibility.png'
    : './img/visibility_off.png';
}


function initializeLoginVisibilityIcon() {
  updateVisibilityIcon(visibilityController, true);
}


function initializeRegistrationVisibilityIcon() {
  updateVisibilityIcon(registrationVisibilityToggle, true);
}


function initializeConfirmationVisibilityIcon() {
  updateVisibilityIcon(confirmVisibilityToggle, true);
}


function toggleLoginPasswordVisibility() {
  managePasswordVisibility(credentialInput, visibilityController);
}


function toggleRegistrationPasswordVisibility() {
  managePasswordVisibility(registrationSecret, registrationVisibilityToggle);
}


function toggleConfirmationPasswordVisibility() {
  managePasswordVisibility(registrationSecretVerify, confirmVisibilityToggle);
}


const changeImage = initializeLoginVisibilityIcon;
const toggle = toggleLoginPasswordVisibility;
const changeImageSignup = initializeRegistrationVisibilityIcon;
const changeImageSignupConfirm = initializeConfirmationVisibilityIcon;
const signupToggle = toggleRegistrationPasswordVisibility;
const signupToggleConfirm = toggleConfirmationPasswordVisibility;
