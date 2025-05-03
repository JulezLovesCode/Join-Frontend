let visibilityController = document.getElementById('toggle_button');
let credentialInput = document.getElementById('loginPassword');
let confirmVisibilityToggle = document.getElementById('toggle_button_confirm');
let registrationSecret = document.getElementById('password');
let registrationSecretVerify = document.getElementById('confirmPassword');
let registrationVisibilityToggle = document.getElementById('toggle_button');

/**
 * Manages password visibility toggling for any field
 * @param {HTMLElement} inputField - Password input element
 * @param {HTMLElement} iconElement - Visibility toggle icon element
 */
function managePasswordVisibility(inputField, iconElement) {
  if (inputField.type === 'password') {
    showPassword(inputField, iconElement);
  } else {
    hidePassword(inputField, iconElement);
  }
}

/**
 * Shows password text and updates icon
 * @param {HTMLElement} inputField - Password input element
 * @param {HTMLElement} iconElement - Visibility toggle icon element
 */
function showPassword(inputField, iconElement) {
  inputField.type = 'text';
  updateVisibilityIcon(iconElement, false);
}

/**
 * Hides password text and updates icon
 * @param {HTMLElement} inputField - Password input element
 * @param {HTMLElement} iconElement - Visibility toggle icon element
 */
function hidePassword(inputField, iconElement) {
  inputField.type = 'password';
  updateVisibilityIcon(iconElement, true);
}

/**
 * Updates visibility toggle icon based on current state
 * @param {HTMLElement} iconElement - Visibility toggle icon element
 * @param {boolean} isHidden - Whether password is currently hidden
 */
function updateVisibilityIcon(iconElement, isHidden) {
  iconElement.src = isHidden
    ? './img/visibility.png'
    : './img/visibility_off.png';
}

/**
 * Sets default visibility icon for login password field
 */
function initializeLoginVisibilityIcon() {
  updateVisibilityIcon(visibilityController, true);
}

/**
 * Sets default visibility icon for registration password field
 */
function initializeRegistrationVisibilityIcon() {
  updateVisibilityIcon(registrationVisibilityToggle, true);
}

/**
 * Sets default visibility icon for password confirmation field
 */
function initializeConfirmationVisibilityIcon() {
  updateVisibilityIcon(confirmVisibilityToggle, true);
}

/**
 * Toggles visibility for login password field
 */
function toggleLoginPasswordVisibility() {
  managePasswordVisibility(credentialInput, visibilityController);
}

/**
 * Toggles visibility for registration password field
 */
function toggleRegistrationPasswordVisibility() {
  managePasswordVisibility(registrationSecret, registrationVisibilityToggle);
}

/**
 * Toggles visibility for password confirmation field
 */
function toggleConfirmationPasswordVisibility() {
  managePasswordVisibility(registrationSecretVerify, confirmVisibilityToggle);
}

// Map original function names to new implementations for backward compatibility
const changeImage = initializeLoginVisibilityIcon;
const toggle = toggleLoginPasswordVisibility;
const changeImageSignup = initializeRegistrationVisibilityIcon;
const changeImageSignupConfirm = initializeConfirmationVisibilityIcon;
const signupToggle = toggleRegistrationPasswordVisibility;
const signupToggleConfirm = toggleConfirmationPasswordVisibility;
