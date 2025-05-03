/**
 * Navigation functions for the Join application
 * These functions handle the routing between different pages
 */

/**
 * Navigates to the summary page
 */
function goToSummary() {
  window.location.href = "summary.html";
}

/**
 * Navigates to the add task page
 */
function goToTask() {
  window.location.href = "add_task.html";
}

/**
 * Navigates to the board page
 */
function goToBoard() {
  window.location.href = "board.html";
}

/**
 * Navigates to the contacts page
 */
function goToContacts() {
  window.location.href = "contacts.html";
}

/**
 * Navigates to the help page
 */
function goToHelp() {
  window.location.href = "help.html";
}

/**
 * Navigates to the legal notice page
 */
function goToLegalNotice() {
  window.location.href = "legal_notice.html";
}

/**
 * Navigates to the privacy policy page
 */
function goToPrivacyPolicy() {
  window.location.href = "privacy_policy.html";
}

/**
 * Toggles the visibility of the user dropdown menu
 */
function toggleMenu() {
  const userContent = document.getElementById('user-content');
  
  if (userContent) {
    if (userContent.style.display === 'block') {
      userContent.style.display = 'none';
    } else {
      userContent.style.display = 'block';
    }
  }
}

/**
 * Logs the user out and redirects to the login page
 */
function logOut() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "index.html";
}

/**
 * Function to navigate back to contacts list in mobile view
 */
function mobileBackToContactsList() {
  const contactsLibrary = document.getElementById('contacts-panel');
  const contactDetails = document.querySelector('.contact-details-container');
  
  if (contactsLibrary && contactDetails) {
    contactsLibrary.style.display = 'flex';
    contactDetails.style.display = 'none';
  }
}