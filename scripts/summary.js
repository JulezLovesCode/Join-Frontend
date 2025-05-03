// Use the API configuration module for all API requests
//Django Backend URL
workItems = []; // Speichert Tasks aus der API

/**
 * Primary initialization of dashboard elements
 */
async function initializeDashboard() {
  await retrieveUserData(); // Jetzt wird das Benutzerprofil hier geladen!
  await loadWorkItems();
  refreshStatistics();
  populateWelcomeMessage();
  refreshDeadlineInfo();
  setupUserAvatar();
}

/**
 * Retrieves work item data from backend service
 */
async function loadWorkItems() {
  try {
    const result = await apiGet(API_CONFIG.ENDPOINTS.TASKS);
    workItems = result || []; // Store the API data in workItems
  } catch (connectionError) {
    console.error('Error fetching tasks:', connectionError);
    workItems = []; // Initialize with empty array on error
  }
}

/**
 * Updates all statistical counters with fresh data
 */
function refreshStatistics() {
  document.getElementById('toDoCount').innerHTML = calculateByCategory('to-do');
  document.getElementById('doneCount').innerHTML = calculateByCategory('done');
  document.getElementById('inProgressCount').innerHTML =
    calculateByCategory('in-progress');
  document.getElementById('awaitFeedbackCount').innerHTML =
    calculateByCategory('await-feedback');
  document.getElementById('urgentCount').innerHTML = calculateUrgentItemCount();
  document.getElementById('allTasks').innerHTML = calculateTotalItemCount();
}

/**
 * Calculates number of items in specified category
 * @param {string} categoryType - work item category
 * @returns count of items in category
 */
function calculateByCategory(categoryType) {
  return workItems.filter((item) => item.board_category === categoryType)
    .length;
}

/**
 * Determines total count of urgent priority items
 * @returns count of urgent priority items
 */
function calculateUrgentItemCount() {
  return workItems.filter((item) => item.priority === 'urgent').length;
}

/**
 * Returns the total count of all work items
 * @returns total item count
 */
function calculateTotalItemCount() {
  return workItems.length;
}

/**
 * Generates personalized welcome message
 */
function populateWelcomeMessage() {
  let periodOfDay = determineDaytimePeriod();
  let userIdentifier = sessionStorage.getItem('userName');

  if (!userIdentifier || userIdentifier === 'undefined') {
    retrieveUserData();
    userIdentifier = 'Guest';
  }

  let greetingContainer = document.getElementById('greeting-container');
  greetingContainer.innerHTML = `<span class="greet-text">Good ${periodOfDay},</span>
                         <span class="greet-user-name">${userIdentifier}</span>`;
}

/**
 * Retrieves and processes user profile data
 * @returns User profile object or null
 */
async function retrieveUserData() {
  const authToken = localStorage.getItem('token');

  if (!authToken) {
    sessionStorage.setItem('userName', 'Guest');
    return { guest: true };
  }

  try {
    const serverResponse = await fetchUserProfile(authToken);

    if (!serverResponse.ok) {
      throw new Error(`❌ API-Fehler: ${serverResponse.status}`);
    }

    const profileData = await serverResponse.json();

    if (profileData.length > 0) {
      let userData = profileData[0];
      let displayName = processUsername(userData);
      storeUserInformation(userData, displayName);
      displayWelcomeAnimation();
      return userData;
    } else {
      return null;
    }
  } catch (connectionError) {
    return null;
  }
}

/**
 * Makes API request to fetch user profile
 * @param {string} authToken - Authentication token
 * @returns Fetch response object
 */
