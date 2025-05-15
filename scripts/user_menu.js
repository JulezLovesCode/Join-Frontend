/**
 * Toggle the user profile dropdown menu visibility
 * This is exported to the window for direct usage by onclick handlers
 * @param {Event} e - Optional event object
 */
function toggleUserPanel(e) {
  console.log('Toggle user panel called');
  
  // Get the user panel element
  const userPanel = document.getElementById('user-panel');
  
  if (userPanel) {
    // Get current display state
    const isVisible = userPanel.classList.contains('show') || 
                     window.getComputedStyle(userPanel).display !== 'none';
    
    if (isVisible) {
      // Hide the panel
      userPanel.classList.remove('show');
      userPanel.style.display = 'none';
    } else {
      // Show the panel
      userPanel.classList.add('show');
      userPanel.style.display = 'block';
    }
  }
  
  // Prevent event bubbling and default actions if event exists
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  
  return false;
}

/**
 * Initialize user profile functionality
 * This ensures the toggle works on all pages
 */
function initUserProfileMenu() {
  console.log('Initializing user profile menu');
  
  // Make all functions available globally for inline onclick handlers
  window.toggleUserPanel = toggleUserPanel;
  window.terminateUserSession = terminateSession;
  window.terminateSession = terminateSession;
  
  // Set up the user profile click handler
  const userProfile = document.getElementById('user-profile');
  if (userProfile) {
    console.log('Found user profile element');
    
    // Remove inline onclick handler that might conflict
    userProfile.removeAttribute('onclick');
    
    // Remove any existing click handlers to prevent duplicates
    userProfile.removeEventListener('click', toggleUserPanel);
    
    // Add the click handler
    userProfile.addEventListener('click', toggleUserPanel);
    
    // Initialize user avatar
    initUserAvatar();
  } else {
    console.log('User profile element not found');
  }
}

/**
 * Initialize the user avatar with initials and color
 */
function initUserAvatar() {
  const userProfile = document.getElementById('user-profile');
  if (!userProfile) return;
  
  // Get username from storage
  let userName = localStorage.getItem('userName') || 
                 sessionStorage.getItem('userName') || 
                 'Guest';
  
  if (userName === 'undefined') userName = 'Guest';
  
  // Generate initials
  let initials = 'G';
  if (userName && userName !== 'Guest') {
    const nameParts = userName.split(/[\s_.@]+/).filter(part => part.length > 0);
    if (nameParts.length > 1) {
      initials = nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
    } else if (nameParts.length === 1) {
      initials = nameParts[0].charAt(0);
    }
    initials = initials.toUpperCase();
  }
  
  // Set the initials
  userProfile.textContent = initials;
  
  // Generate a consistent color based on the username
  const avatarColors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
    '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701'
  ];
  
  const colorIndex = userName.charCodeAt(0) % avatarColors.length;
  userProfile.style.backgroundColor = avatarColors[colorIndex];
}

/**
 * Close the user panel when clicking outside of it
 */
document.addEventListener('click', function(event) {
  console.log('Document click event');
  
  // Get all possible menu elements
  const userProfile = document.getElementById('user-profile');
  const panels = [
    document.getElementById('user-panel'),
    document.querySelector('.profileDropdown'),
    document.querySelector('.user-content'),
    document.getElementById('profilePanel')
  ].filter(panel => panel !== null);
  
  // Check if click is outside profile and any panels
  const isClickOutside = userProfile && 
                         !userProfile.contains(event.target) && 
                         panels.every(panel => !panel.contains(event.target));
  
  // If clicking outside, close all panels
  if (isClickOutside) {
    console.log('Closing all panels due to outside click');
    panels.forEach(panel => {
      panel.classList.remove('show');
      panel.style.display = 'none';
    });
  }
});

/**
 * Log out the user and redirect to login page
 */
function terminateSession() {
  // Clear authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  sessionStorage.clear();
  
  // Redirect to login page
  window.location.href = 'index.html';
}

/**
 * Function alias for backward compatibility
 */
function terminateUserSession() {
  terminateSession();
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initUserProfileMenu);
// Also try to initialize immediately in case the DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initUserProfileMenu, 100);
}