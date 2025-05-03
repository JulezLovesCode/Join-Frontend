/**
 * Board Module
 * Manages the Kanban board interface for tasks
 */

// Constants
const BOARD_CATEGORIES = {
  TODO: "to-do",
  IN_PROGRESS: "in-progress",
  FEEDBACK: "await-feedback",
  DONE: "done"
};

// State variables
let selectedBoardCategory = sessionStorage.getItem("selectedBoardCategory") || BOARD_CATEGORIES.TODO;
let tasksData = {};
let tasksArray = [];
let tasksKeys = [];
let contactsArray = []; // Contact list for task assignments
let boardContactSelections = {}; // Tracks selected contacts (renamed to avoid conflicts)
let currentTask = {};
let currentDraggedTaskKey = null;
let currentDraggedTaskId = null;
let isDataLoading = false;
let hasLoadError = false;

/**
 * Fallback implementations in case the external functions aren't loaded
 */
// Fallback for isAuthenticated
if (typeof isAuthenticated !== 'function') {
  window.isAuthenticated = function() {
    return !!localStorage.getItem('token');
  };
  console.warn("Using fallback isAuthenticated function");
}

// Fallback for showErrorNotification
if (typeof showErrorNotification !== 'function') {
  window.showErrorNotification = function(message) {
    console.error("Error notification:", message);
    alert(message);
  };
  console.warn("Using fallback showErrorNotification function");
}

// Fallback for handleApiError
if (typeof handleApiError !== 'function') {
  window.handleApiError = function(error) {
    console.error("API Error:", error);
    return {
      type: 'unknown_error',
      message: error.message || 'An unknown error occurred',
      originalError: error,
      timestamp: new Date().toISOString()
    };
  };
  console.warn("Using fallback handleApiError function");
}

// Fallback for ERROR_TYPES
if (typeof ERROR_TYPES === 'undefined') {
  window.ERROR_TYPES = {
    NETWORK: 'network_error',
    AUTH: 'authentication_error',
    VALIDATION: 'validation_error',
    SERVER: 'server_error',
    NOT_FOUND: 'not_found_error',
    UNKNOWN: 'unknown_error'
  };
  console.warn("Using fallback ERROR_TYPES");
}

// Fallback for API_CONFIG
if (typeof API_CONFIG === 'undefined') {
  window.API_CONFIG = {
    BASE_URL: 'http://127.0.0.1:8000/',
    ENDPOINTS: {
      TASKS: 'api/tasks/',
      CONTACTS: 'api/contacts/',
      AUTH: {
        LOGIN: 'api/auth/login/',
        LOGOUT: 'api/auth/logout/'
      }
    },
    TOKEN_STORAGE_KEY: 'token',
    USERNAME_STORAGE_KEY: 'userName'
  };
  console.warn("Using fallback API_CONFIG");
}

// Fallback for apiGet
if (typeof apiGet !== 'function') {
  window.apiGet = async function(endpoint) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
      const response = await fetch(url, { method: 'GET', headers });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Fallback apiGet error:`, error);
      throw error;
    }
  };
  console.warn("Using fallback apiGet function");
}

// Fallback for apiPatch
if (typeof apiPatch !== 'function') {
  window.apiPatch = async function(endpoint, data) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
      const response = await fetch(url, { 
        method: 'PATCH', 
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Fallback apiPatch error:`, error);
      throw error;
    }
  };
  console.warn("Using fallback apiPatch function");
}

// Fallback for apiDelete
if (typeof apiDelete !== 'function') {
  window.apiDelete = async function(endpoint) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
      const response = await fetch(url, { method: 'DELETE', headers });
      
      if (!response.ok && response.status !== 204) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Fallback apiDelete error:`, error);
      throw error;
    }
  };
  console.warn("Using fallback apiDelete function");
}

/**
 * Initializes board.html (implemented on body onload)
 */
async function boardInit() {
  showLoadingIndicator();
  
  try {
    // Load all required data
    await Promise.all([
      fetchContacts(),
      fetchTasks()
    ]);
    
    // Render the board with loaded data
    createTaskOnBoard();
    checkAndAddNoTask();
    generateInitials();
    
    // Add event listeners after render
    setTimeout(() => {
      addContactClickListeners();
    }, 500);
    
    hideLoadingIndicator();
  } catch (error) {
    console.error("Error initializing board:", error);
    hideLoadingIndicator();
    
    // Use function if available, otherwise fallback to console
    if (typeof showErrorNotification === 'function') {
      showErrorNotification("There was an error loading the board. Some features may not work correctly.");
    } else {
      console.error("There was an error loading the board. Some features may not work correctly.");
      alert("There was an error loading the board. Some features may not work correctly.");
    }
  }
}

/**
 * Shows loading indicator during data fetch
 */
function showLoadingIndicator() {
  isDataLoading = true;
  
  // Create loading UI if needed
  let loadingElement = document.getElementById('board-loading');
  if (!loadingElement) {
    loadingElement = document.createElement('div');
    loadingElement.id = 'board-loading';
    loadingElement.classList.add('loading-indicator');
    loadingElement.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading tasks...</p>
    `;
    
    // Add some basic inline styles
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.background = 'rgba(255, 255, 255, 0.9)';
    loadingElement.style.padding = '20px';
    loadingElement.style.borderRadius = '10px';
    loadingElement.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    loadingElement.style.zIndex = '1000';
    loadingElement.style.textAlign = 'center';
    
    document.body.appendChild(loadingElement);
  }
  
  loadingElement.style.display = 'block';
}

/**
 * Hides loading indicator after data fetch
 */
