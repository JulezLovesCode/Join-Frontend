/**
 * Toggles the user dropdown menu
 */
function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
  } else {
    dropdown.style.display = 'block';
  }
}

/**
 * Handles document-wide click events to close dropdown when clicking outside
 */
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('user-dropdown');
  const profileAvatar = document.getElementById('profile-avatar');
  
  if (!profileAvatar.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.style.display = 'none';
  }
});

/**
 * Navigation functions
 */
function navigateToDashboard() {
  window.location.href = 'summary.html';
}

function navigateToTaskCreator() {
  window.location.href = 'add_task.html';
}

function navigateToWorkspace() {
  window.location.href = 'board.html';
}

function navigateToNetwork() {
  window.location.href = 'contacts.html';
}

function navigateToSupport() {
  window.location.href = 'help.html';
}

function navigateToLegal() {
  window.location.href = 'legal_notice.html';
}

function navigateToPrivacy() {
  window.location.href = 'privacy_policy.html';
}

function endUserSession() {
  localStorage.removeItem('authToken');
  window.location.href = 'index.html';
}

/**
 * Generates user initials for the profile avatar
 */
function generateInitials() {
  const profileAvatar = document.getElementById('profile-avatar');
  if (profileAvatar) {
    // Get user data from localStorage or use default
    const userData = JSON.parse(localStorage.getItem('userData')) || { initials: 'G' };
    profileAvatar.textContent = userData.initials || 'G';
  }
}