async function fetchUserProfile(authToken) {
  // Use the wrapped fetch function from api_config.js directly
  return fetch(buildApiUrl('api/auth/profiles/'), {
    method: 'GET',
    headers: {
      Authorization: `Token ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Extracts and formats username from profile data
 * @param {Object} userData - User profile data
 * @returns Formatted display name
 */
function processUsername(userData) {
  let displayName = userData.username || userData.email;
  displayName = displayName.replace(/_/g, ' ');
  displayName = displayName.split(' ')[0];
  return displayName;
}

/**
 * Stores user information in browser storage
 * @param {Object} userData - User profile data
 * @param {string} displayName - Processed username
 */
function storeUserInformation(userData, displayName) {
  localStorage.setItem('userProfile', JSON.stringify(userData));
  sessionStorage.setItem('userName', displayName);
}

window.retrieveUserData = retrieveUserData;

/**
 * Determines appropriate greeting based on time of day
 * @returns Time period string (morning, afternoon, evening, night)
 */
function determineDaytimePeriod() {
  let currentTime = new Date();
  let currentHour = currentTime.getHours();

  if (currentHour >= 5 && currentHour < 12) return 'morning';
  if (currentHour >= 12 && currentHour < 18) return 'afternoon';
  if (currentHour >= 18 && currentHour < 22) return 'evening';
  return 'night';
}

/**
 * Updates the upcoming deadline information
 */
function refreshDeadlineInfo() {
  let deadlineElement = document.getElementById('upcomingDate');
  deadlineElement.innerHTML = findNextUrgentDeadline();
}

/**
 * Finds the closest upcoming urgent deadline
 * @returns Formatted date string or empty string
 */
function findNextUrgentDeadline() {
  let criticalItems = workItems.filter((item) => item.priority === 'urgent');

  if (!criticalItems.length) return '';

  let nearestDate = findNearestDate(criticalItems);
  return formatDeadlineDate(nearestDate);
}

/**
 * Finds the nearest future date from a collection of items
 * @param {Array} items - Collection of work items with due dates
 * @returns Date object or null
 */
function findNearestDate(items) {
  return items.reduce(
    (closest, item) => {
      let targetDate = new Date(item.due_date);
      let timeRemaining = targetDate - new Date();

      if (timeRemaining >= 0 && timeRemaining < closest.timeRemaining) {
        return { date: targetDate, timeRemaining: timeRemaining };
      }
      return closest;
    },
    { date: null, timeRemaining: Infinity }
  ).date;
}

/**
 * Formats a date for display or returns empty string
 * @param {Date} dateObject - Date to format
 * @returns Formatted date string or empty string
 */
function formatDeadlineDate(dateObject) {
  return dateObject
    ? dateObject.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
}

/**
 * Creates and displays welcome animation
 */
function displayWelcomeAnimation() {
  const animationPanel = document.getElementById('animationScreen');
  let timeOfDay = determineDaytimePeriod();
  let userIdentifier = sessionStorage.getItem('userName');

  animationPanel.innerHTML = createWelcomeContent(timeOfDay, userIdentifier);

  animationPanel.classList.remove('d-none');
  animationPanel.classList.add('fadeIn');

  setTimeout(dismissWelcomeAnimation, 1000);
}

/**
 * Creates HTML content for welcome animation
 * @param {string} timeOfDay - Time period string
 * @param {string} userIdentifier - Username
 * @returns HTML string for animation
 */
function createWelcomeContent(timeOfDay, userIdentifier) {
  if (userIdentifier === 'Guest') {
    return `<span class="greet-text">Good ${timeOfDay}</span>`;
  } else {
    return `<div class="greeting-user-animation">
                <span class="greet-text">Good ${timeOfDay},</span>
                <span class="greet-user-name">${userIdentifier}</div></span>`;
  }
}

/**
 * Hides welcome animation with fadeout effect
 */
function dismissWelcomeAnimation() {
  const animationPanel = document.getElementById('animationScreen');
  const dashboardContainer = document.querySelector('.summary-card-container');

  animationPanel.classList.remove('fadeIn');
  animationPanel.classList.add('fadeOut');

  setTimeout(() => {
    animationPanel.classList.add('hidden');
    if (dashboardContainer) dashboardContainer.classList.add('visible');
  }, 1000);
}

/**
 * Configures initial page state based on screen size and previous usage
 */
function configureInitialState() {
  const animationPanel = document.getElementById('animationScreen');
  const dashboardContainer = document.querySelector('.summary-card-container');

  if (isLargeScreen()) {
    skipAnimationForLargeScreen(dashboardContainer);
  } else {
    handleAnimationForSmallScreen(dashboardContainer);
  }
}

/**
 * Checks if current viewport is large screen
 * @returns {boolean} True if viewport width >= 800px
 */
function isLargeScreen() {
  return window.innerWidth >= 800;
}

/**
 * Skips animation for large screens
 * @param {HTMLElement} dashboardContainer - Dashboard container element
 */
function skipAnimationForLargeScreen(dashboardContainer) {
  localStorage.setItem('greetingShown', 'true');
  dashboardContainer.classList.add('visible');
}

/**
 * Handles animation display logic for small screens
 * @param {HTMLElement} dashboardContainer - Dashboard container element
 */
function handleAnimationForSmallScreen(dashboardContainer) {
  if (!localStorage.getItem('greetingShown')) {
    localStorage.setItem('greetingShown', 'true');
    displayWelcomeAnimation();
  } else {
    dashboardContainer.classList.add('visible');
  }
}

/**
 * Initializes page configuration when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', configureInitialState);

/**
 * Sets up user avatar/initials display
 */
function setupUserAvatar() {
  const profileAvatarElement = document.getElementById('profileAvatar');
  if (!profileAvatarElement) return;
  
  // Get user info from storage
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const userName = sessionStorage.getItem('userName') || 
                   localStorage.getItem('userName') || 
                   userProfile.username || 
                   userProfile.email || 'Guest';
  
  // Generate initials from name or email
  let initials = 'G';
  if (userName && userName !== 'Guest') {
    // Split by spaces, dots, underscores or at-signs
    const parts = userName.split(/[\s_.@]+/);
    if (parts.length > 1) {
      // Get first letter of first and last part
      initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      // Just get the first letter if only one part
      initials = parts[0].charAt(0).toUpperCase();
    }
  }
  
  // Apply the initials to the avatar element
  profileAvatarElement.textContent = initials;
  
  // Apply color based on initials (consistent hashing)
  const colorIndex = initials.charCodeAt(0) % 10; // Use first initial to get consistent color
  const bgColors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8', 
    '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701'
  ];
  profileAvatarElement.style.backgroundColor = bgColors[colorIndex];
  
  // Add click listener for profile menu toggle
  profileAvatarElement.addEventListener('click', function() {
    const profilePanel = document.getElementById('profilePanel');
    if (profilePanel) {
      profilePanel.classList.toggle('show');
    }
  });
}

/**
 * Performs complete logout and session cleanup
 */
function terminateUserSession() {
  clearAllUserData();
  resetLoginFields();
  navigateToLogin();
}

/**
 * Removes all user-related data from storage
 */
function clearAllUserData() {
  sessionStorage.clear();

  const keysToRemove = [
    'token',
    'userProfile',
    'userEmail',
    'userName',
    'rememberMe',
    'email',
    'password',
  ];

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Clears any login form fields if present
 */
function resetLoginFields() {
  const emailField = document.getElementById('loginEmail');
  const passwordField = document.getElementById('loginPassword');

  if (emailField) emailField.value = '';
  if (passwordField) passwordField.value = '';
}

/**
 * Redirects to login page
 */
function navigateToLogin() {
  window.location.href = 'index.html';
}
