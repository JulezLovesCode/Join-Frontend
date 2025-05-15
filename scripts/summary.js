const BOARD_CATEGORIES = {
  TODO: "to-do",
  IN_PROGRESS: "in-progress",
  AWAIT_FEEDBACK: "await-feedback",
  DONE: "done"
};

let tasks = [];
const REFRESH_INTERVAL = 10000; // 10 seconds

async function initializeDashboard() {
  // Setup user info
  setupUserInfo();
  
  // Initialize count elements to zero
  const countElements = ['toDoCount', 'inProgressCount', 'awaitFeedbackCount', 'doneCount', 'urgentCount', 'allTasks'];
  countElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = '0';
  });
  
  // Try loading data with retries
  let loadSuccess = false;
  const maxRetries = 3;
  
  for (let i = 0; i < maxRetries && !loadSuccess; i++) {
    try {
      await loadTasks(); // This now loads from summary API and updates counts directly
      loadSuccess = true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // Update deadline info based on tasks
  updateDeadlineInfo();
  
  // Set up regular refresh with error handling
  let consecutiveErrors = 0;
  const refreshInterval = setInterval(async () => {
    try {
      await refreshDashboard();
      consecutiveErrors = 0; // Reset error counter on success
    } catch (error) {
      consecutiveErrors++;
      
      // If we've had too many consecutive errors, slow down the refresh rate
      if (consecutiveErrors > 3) {
        clearInterval(refreshInterval);
        
        // Try again after 2 minutes
        setTimeout(() => {
          consecutiveErrors = 0;
          setInterval(refreshDashboard, REFRESH_INTERVAL);
        }, 120000); // 2 minutes
      }
    }
  }, REFRESH_INTERVAL);
}

async function refreshDashboard() {
  // Check if we are authenticated before attempting to refresh
  if (!isAuthenticated()) {
    // If not authenticated and on summary page, redirect to login after a delay
    if (window.location.pathname.includes('summary')) {
      const authFailed = sessionStorage.getItem('auth_failed');
      if (authFailed === 'true') {
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
        return;
      }
    }
    return;
  }
  
  // loadTasks now directly updates count elements from the summary API
  await loadTasks();
  // Still update deadline info as needed
  updateDeadlineInfo();
}

async function loadTasks() {
  // Check if we are authenticated
  if (!isAuthenticated()) {
    return;
  }
  
  try {
    // Always fetch fresh data for summary page
    // Reset any throttling to ensure we get the latest data
    sessionStorage.removeItem('last_summary_api_call');
    const now = new Date().getTime();
    
    // Force a direct API call to get the most current data
    
    // Update the last call time
    sessionStorage.setItem('last_summary_api_call', now.toString());
    
    // Fetch summary data directly from the summary API endpoint with cache-busting
    const cacheBuster = `?_=${now}`;
    const summaryData = await apiGet(`api/summary/${cacheBuster}`);
    
    if (summaryData && typeof summaryData === 'object') {
      // Update the summary data
      const todoCount = summaryData["to-do"] || 0;
      const inProgressCount = summaryData["in-progress"] || 0;
      const awaitFeedbackCount = summaryData["await-feedback"] || 0;
      const doneCount = summaryData["done"] || 0;
      const urgentCount = summaryData["urgent"] || 0;
      const totalCount = summaryData["total-tasks"] || 0;
      
      // Update count elements directly
      updateCountElement('toDoCount', todoCount);
      updateCountElement('inProgressCount', inProgressCount);
      updateCountElement('awaitFeedbackCount', awaitFeedbackCount);
      updateCountElement('doneCount', doneCount);
      updateCountElement('urgentCount', urgentCount);
      updateCountElement('allTasks', totalCount);
      
      // Always fetch tasks for other functionality to ensure we have the latest data
      try {
        const tasksResponse = await apiGet(`api/tasks/${cacheBuster}`);
        if (tasksResponse && Array.isArray(tasksResponse)) {
          tasks = tasksResponse;
        } else {
          tasks = [];
        }
      } catch (taskError) {
        // Don't throw here to keep the summary data we already loaded
      }
      
      return;
    } else {
      // Fallback to old method if summary endpoint fails
      await fetchTasksAndUpdateCounts();
    }
  } catch (error) {
    // Don't attempt fallback if we're having authentication issues
    if (error.status !== 401 && error.status !== 403) {
      // Fallback to old method if summary endpoint fails
      await fetchTasksAndUpdateCounts();
    }
    
    if (typeof showErrorNotification === 'function') {
      showErrorNotification("Could not load summary data from the server. Please try again later.");
    }
    
    // Re-throw to allow proper error handling in the caller
    throw error;
  }
}

// Fallback method to fetch tasks and calculate counts
async function fetchTasksAndUpdateCounts() {
  try {
    const response = await apiGet('api/tasks/');
    
    if (response && Array.isArray(response)) {
      tasks = response;
      updateAllCounts(); // Calculate and update counts from tasks
    } else {
      tasks = [];
      // Reset all counts to zero
      const countElements = ['toDoCount', 'inProgressCount', 'awaitFeedbackCount', 'doneCount', 'urgentCount', 'allTasks'];
      countElements.forEach(id => updateCountElement(id, 0));
    }
  } catch (error) {
    tasks = [];
    // Reset all counts to zero
    const countElements = ['toDoCount', 'inProgressCount', 'awaitFeedbackCount', 'doneCount', 'urgentCount', 'allTasks'];
    countElements.forEach(id => updateCountElement(id, 0));
  }
}

function updateAllCounts() {
  const todoCount = getTaskCountByCategory(BOARD_CATEGORIES.TODO);
  const inProgressCount = getTaskCountByCategory(BOARD_CATEGORIES.IN_PROGRESS);
  const awaitFeedbackCount = getTaskCountByCategory(BOARD_CATEGORIES.AWAIT_FEEDBACK);
  const doneCount = getTaskCountByCategory(BOARD_CATEGORIES.DONE);
  const urgentCount = getTaskCountByPriority("urgent");
  const totalCount = tasks.length;
  
  const todoElement = document.getElementById('toDoCount');
  const inProgressElement = document.getElementById('inProgressCount');
  const awaitFeedbackElement = document.getElementById('awaitFeedbackCount');
  const doneElement = document.getElementById('doneCount');
  const urgentElement = document.getElementById('urgentCount');
  const totalElement = document.getElementById('allTasks');
  
  if (todoElement) {
    todoElement.textContent = todoCount;
  }
  
  if (inProgressElement) {
    inProgressElement.textContent = inProgressCount;
  }
  
  if (awaitFeedbackElement) {
    awaitFeedbackElement.textContent = awaitFeedbackCount;
  }
  
  if (doneElement) {
    doneElement.textContent = doneCount;
  }
  
  if (urgentElement) {
    urgentElement.textContent = urgentCount;
  }
  
  if (totalElement) {
    totalElement.textContent = totalCount;
  }
}

function updateCountElement(elementId, count) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = count;
  }
}