function hideLoadingIndicator() {
  isDataLoading = false;
  
  const loadingElement = document.getElementById('board-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

/**
 * Fetches contacts from API or initializes with mock data
 */
async function fetchContacts() {
  // Check for auth failures before making the request
  if (sessionStorage.getItem('auth_failed') === 'true' || !isAuthenticated()) {
    console.log("Authentication previously failed or no token, using mock contacts");
    contactsArray = getMockContacts();
    
    // Initialize boardContactSelections
    contactsArray.forEach((contact, index) => {
      boardContactSelections[index] = false;
    });
    
    return contactsArray;
  }
  
  try {
    // Try to get contacts from the API
    const response = await apiGet(API_CONFIG.ENDPOINTS.CONTACTS);
    
    if (response && Array.isArray(response)) {
      contactsArray = response;
    } else if (response && typeof response === 'object') {
      contactsArray = Object.values(response);
    } else {
      throw new Error("Invalid contacts data format");
    }
  } catch (error) {
    // Log error and fall back to mock contacts
    const errorInfo = handleApiError(error);
    console.log("Using mock contacts due to API error:", errorInfo.type);
    
    // Initialize with mock data
    contactsArray = getMockContacts();
  }
  
  // Initialize boardContactSelections
  contactsArray.forEach((contact, index) => {
    boardContactSelections[index] = false;
  });
  
  return contactsArray;
}

/**
 * Fetches tasks from API or uses mock data as fallback
 */
async function fetchTasks() {
  // Check for auth failures before making the request
  if (sessionStorage.getItem('auth_failed') === 'true' || !isAuthenticated()) {
    console.log("Authentication previously failed or no token, using mock tasks");
    useAndProcessMockTasks();
    return;
  }
  
  try {
    // Try to fetch tasks from API
    const response = await apiGet(API_CONFIG.ENDPOINTS.TASKS);
    
    // Check if response is valid
    if (!response) {
      throw new Error("No data received from API");
    }
    
    // Process response data
    tasksData = response;
    tasksArray = Array.isArray(response) ? response : Object.values(response);
    tasksKeys = Object.keys(tasksData);
    
  } catch (error) {
    // Handle error and use mock data
    const errorInfo = handleApiError(error);
    
    // Show an error message if appropriate
    if (errorInfo.type === ERROR_TYPES.AUTH) {
      showErrorNotification("Your session has expired. Using sample tasks for demonstration.");
    } else if (errorInfo.type === ERROR_TYPES.NETWORK) {
      showErrorNotification("Could not connect to server. Using sample tasks for demonstration.");
    }
    
    useAndProcessMockTasks();
  }
}

/**
 * Helper function to use and process mock tasks data
 */
function useAndProcessMockTasks() {
  tasksArray = getMockTasks();
  tasksData = tasksArray.reduce((obj, task, index) => {
    obj[index] = task;
    return obj;
  }, {});
  tasksKeys = Object.keys(tasksData);
}

/**
 * Provides mock contacts for testing when API is unavailable
 * @returns {Array} Array of mock contact objects
 */
function getMockContacts() {
  // Try to get user-created contacts from localStorage
  const mockContactsJson = localStorage.getItem('mockContacts');
  if (mockContactsJson) {
    try {
      const mockContacts = JSON.parse(mockContactsJson);
      if (Array.isArray(mockContacts) && mockContacts.length > 0) {
        console.log("Using user-created contacts from localStorage:", mockContacts);
        return mockContacts;
      }
    } catch (error) {
      console.error("Error parsing mock contacts:", error);
    }
  }
  
  // Default contacts if none exist in localStorage
  const defaultContacts = [
    { id: 1, name: "Martina Bohm", email: "martina@example.com", color: "#FF7A00" },
    { id: 2, name: "Sas Sas", email: "sas@example.com", color: "#FF5EB3" },
    { id: 3, name: "Tobias Mal", email: "tobias@example.com", color: "#6E52FF" }
  ];
  
  // Save these to localStorage for future use
  localStorage.setItem('mockContacts', JSON.stringify(defaultContacts));
  
  return defaultContacts;
}

/**
 * Sets up click listeners for contact avatars
 */
function addContactClickListeners() {
  const contacts = document.querySelectorAll(".task-on-board-contact");
  
  contacts.forEach(contact => {
    // Remove existing listeners to avoid duplicates
    contact.removeEventListener("click", toggleContactSelection);
    // Add fresh listener
    contact.addEventListener("click", toggleContactSelection);
  });
}

/**
 * Toggle contact selection state
 * @param {Event} event - Click event
 */
function toggleContactSelection(event) {
  // Prevent event from bubbling to parent elements if event is provided
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  // Toggle selection class if this exists
  if (this && typeof this.classList !== 'undefined') {
    this.classList.toggle("selected-contact");
  }
}

/**
 * Creates mock task data for testing when API fails
 * Uses localStorage to persist deleted tasks between sessions
 */
function getMockTasks() {
  // Default mock tasks
  const defaultMockTasks = [
    {
      id: 1,
      title: "Website Redesign",
      description: "Update the company website with new design",
      board_category: "to-do",
      task_category: "User Story",
      priority: "medium",
      contacts: {
        1: { name: "John Doe", email: "john@example.com" },
        2: { name: "Jane Smith", email: "jane@example.com" }
      },
      subtasks: {
        subtask1: { title: "Design homepage", completed: false },
        subtask2: { title: "Design about page", completed: true }
      }
    },
    {
      id: 2,
      title: "API Integration",
      description: "Integrate payment gateway API",
      board_category: "in-progress",
      task_category: "Technical Task",
      priority: "urgent",
      contacts: {
        3: { name: "Bob Johnson", email: "bob@example.com" }
      },
      subtasks: {
        subtask1: { title: "Research API docs", completed: true },
        subtask2: { title: "Implement API calls", completed: false }
      }
    },
    {
      id: 3,
      title: "User Testing",
      description: "Conduct user testing for new features",
      board_category: "await-feedback",
      task_category: "User Story",
      priority: "low",
      contacts: {
        1: { name: "John Doe", email: "john@example.com" },
        4: { name: "Alice Brown", email: "alice@example.com" }
      },
      subtasks: {}
    }
  ];

  // Check if we have saved mock tasks in localStorage
  try {
    const savedMockTasks = localStorage.getItem('mockTasks');
    if (savedMockTasks) {
      return JSON.parse(savedMockTasks);
    }
  } catch (error) {
    console.error("Error retrieving mock tasks from localStorage:", error);
    // Reset the mock tasks storage if corrupt
    localStorage.removeItem('mockTasks');
  }

  // If no saved tasks or error occurred, initialize with default tasks
  localStorage.setItem('mockTasks', JSON.stringify(defaultMockTasks));
  return defaultMockTasks;
}

/**
 * This function renders the task cards in board.html. First it defines all board IDs for the different categories. Then it clears all Boards and renders the cards.
 */
function createTaskOnBoard() {
  console.log("Creating tasks on board with data:", tasksArray);
  
  const boardIds = {
    "to-do": "to-do",
    "in-progress": "in-progress",
    "await-feedback": "await-feedback",
    "done": "done",
  };

  clearBoards(boardIds);

  tasksArray.forEach((task, key) => {
    let taskId = task.id || task._id || task.task_id || "undefined";
    let contactsHTML = generateContactsHTML(task.contacts);
    let boardId = boardIds[task.board_category] || selectedBoardCategory;
    let content = document.getElementById(boardId);
    let prioSrc = handlePrio(task.priority);
    let categoryClass = task.task_category && task.task_category.toLowerCase().includes("user") ? "user-story" : "technical-task";

    if (content) {
      content.innerHTML += generateTaskOnBoardHTML(key, taskId, categoryClass, task, contactsHTML, prioSrc);
    }
  });
}

/**
 * Helper function to make authenticated API requests
 * @param {string} url - The API endpoint URL
 * @param {string} method - HTTP method (GET, POST, PATCH, etc.)
 * @param {Object} data - Data to send (for POST, PATCH, etc.)
 * @returns {Promise<any>} The parsed response data
 */
async function fetchWithAuth(url, method = 'GET', data = null) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  if (method === 'DELETE') {
    return null;
  }
  
  return await response.json();
}

/**
 * This function works by using the input field "Find Task". It is implemented by an oninput-handler in the HTML.
 */
function searchTasks() {
  let input = document.getElementById("search-input").value.toLowerCase();
  let filteredTasks = tasksArray.filter((task) => {
    return task.title.toLowerCase().includes(input) || task.description.toLowerCase().includes(input);
  });
  renderFilteredTasks(filteredTasks);
}

/**
 * Same function as findTask() but implemented on another div shown on mobile devices.
 */
function searchTasksMobile() {
  let input = document.getElementById("find-task2").value.toLowerCase();
  let filteredTasks = tasksArray.filter((task) => {
    return task.title.toLowerCase().includes(input) || task.description.toLowerCase().includes(input);
  });
  renderFilteredTasks(filteredTasks);
}

/**
 * Same functionality as createTaskOnBoard, but for the filtered tasks by the findTask-function.
 * @param {array} filteredTasks - filtered tasks by oninput-handler in findTask().
 */
function renderFilteredTasks(filteredTasks) {
  const boardIds = { "to-do": "to-do", "in-progress": "in-progress", "await-feedback": "await-feedback", done: "done" };
  clearBoards(boardIds);

  filteredTasks.forEach((task, i) => {
    let taskId = task.id || task._id || task.task_id || "undefined";
    let key = tasksKeys ? tasksKeys[tasksArray.indexOf(task)] : i;
    let contactsHTML = generateContactsHTML(task.contacts);
    let boardId = boardIds[task.board_category] || "to-do";
    let content = document.getElementById(boardId);
    let prioSrc = handlePrio(task.priority);
    let categoryClass = task.task_category && task.task_category.toLowerCase().includes("user") ? "user-story" : "technical-task";
    
    if (content) {
      content.innerHTML += generateTaskOnBoardHTML(key, taskId, categoryClass, task, contactsHTML, prioSrc);
    }
  });
  
  checkAndAddNoTask();
}

/**
 * This function empties all category boards before they are rendert again in other functions.
 * @param {array} boardIds - board categories to-do, in-progress, await-feedback and done
 */
function clearBoards(boardIds) {
  for (let id in boardIds) {
    let content = document.getElementById(boardIds[id]);
    if (content) {
      content.innerHTML = "";
    }
  }
}

/**
 * This function displays the assigned contacts on the cards on the board by initials.
 * @param {array} contacts - task.contacts
 * @returns HTMLs of the first four assigned contacts and the HTML with the number of the further contacts, if there are more.
 */
function generateContactsHTML(contacts) {
  contacts = contacts || {};
  const contactCount = Object.keys(contacts).length;
  const displayedContacts = getDisplayedContactsHTML(contacts);
  const remainingContacts = getRemainingContactsHTML(contactCount);

  return displayedContacts + remainingContacts;
}

/**
 * This function renders the first four assigned task contacts on the card on the board.
 * @param {array} contacts - task.contacts
 * @returns HTMLs of the first four assigned contacts
 */
function getDisplayedContactsHTML(contacts) {
  let contactsHTML = "";
  let displayedContacts = 0;

  for (let key in contacts) {
    if (contacts.hasOwnProperty(key) && displayedContacts < 4) {
      const contact = contacts[key];
      contactsHTML += generateContact(contact);
      displayedContacts++;
    } else if (displayedContacts >= 4) {
      break;
    }
  }

  return contactsHTML;
}

/**
 * Generates HTML for a single contact avatar
 * @param {Object} contact - The contact object with name
 * @returns {string} HTML markup for the contact avatar
 */
function generateContact(contact) {
  if (!contact || !contact.name) return '';
  
  const initials = getInitials(contact.name);
  const color = generateColorForContact(contact.name);
  
  return `<div class="task-on-board-contact" style="background-color: ${color};">${initials}</div>`;
}

/**
 * Generates a consistent color for a contact based on their name
 * @param {string} name - Contact name
 * @returns {string} CSS color string
 */
function generateColorForContact(name) {
  if (!name) return '#2A3647';
  
  // Simple hash function for consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use predefined colors for consistency
  const colors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', 
    '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
    '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B'
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Generates HTML for the "more contacts" indicator
 * @param {number} contactCount - Total number of contacts
 * @returns {string} HTML for remaining contacts indicator
 */
function getRemainingContactsHTML(contactCount) {
  if (contactCount > 4) {
    const remainingContacts = contactCount - 4;
    return `<div class="task-on-board-contact remaining-count">+${remainingContacts}</div>`;
  }
  return "";
}

/**
 * This function displays the correct image for each prio status on the cards on the board
 * @param {string} prio - task.prio
 * @returns the correct image correspondant to urgent, medium or low
 */
function handlePrio(priority) {
  if (priority === "urgent") {
    return "../assets/images/high.svg";
  } else if (priority === "medium") {
    return "../assets/images/medium.svg";
  } else if (priority === "low") {
    return "../assets/images/low.svg";
  } else {
    return "../assets/images/medium.svg";
  }
}

/**
 * This function defines and calculates the variables needed for showing the subtask status on the cards on the board and then returns the card HTMLs.
 * @param {string} key - task key
 * @param {string} categoryClass - task.task_category
 * @param {string} task
 * @param {number} i
 * @param {string} contactsHTML - contact initials in the task cards
 * @param {string} prioSrc - source of the image used for prio status
 * @returns the HTML of the task cards
 */
function generateTaskOnBoardHTML(key, taskId, categoryClass, task, contactsHTML, prioSrc) {
  let subtasks = task.subtasks || {};
  let totalSubtasks = Object.keys(subtasks).length;
  let completedSubtasks = Object.values(subtasks).filter((subtask) => subtask.completed).length;
  let progressPercentage = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;
  
  return `
    <div class="task-on-board" onclick="openTask(${taskId})" draggable="true" ondragstart="startDragging(${taskId})">
      <div class="task-on-board-category ${categoryClass}">${task.task_category || 'Task'}</div>
      <div class="task-on-board-headline">${task.title || 'Untitled Task'}</div>
      <div class="task-on-board-text">${task.description || ''}</div>
      ${totalSubtasks > 0 ? `
        <div class="task-on-board-subtasks">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${progressPercentage}%"></div>
          </div>
          <div class="task-on-board-subtasks-text">${completedSubtasks}/${totalSubtasks} Subtasks</div>
        </div>
      ` : ''}
      <div class="task-on-board-lastrow">
        <div class="task-on-board-contacts">
          ${contactsHTML}
        </div>
        <img class="task-on-board-relevance" src="${prioSrc}" alt="Priority" />
      </div>
    </div>
  `;
}

/**
 * This function separates the first and the last name, then returns the initials as big letters.
 * @param {string} name - contact.name
 * @returns initials
 */
function getInitials(name) {
  if (!name) return "";
  
  let initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");
  return initials.toUpperCase();
}

/**
 * Generate user initials for profile
 */
function generateInitials() {
  const userProfile = document.getElementById('user-profile');
  if (!userProfile) return;
  
  const userName = localStorage.getItem('userName') || 'Guest';
  const initials = getInitials(userName);
  
  userProfile.textContent = initials;
  userProfile.style.backgroundColor = generateColorForContact(userName);
}

/**
 * This function adds a div with "No task in this category", if it is empty.
 */
function checkAndAddNoTask() {
  const taskAreas = ["to-do", "in-progress", "await-feedback", "done"];

  taskAreas.forEach((id) => {
    const element = document.getElementById(id);
    if (element && element.children.length === 0) {
      const noTaskDiv = document.createElement("div");
      noTaskDiv.className = "empty-column-notice";
      noTaskDiv.innerHTML = `No tasks in ${id.replace(/-/g, " ")}`;
      element.appendChild(noTaskDiv);
    }
  });
}

/**
 * This function starts the dragging activity on tasks on the board.
 * @param {string} taskId - task id
 */
function startDragging(taskId) {
  if (!taskId || taskId === 0) {
    console.error("Error: Task ID is invalid!", taskId);
    return;
  }
  currentDraggedTaskKey = taskId;
}

/**
 * Allows dropping by preventing default behavior
 * @param {Event} ev - The dragover event
 */
function allowDrop(ev) {
  ev.preventDefault();
  // Removed hover effect for cleaner UI
}

/**
 * This function removes any styling added during dragging.
 * @param {event} ev
 */
function resetBackground(ev) {
  // No styling to reset - removed hover effect for cleaner UI
}

/**
 * Handles dropping a task on a board column
 * @param {Event} event - The drop event
 * @param {string} category - The target category
 */
function drop(event, category) {
  event.preventDefault();
  
  if (!currentDraggedTaskKey || currentDraggedTaskKey === 0) {
    return;
  }

  moveTo(category, currentDraggedTaskKey);
}

/**
 * Updates a task's category on the server
 * @param {string} category - The new category
 * @param {string} taskId - The task ID
 */
async function moveTo(category, taskId) {
  if (!taskId || taskId === 0) {
    console.error("Error: Task ID is invalid!", taskId);
    return;
  }

  // Optimize UI update - update locally first for better UX
  const taskToUpdate = tasksArray.find(t => t.id == taskId);
  if (taskToUpdate) {
    const oldCategory = taskToUpdate.board_category;
    taskToUpdate.board_category = category.toLowerCase();
    
    // Re-render to show immediate feedback
    createTaskOnBoard();
    
    // Check if using mock data
    if (sessionStorage.getItem('auth_failed') === 'true' || !isAuthenticated()) {
      console.log("Using mock data, updating localStorage");
      
      // Save updated tasks to localStorage for persistence between page loads
      localStorage.setItem('mockTasks', JSON.stringify(tasksArray));
      
      return; // Skip server update in mock mode
    }
    
    try {
      // Send update to server
      await apiPatch(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`, {
        board_category: category.toLowerCase()
      });
      
      // Refresh data from server to ensure consistency
      await fetchTasks();
      createTaskOnBoard();
      checkAndAddNoTask();
    } catch (error) {
      // If it fails, revert the change locally
      handleApiError(error, () => {
        showErrorNotification("Failed to update task. Please try again.");
        
        // Revert to original category
        if (taskToUpdate) {
          taskToUpdate.board_category = oldCategory;
          createTaskOnBoard();
        }
      });
    }
  } else {
    console.error(`Task with ID ${taskId} not found`);
  }
}

/**
 * Opens a task to view or edit details
 * @param {string} taskId - The task ID to open
 */
function openTask(taskId) {
  if (taskId === undefined || taskId === null) {
    console.error("Error: taskId is undefined or null!");
    return;
  }
  
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    console.error("ERROR: Task not found for ID:", taskId);
    return;
  }

  document.getElementById("show-task-layer").classList.remove("d-none");
  
  const content = document.getElementById("show-task-inner-layer");
  content.innerHTML = `
    <div class="show-task-firstrow">
      <div class="task-on-board-category ${task.task_category && task.task_category.toLowerCase().includes("user") ? "user-story" : "technical-task"}">${task.task_category || 'Task'}</div>
      <div class="show-task-close" onclick="closeTask()">
        <img src="../assets/images/close.svg" alt="close">
      </div>
    </div>
    <h1>${task.title || 'Untitled Task'}</h1>
    <div class="show-task-description">${task.description || ''}</div>
    <div class="show-task-text-rows">
      <p class="show-task-characteristic">Due date:</p>
      <p>${task.due_date || 'No date set'}</p>
    </div>
    <div class="show-task-text-rows">
      <p class="show-task-characteristic">Priority:</p>
      <p>${task.priority || 'Medium'}</p>
      <img src="${handlePrio(task.priority)}" alt="Priority">
    </div>
    <div class="show-task-text-rows pb8">
      <p class="show-task-characteristic" id="assignees-section-heading">Assigned to:</p>
    </div>
    <div class="show-task-contacts assignees-container">
      ${generateAssigneesList(task.contacts)}
    </div>
    <div class="show-task-text-rows pb8 mt12">
      <p class="show-task-characteristic" id="subtasks-section-heading">Subtasks:</p>
    </div>
    <div class="show-task-subtasks subtasks-container">
      ${generateSubtasksList(task.subtasks, taskId)}
    </div>
    <div class="show-task-lastrow">
      <a class="show-task-lastrow-link" onclick="deleteTask(${taskId})">
        <img class="show-task-icon" src="../assets/images/delete.svg" alt="delete">
        Delete
      </a>
      <div class="show-task-lastrow-line"></div>
      <a class="show-task-lastrow-link" onclick="showEditTask(${taskId})">
        <img class="show-task-icon" src="../assets/images/edit.svg" alt="edit">
        Edit
      </a>
    </div>
  `;
  
  // Show or hide sections based on content
  if (!task.subtasks || Object.keys(task.subtasks).length === 0) {
    document.getElementById("subtasks-section-heading").classList.add("d-none");
  }
  
  if (!task.contacts || Object.keys(task.contacts).length === 0) {
    document.getElementById("assignees-section-heading").classList.add("d-none");
  }
}

/**
 * Generates HTML for list of assignees in task details
 * @param {Object} contacts - The contacts object
 * @returns {string} HTML for assignees list
 */
function generateAssigneesList(contacts) {
  if (!contacts || Object.keys(contacts).length === 0) {
    return '';
  }
  
  return Object.values(contacts).map(contact => {
    const color = generateColorForContact(contact.name);
    return `
      <div class="show-task-contact">
        <div class="show-task-contact-letters" style="background-color: ${color};">${getInitials(contact.name)}</div>
        <p>${contact.name}</p>
      </div>
    `;
  }).join('');
}

/**
 * Generates HTML for list of subtasks in task details
 * @param {Object} subtasks - The subtasks object
 * @param {string} taskId - The task ID
 * @returns {string} HTML for subtasks list
 */
function generateSubtasksList(subtasks, taskId) {
  if (!subtasks || Object.keys(subtasks).length === 0) {
    return '';
  }
  
  return Object.entries(subtasks).map(([key, subtask]) => {
    const checkboxImage = subtask.completed ? 
      "../assets/images/subtasks_checked.svg" : 
      "../assets/images/subtasks_notchecked.svg";
      
    return `
      <div class="show-task-subtask" onclick="toggleSubtask('${taskId}', '${key}', this)">
        <img src="${checkboxImage}" alt="checkbox">
        <p>${subtask.title}</p>
      </div>
    `;
  }).join('');
}

/**
 * Toggles a subtask's completion status
 * @param {string} taskId - The task ID
 * @param {string} subtaskKey - The subtask key
 * @param {HTMLElement} element - The clicked element
 */
function toggleSubtask(taskId, subtaskKey, element) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task || !task.subtasks || !task.subtasks[subtaskKey]) {
    return;
  }
  
  // Toggle completion status
  task.subtasks[subtaskKey].completed = !task.subtasks[subtaskKey].completed;
  
  // Update UI
  const checkboxImg = element.querySelector('img');
  if (task.subtasks[subtaskKey].completed) {
    checkboxImg.src = "../assets/images/subtasks_checked.svg";
  } else {
    checkboxImg.src = "../assets/images/subtasks_notchecked.svg";
  }
  
  // Update on server
  updateSubtaskStatus(taskId, subtaskKey, task.subtasks[subtaskKey].completed);
}

/**
 * Updates a subtask's status on the server
 * @param {string} taskId - The task ID
 * @param {string} subtaskKey - The subtask key
 * @param {boolean} completed - The new completion status
 */
async function updateSubtaskStatus(taskId, subtaskKey, completed) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task || !task.subtasks || !task.subtasks[subtaskKey]) {
    console.error("Error: Task or subtask not found");
    return;
  }
  
  // Update locally first for immediate feedback
  const previousState = task.subtasks[subtaskKey].completed;
  task.subtasks[subtaskKey].completed = completed;
  
  // Update UI elements if task detail view is open
  const subtasksContainer = document.querySelector('.subtasks-container');
  if (subtasksContainer) {
    // No need to refresh the entire board, just update the progress indicators
    updateSubtaskProgressIndicators(task);
  }
  
  // Check if using mock data
  if (sessionStorage.getItem('auth_failed') === 'true' || !isAuthenticated()) {
    console.log("Using mock data, updating subtask in localStorage");
    
    // Save updated tasks to localStorage for persistence between page loads
    localStorage.setItem('mockTasks', JSON.stringify(tasksArray));
    
    // Update the UI
    createTaskOnBoard();
    
    return; // Skip server update in mock mode
  }
  
  try {
    // Send update to server
    await apiPatch(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/subtasks/${subtaskKey}/`, {
      completed
    });
    
    // Refresh data to ensure consistency
    await fetchTasks();
    
    // Update the UI only if necessary
    if (document.getElementById("show-task-layer").classList.contains("d-none")) {
      // If task detail is closed, just update the board
      createTaskOnBoard();
    } else {
      // If task detail is open, refresh it with the current task
      openTask(taskId);
    }
  } catch (error) {
    // Handle error and revert local change
    handleApiError(error, () => {
      showErrorNotification("Failed to update subtask. Please try again.");
      
      // Revert to previous state
      if (task && task.subtasks && task.subtasks[subtaskKey] !== undefined) {
        task.subtasks[subtaskKey].completed = previousState;
        
        // Update UI to reflect reverted state
        if (document.getElementById("show-task-layer").classList.contains("d-none")) {
          createTaskOnBoard();
        } else {
          // Update the checkbox in the UI
          const subtaskElement = document.querySelector(`.show-task-subtask[data-subtask-key="${subtaskKey}"]`);
          if (subtaskElement) {
            const checkboxImg = subtaskElement.querySelector('img');
            if (checkboxImg) {
              checkboxImg.src = previousState 
                ? "../assets/images/subtasks_checked.svg" 
                : "../assets/images/subtasks_notchecked.svg";
            }
          }
        }
      }
    });
  }
}

/**
 * Updates subtask progress indicators in the UI
 * @param {Object} task - The task containing subtasks
 */
function updateSubtaskProgressIndicators(task) {
  if (!task || !task.subtasks) return;
  
  const subtasks = task.subtasks || {};
  const totalSubtasks = Object.keys(subtasks).length;
  const completedSubtasks = Object.values(subtasks)
    .filter(subtask => subtask.completed).length;
  
  // Calculate progress percentage
  const progressPercentage = totalSubtasks === 0 
    ? 0 
    : (completedSubtasks / totalSubtasks) * 100;
  
  // Update progress bar in task card if it exists
  const taskCard = document.querySelector(`.task-on-board[data-task-id="${task.id}"]`);
  if (taskCard) {
    const progressBar = taskCard.querySelector('.progress-bar');
    const progressText = taskCard.querySelector('.task-on-board-subtasks-text');
    
    if (progressBar) {
      progressBar.style.width = `${progressPercentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${completedSubtasks}/${totalSubtasks} Subtasks`;
    }
  }
}

/**
 * Opens the add task form for a specific category
 * @param {string} category - The board category
 */
function openAddTask(category) {
  // Store the selected category in sessionStorage
  sessionStorage.setItem('selectedBoardCategory', category);
  
  // Redirect to add task page
  window.location.href = 'add_task.html';
}

/**
 * Closes the task details panel
 */
function closeTask() {
  const layer = document.getElementById("show-task-layer");
  layer.classList.add("d-none");
}

/**
 * Opens the edit interface for a task
 * @param {string} taskId - The task ID
 */
function showEditTask(taskId) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    console.error("ERROR: Task not found for ID:", taskId);
    return;
  }

  // Close the task view and prepare edit layer
  document.getElementById("show-task-layer").classList.remove("d-none");
  const content = document.getElementById("show-task-inner-layer");
  
  // Build edit form HTML
  content.innerHTML = `
    <div class="show-task-firstrow">
      <div class="task-on-board-category ${task.task_category && task.task_category.toLowerCase().includes("user") ? "user-story" : "technical-task"}">${task.task_category || 'Task'}</div>
      <div class="show-task-close" onclick="closeTask()">
        <img src="../assets/images/close.svg" alt="close">
      </div>
    </div>
    <form id="edit-task-form" onsubmit="saveEditedTask(${taskId}); return false;">
      <div class="edit-task-section">
        <label for="edit-title">Title</label>
        <input type="text" id="edit-title" value="${task.title || ''}" required>
      </div>
      
      <div class="edit-task-section">
        <label for="edit-description">Description</label>
        <textarea id="edit-description" rows="3">${task.description || ''}</textarea>
      </div>
      
      <div class="edit-task-section">
        <label for="edit-due-date">Due date</label>
        <input type="date" id="edit-due-date" value="${task.due_date || ''}" required>
      </div>
      
      <div class="edit-task-section">
        <label>Priority</label>
        <div class="edit-priority-buttons">
          <button type="button" id="edit-high-btn" class="priority-btn ${task.priority === 'urgent' ? 'active' : ''}" onclick="setEditPriority('urgent')">
            Urgent <img src="../assets/images/${task.priority === 'urgent' ? 'high-white.svg' : 'high.svg'}" alt="High">
          </button>
          <button type="button" id="edit-medium-btn" class="priority-btn ${task.priority === 'medium' ? 'active' : ''}" onclick="setEditPriority('medium')">
            Medium <img src="../assets/images/${task.priority === 'medium' ? 'medium-white.svg' : 'medium.svg'}" alt="Medium">
          </button>
          <button type="button" id="edit-low-btn" class="priority-btn ${task.priority === 'low' ? 'active' : ''}" onclick="setEditPriority('low')">
            Low <img src="../assets/images/${task.priority === 'low' ? 'low-white.svg' : 'low.svg'}" alt="Low">
          </button>
          <input type="hidden" id="edit-priority" value="${task.priority || 'medium'}">
        </div>
      </div>
      
      <div class="edit-task-section">
        <label>Assigned To</label>
        <div id="edit-contacts-container" class="edit-contacts-container">
          ${generateEditContactsHTML(task.contacts)}
        </div>
      </div>
      
      <div class="edit-task-section">
        <label>Subtasks</label>
        <div id="edit-subtasks-container" class="edit-subtasks-container">
          ${generateEditSubtasksHTML(task.subtasks)}
        </div>
        <div class="edit-subtask-add">
          <input type="text" id="new-subtask-input" placeholder="Add new subtask">
          <button type="button" onclick="addSubtaskToEdit()">+</button>
        </div>
      </div>
      
      <div class="edit-task-buttons">
        <button type="button" class="cancel-btn" onclick="closeTask()">Cancel</button>
        <button type="submit" class="save-btn">Save</button>
      </div>
    </form>
  `;
  
  // Make sure we have the necessary CSS styles for the edit form
  addEditTaskStyles();
}

/**
 * Adds necessary CSS styles for the edit task form
 */
function addEditTaskStyles() {
  // Check if styles are already added
  if (document.getElementById('edit-task-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'edit-task-styles';
  styleElement.textContent = `
    .edit-task-section {
      margin-bottom: 16px;
    }
    
    .edit-task-section label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    }
    
    .edit-task-section input[type="text"],
    .edit-task-section input[type="date"],
    .edit-task-section textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    .edit-priority-buttons {
      display: flex;
      gap: 8px;
    }
    
    .priority-btn {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }
    
    .priority-btn.active {
      color: white;
    }
    
    #edit-high-btn.active {
      background-color: #FF3D00;
    }
    
    #edit-medium-btn.active {
      background-color: #FFA800;
    }
    
    #edit-low-btn.active {
      background-color: #7AE229;
    }
    
    .edit-contacts-container,
    .edit-subtasks-container {
      margin-bottom: 8px;
    }
    
    .edit-contact-item,
    .edit-subtask-item {
      display: flex;
      align-items: center;
      padding: 8px;
      margin-bottom: 4px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .edit-contact-item input[type="checkbox"] {
      margin-right: 8px;
    }
    
    .edit-subtask-item {
      justify-content: space-between;
    }
    
    .edit-subtask-add {
      display: flex;
      gap: 8px;
    }
    
    .edit-subtask-add input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    .edit-subtask-add button {
      padding: 8px 12px;
      background-color: #2A3647;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .edit-task-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }
    
    .cancel-btn,
    .save-btn {
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .cancel-btn {
      background-color: transparent;
      border: 1px solid #2A3647;
      color: #2A3647;
    }
    
    .save-btn {
      background-color: #2A3647;
      border: none;
      color: white;
    }
  `;
  
  document.head.appendChild(styleElement);
}

/**
 * Generates HTML for contacts in the edit task form
 * @param {Object} contacts - The contacts object
 * @returns {string} HTML markup for contacts
 */
function generateEditContactsHTML(contacts) {
  if (!contacts || Object.keys(contacts).length === 0) {
    return '<div class="no-contacts">No contacts assigned</div>';
  }
  
  return Object.entries(contacts).map(([id, contact]) => {
    return `
      <div class="edit-contact-item">
        <input type="checkbox" id="edit-contact-${id}" data-contact-id="${id}" checked>
        <label for="edit-contact-${id}">${contact.name}</label>
      </div>
    `;
  }).join('') + generateUnassignedContactsHTML(contacts);
}

/**
 * Generates HTML for unassigned contacts
 * @param {Object} assignedContacts - The currently assigned contacts
 * @returns {string} HTML markup for unassigned contacts
 */
function generateUnassignedContactsHTML(assignedContacts) {
  const assignedIds = Object.keys(assignedContacts);
  const unassignedContacts = contactsArray.filter(contact => 
    !assignedIds.includes(contact.id.toString())
  );
  
  if (unassignedContacts.length === 0) return '';
  
  const unassignedHTML = unassignedContacts.map(contact => {
    return `
      <div class="edit-contact-item">
        <input type="checkbox" id="edit-contact-${contact.id}" data-contact-id="${contact.id}">
        <label for="edit-contact-${contact.id}">${contact.name}</label>
      </div>
    `;
  }).join('');
  
  return `
    <div class="unassigned-contacts-divider">Other contacts</div>
    ${unassignedHTML}
  `;
}

/**
 * Generates HTML for subtasks in the edit task form
 * @param {Object} subtasks - The subtasks object
 * @returns {string} HTML markup for subtasks
 */
function generateEditSubtasksHTML(subtasks) {
  if (!subtasks || Object.keys(subtasks).length === 0) {
    return '<div class="no-subtasks">No subtasks created</div>';
  }
  
  return Object.entries(subtasks).map(([key, subtask]) => {
    return `
      <div class="edit-subtask-item" data-subtask-key="${key}">
        <div class="subtask-content">
          <input type="checkbox" id="edit-subtask-${key}" ${subtask.completed ? 'checked' : ''}>
          <label for="edit-subtask-${key}">${subtask.title}</label>
        </div>
        <button type="button" class="delete-subtask-btn" onclick="removeSubtaskFromEdit('${key}')">✕</button>
      </div>
    `;
  }).join('');
}

/**
 * Sets the priority in the edit form
 * @param {string} priority - The priority level
 */
function setEditPriority(priority) {
  // Reset all buttons
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.classList.remove('active');
    
    // Reset icons
    const img = btn.querySelector('img');
    const btnId = btn.id;
    
    if (btnId === 'edit-high-btn') {
      img.src = '../assets/images/high.svg';
    } else if (btnId === 'edit-medium-btn') {
      img.src = '../assets/images/medium.svg';
    } else if (btnId === 'edit-low-btn') {
      img.src = '../assets/images/low.svg';
    }
  });
  
  // Set the selected button as active
  const activeButton = document.getElementById(`edit-${priority === 'urgent' ? 'high' : priority}-btn`);
  if (activeButton) {
    activeButton.classList.add('active');
    
    // Update icon
    const img = activeButton.querySelector('img');
    if (img) {
      img.src = `../assets/images/${priority === 'urgent' ? 'high' : priority}-white.svg`;
    }
  }
  
  // Update hidden input
  document.getElementById('edit-priority').value = priority;
}

/**
 * Adds a new subtask to the edit form
 */
function addSubtaskToEdit() {
  const input = document.getElementById('new-subtask-input');
  const title = input.value.trim();
  
  if (!title) return;
  
  const container = document.getElementById('edit-subtasks-container');
  const noSubtasksMsg = container.querySelector('.no-subtasks');
  
  if (noSubtasksMsg) {
    container.innerHTML = '';
  }
  
  // Generate a unique key for the new subtask
  const newKey = `new-subtask-${Date.now()}`;
  
  const subtaskHTML = `
    <div class="edit-subtask-item" data-subtask-key="${newKey}">
      <div class="subtask-content">
        <input type="checkbox" id="edit-subtask-${newKey}">
        <label for="edit-subtask-${newKey}">${title}</label>
      </div>
      <button type="button" class="delete-subtask-btn" onclick="removeSubtaskFromEdit('${newKey}')">✕</button>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', subtaskHTML);
  input.value = '';
}

/**
 * Removes a subtask from the edit form
 * @param {string} key - The subtask key
 */
function removeSubtaskFromEdit(key) {
  const subtaskItem = document.querySelector(`.edit-subtask-item[data-subtask-key="${key}"]`);
  
  if (subtaskItem) {
    subtaskItem.remove();
    
    // Check if there are any subtasks left
    const container = document.getElementById('edit-subtasks-container');
    if (!container.querySelector('.edit-subtask-item')) {
      container.innerHTML = '<div class="no-subtasks">No subtasks created</div>';
    }
  }
}

/**
 * Saves the edited task data
 * @param {string} taskId - The task ID
 */
function saveEditedTask(taskId) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    console.error("ERROR: Task not found for ID:", taskId);
    return;
  }
  
  // Get form values
  const title = document.getElementById('edit-title').value;
  const description = document.getElementById('edit-description').value;
  const dueDate = document.getElementById('edit-due-date').value;
  const priority = document.getElementById('edit-priority').value;
  
  // Get selected contacts
  const selectedContactIds = [];
  document.querySelectorAll('.edit-contact-item input[type="checkbox"]:checked').forEach(checkbox => {
    selectedContactIds.push(checkbox.dataset.contactId);
  });
  
  // Prepare updated contacts object
  const updatedContacts = {};
  selectedContactIds.forEach(id => {
    const contact = contactsArray.find(c => c.id == id);
    if (contact) {
      updatedContacts[id] = {
        name: contact.name,
        email: contact.email || `contact${id}@example.com`
      };
    } else if (task.contacts && task.contacts[id]) {
      // Keep existing contact data if available
      updatedContacts[id] = task.contacts[id];
    }
  });
  
  // Get subtasks
  const updatedSubtasks = {};
  document.querySelectorAll('.edit-subtask-item').forEach(item => {
    const key = item.dataset.subtaskKey;
    const checkbox = item.querySelector('input[type="checkbox"]');
    const label = item.querySelector('label');
    
    if (key && label) {
      updatedSubtasks[key] = {
        title: label.textContent,
        completed: checkbox.checked
      };
    }
  });
  
  // Update task object
  task.title = title;
  task.description = description;
  task.due_date = dueDate;
  task.priority = priority;
  task.contacts = updatedContacts;
  task.subtasks = updatedSubtasks;
  
  // Update mock data if using it
  if (sessionStorage.getItem('auth_failed') === 'true' || !isAuthenticated()) {
    localStorage.setItem('mockTasks', JSON.stringify(tasksArray));
  } else {
    // Try to update on server (will be skipped if API is not available)
    apiPatch(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`, {
      title,
      description,
      due_date: dueDate,
      priority,
      contacts: updatedContacts,
      subtasks: updatedSubtasks
    }).catch(err => {
      console.log("API update failed, using local data only:", err);
    });
  }
  
  // Refresh board and close edit view
  createTaskOnBoard();
  closeTask();
  
  // Show success message
  showSuccessNotification("Task updated successfully");
}

/**
 * Deletes a task
 * @param {string} taskId - The task ID to delete
 */
async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }
  
  try {
    // Show loading/processing indicator
    showLoadingIndicator();
    
    // Find task and prepare for optimistic UI update
    const taskIndex = tasksArray.findIndex(t => t.id == taskId);
    let removedTask = null;
    
    if (taskIndex !== -1) {
      // Store task before removing for potential restore
      removedTask = { ...tasksArray[taskIndex] };
      
      // Remove from local array for immediate UI feedback
      tasksArray.splice(taskIndex, 1);
      
      // Update UI immediately
      closeTask();
      createTaskOnBoard();
      checkAndAddNoTask();
    } else {
      console.error("Task not found in array:", taskId);
      showErrorNotification("Task not found");
      hideLoadingIndicator();
      return;
    }
    
    // Check if using mock data
    if (sessionStorage.getItem('auth_failed') === 'true' || !isAuthenticated()) {
      console.log("Using mock data, skipping server delete");
      
      // Update local data storage
      for (let key in tasksData) {
        if (tasksData[key].id == taskId) {
          delete tasksData[key];
          break;
        }
      }
      
      // Recalculate keys
      tasksKeys = Object.keys(tasksData);
      
      // Save updated tasks to localStorage for persistence between page loads
      localStorage.setItem('mockTasks', JSON.stringify(tasksArray));
      
      // Show success and return early
      showSuccessNotification("Task deleted successfully (demo mode)");
      hideLoadingIndicator();
      return;
    }
    
    // Send delete request to server (only if not in mock mode)
    await apiDelete(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`);
    
    // Refresh data to ensure consistency
    await fetchTasks();
    createTaskOnBoard();
    checkAndAddNoTask();
    
    // Show success message
    showSuccessNotification("Task deleted successfully");
  } catch (error) {
    console.error("Error deleting task:", error);
    
    // Use handleApiError if available
    if (typeof handleApiError === 'function') {
      const errorInfo = handleApiError(error);
      showErrorNotification(`Failed to delete task: ${errorInfo.message}`);
    } else {
      showErrorNotification("Failed to delete task. Please try again.");
    }
    
    // Restore the task if we removed it locally
    const taskIndex = tasksArray.findIndex(t => t.id == taskId);
    if (taskIndex === -1 && removedTask) {
      tasksArray.push(removedTask);
      createTaskOnBoard();
      checkAndAddNoTask();
    }
  } finally {
    // Always hide loading indicator
    hideLoadingIndicator();
  }
}

/**
 * Shows a success notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds
 */
function showSuccessNotification(message, duration = 3000) {
  // Create notification container if it doesn't exist
  let container = document.getElementById('success-notification-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'success-notification-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.style.backgroundColor = '#4CAF50';
  notification.style.color = 'white';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '8px';
  notification.style.marginTop = '10px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.style.display = 'flex';
  notification.style.justifyContent = 'space-between';
  notification.style.alignItems = 'center';
  notification.style.maxWidth = '400px';
  
  // Add message
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '20px';
  closeButton.style.marginLeft = '10px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontWeight = 'bold';
  closeButton.onclick = () => {
    notification.remove();
  };
  notification.appendChild(closeButton);
  
  // Add to container
  container.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    notification.remove();
  }, duration);
}

/**
 * Toggles the user menu dropdown
 */
function toggleUserPanel() {
  const userPanel = document.getElementById('user-panel');
  if (userPanel) {
    userPanel.classList.toggle('hidden');
  }
}

/**
 * Logs out the user and redirects to login page
 */
function terminateSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  sessionStorage.clear();
  window.location.href = 'index.html';
}