function getTaskCountByCategory(category) {
  if (!tasks || !Array.isArray(tasks)) {
    return 0;
  }
  
  if (!category) {
    return 0;
  }
  
  const categoryLower = category.toLowerCase();
  
  const count = tasks.filter(task => {
    if (!task) return false;
    
    const boardCategory = task.board_category || task.boardCategory || task.category || "";
    const taskCategory = typeof boardCategory === 'string' ? boardCategory.toLowerCase() : "";
    
    if (categoryLower === 'to-do' || categoryLower === 'todo') {
      return taskCategory === 'to-do' || taskCategory === 'todo';
    }
    
    if (categoryLower === 'in-progress' || categoryLower === 'in_progress' || categoryLower === 'inprogress') {
      return taskCategory === 'in-progress' || taskCategory === 'in_progress' || taskCategory === 'inprogress';
    }
    
    if (categoryLower === 'await-feedback' || categoryLower === 'await_feedback' || categoryLower === 'awaitfeedback') {
      return taskCategory === 'await-feedback' || taskCategory === 'await_feedback' || taskCategory === 'awaitfeedback';
    }
    
    return taskCategory === categoryLower;
  }).length;
  
  return count;
}

function getTaskCountByPriority(priority) {
  if (!tasks || !Array.isArray(tasks)) {
    return 0;
  }
  
  if (!priority) {
    return 0;
  }
  
  const priorityLower = priority.toLowerCase();
  
  return tasks.filter(task => {
    if (!task) return false;
    
    const taskPriority = task.priority || task.urgency || task.importance || "";
    const priorityValue = typeof taskPriority === 'string' ? taskPriority.toLowerCase() : "";
    
    return priorityValue === priorityLower;
  }).length;
}

function setupUserInfo() {
  // Priority order: fetch from token data, localStorage, sessionStorage, or fallback to 'Guest'
  let userName = 'Guest';
  
  // Get stored username first to have something to display immediately
  const storedName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
  if (storedName && storedName !== 'undefined') {
    userName = storedName;
    // Update UI with stored name
    updateGreetingName(userName);
  }
  
  // Try to get the username directly from login data
  const userFullName = localStorage.getItem('userFullName');
  if (userFullName && userFullName !== 'undefined') {
    userName = userFullName;
    updateGreetingName(userName);
    setupUserAvatar(userName);
    return; // Use the full name if available
  }
  
  // Setup avatar with current name (will be updated if API call succeeds)
  setupUserAvatar(userName);
  
  // Try to get the authenticated user's name from server
  const token = localStorage.getItem('token');
  if (token && typeof apiGet === 'function') {
    // First try the profiles endpoint
    tryFetchProfiles();
    
    // Then also try a direct user endpoint as fallback
    setTimeout(() => {
      if (userName === 'Guest') {
        tryFetchUserData();
      }
    }, 1000);
  }
  
  // Try to fetch profile data
  function tryFetchProfiles() {
    apiGet('api/auth/profiles/')
      .then(data => {
        if (data && data.length > 0) {
          let apiUserName = null;
          
          // Try to get from user object first
          if (data[0].user) {
            apiUserName = data[0].user.username || 
                         (data[0].user.first_name && data[0].user.last_name ? 
                          `${data[0].user.first_name} ${data[0].user.last_name}` : null) ||
                         (data[0].user.email ? data[0].user.email.split('@')[0] : null);
          }
          
          // If not found, try direct properties
          if (!apiUserName) {
            apiUserName = data[0].username || 
                         (data[0].first_name && data[0].last_name ? 
                          `${data[0].first_name} ${data[0].last_name}` : null) ||
                         (data[0].email ? data[0].email.split('@')[0] : null);
          }
          
          if (apiUserName && apiUserName !== 'undefined') {
            userName = apiUserName;
            // Store for future use
            localStorage.setItem('userName', userName);
            localStorage.setItem('userFullName', userName);
            sessionStorage.setItem('userName', userName);
            // Update UI with correct name
            updateGreetingName(userName);
            // Update avatar with correct name
            setupUserAvatar(userName);
          }
        }
      })
      .catch(error => {
        console.log("Error fetching user profiles: ", error);
      });
  }
  
  // Try to fetch user data directly
  function tryFetchUserData() {
    apiGet('api/auth/user/')
      .then(data => {
        if (data) {
          let apiUserName = null;
          
          // Try to get full name first
          if (data.first_name && data.last_name) {
            apiUserName = `${data.first_name} ${data.last_name}`;
          } else if (data.username) {
            apiUserName = data.username;
          } else if (data.email) {
            apiUserName = data.email.split('@')[0];
          }
          
          if (apiUserName && apiUserName !== 'undefined') {
            userName = apiUserName;
            // Store for future use
            localStorage.setItem('userName', userName);
            localStorage.setItem('userFullName', userName);
            sessionStorage.setItem('userName', userName);
            // Update UI with correct name
            updateGreetingName(userName);
            // Update avatar with correct name
            setupUserAvatar(userName);
          }
        }
      })
      .catch(error => {
        console.log("Error fetching user data: ", error);
      });
  }
}

function updateGreetingName(userName) {
  // Get the most suitable user name for display
  // First try the full name, then username, then default to "Guest"
  let displayName = localStorage.getItem('userFullName') || 
                   sessionStorage.getItem('userFullName') || 
                   userName || 
                   'Guest';
  
  // Don't display "undefined" as a name
  if (displayName === 'undefined') {
    displayName = 'Guest';
  }
  
  // Get current hour to determine greeting
  const hour = new Date().getHours();
  let greeting = 'Good ';
  
  if (hour >= 5 && hour < 12) {
    greeting += 'morning';
  } else if (hour >= 12 && hour < 18) {
    greeting += 'afternoon';
  } else if (hour >= 18 && hour < 22) {
    greeting += 'evening';
  } else {
    greeting += 'night';
  }
  
  // Update greeting in the DOM
  const greetingContainer = document.getElementById('greeting-container');
  const userGreeting = document.getElementById('userGreeting');
  
  if (greetingContainer) {
    greetingContainer.innerHTML = `
      <span class="greet-text">${greeting},</span>
      <span class="greet-user-name" id="userGreeting">${displayName}</span>
    `;
  } else if (userGreeting) {
    // If container can't be found but the greeting span exists, update just that
    userGreeting.textContent = displayName;
  }
  
  console.log('Greeting updated with name:', displayName);
}

function setupUserAvatar(userName) {
  // Use the updated ID from user_menu.js
  const avatarElement = document.getElementById('user-profile');
  if (!avatarElement) return;
  
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
  
  avatarElement.textContent = initials;
  
  const avatarColors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
    '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701'
  ];
  
  const colorIndex = userName.charCodeAt(0) % avatarColors.length;
  avatarElement.style.backgroundColor = avatarColors[colorIndex];
}
}

function updateDeadlineInfo() {
  const upcomingDateElement = document.getElementById('upcomingDate');
  if (!upcomingDateElement) return;
  
  const urgentTasks = tasks.filter(task => 
    task.priority && task.priority.toLowerCase() === 'urgent' && task.due_date
  );
  
  if (urgentTasks.length === 0) {
    upcomingDateElement.textContent = '';
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let closestTask = null;
  let closestDiff = Infinity;
  
  urgentTasks.forEach(task => {
    if (!task.due_date) return;
    
    let dueDate;
    try {
      dueDate = new Date(task.due_date);
      
      if (isNaN(dueDate.getTime())) {
        const parts = task.due_date.split(/[-/]/);
        if (parts.length === 3) {
          dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    } catch (e) {
      return;
    }
    
    if (isNaN(dueDate.getTime())) {
      return;
    }
    
    const diff = dueDate.getTime() - today.getTime();
    
    if (diff >= 0 && diff < closestDiff) {
      closestTask = task;
      closestDiff = diff;
    }
  });
  
  if (closestTask && closestTask.due_date) {
    const dueDate = new Date(closestTask.due_date);
    
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    upcomingDateElement.textContent = formattedDate;
  } else {
    upcomingDateElement.textContent = '';
  }
}

function configureInitialState() {
  const animationScreen = document.getElementById('animationScreen');
  const contentContainer = document.querySelector('.summary-card-container');
  
  if (window.innerWidth >= 800) {
    // Show content immediately for desktop
    if (contentContainer) contentContainer.classList.add('visible');
  } else {
    // For mobile, we'll use sessionStorage to show welcome only once per session
    if (!sessionStorage.getItem('greetingShown')) {
      sessionStorage.setItem('greetingShown', 'true');
      showWelcomeAnimation();
    } else {
      if (contentContainer) contentContainer.classList.add('visible');
    }
  }
}

function showWelcomeAnimation() {
  const animationScreen = document.getElementById('animationScreen');
  if (!animationScreen) return;
  
  const userName = localStorage.getItem('userName') || 
                 sessionStorage.getItem('userName') || 'Guest';
  
  const hour = new Date().getHours();
  let timeOfDay = 'night';
  
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
  
  animationScreen.innerHTML = `
    <div class="greeting-user-animation">
      <span class="greet-text">Good ${timeOfDay},</span>
      <span class="greet-user-name">${userName}</span>
    </div>
  `;
  
  animationScreen.classList.remove('d-none');
  animationScreen.classList.add('fadeIn');
  
  setTimeout(() => {
    animationScreen.classList.remove('fadeIn');
    animationScreen.classList.add('fadeOut');
    
    setTimeout(() => {
      animationScreen.classList.add('hidden');
      const contentContainer = document.querySelector('.summary-card-container');
      if (contentContainer) contentContainer.classList.add('visible');
    }, 1000);
  }, 2000);
}

function terminateUserSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  sessionStorage.clear();
  window.location.href = 'index.html';
}

function forceUpdate() {
  return loadTasks().then(() => {
    updateAllCounts();
    updateDeadlineInfo();
    return true;
  });
}

window.forceUpdate = forceUpdate;

document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
});