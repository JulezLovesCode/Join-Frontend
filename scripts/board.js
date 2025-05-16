


const BOARD_CATEGORIES = {
  TODO: "to-do",
  IN_PROGRESS: "in-progress",
  FEEDBACK: "await-feedback",
  DONE: "done"
};


let selectedBoardCategory = sessionStorage.getItem("selectedBoardCategory") || BOARD_CATEGORIES.TODO;
let tasksData = {};
let tasksArray = [];
let tasksKeys = [];
let contactsArray = []; 
let boardContactSelections = {}; 
let currentTask = {};
let currentDraggedTaskKey = null;
let currentDraggedTaskId = null;
let isDataLoading = false;
let hasLoadError = false;



if (typeof isAuthenticated !== 'function') {
  window.isAuthenticated = function() {
    return !!localStorage.getItem('token');
  };
  console.warn("Using fallback isAuthenticated function");
}


if (typeof showErrorNotification !== 'function') {
  window.showErrorNotification = function(message) {
    console.error("Error notification:", message);
    alert(message);
  };
  console.warn("Using fallback showErrorNotification function");
}


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

// Add apiPost function if not already defined
if (typeof apiPost !== 'function') {
  window.apiPost = async function(endpoint, data) {
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
        method: 'POST', 
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Fallback apiPost error:`, error);
      throw error;
    }
  };
  console.warn("Using fallback apiPost function");
}


// Make boardInit globally available
window.boardInit = async function() {
  console.log("Board initialization started");
  showLoadingIndicator();
  
  try {
    // Share contacts array globally so it can be accessed by other functions
    window.contactsArray = await fetchContacts();
    
    // Fetch tasks from API
    await fetchTasks();
    
    // Create board UI
    createTaskOnBoard();
    checkAndAddNoTask();
    generateInitials();
    
    // Add click listeners to contacts
    setTimeout(() => {
      addContactClickListeners();
    }, 500);
    
    hideLoadingIndicator();
    console.log("Board initialization completed successfully");
  } catch (error) {
    console.error("Error initializing board:", error);
    hideLoadingIndicator();
    
    // Show error notification
    if (typeof showErrorNotification === 'function') {
      showErrorNotification("Could not connect to the server. Please try again later.");
    } else {
      console.error("Could not connect to the server. Please try again later.");
      alert("Could not connect to the server. Please try again later.");
    }
  }
}


function showLoadingIndicator() {
  isDataLoading = true;
  
  
  let loadingElement = document.getElementById('board-loading');
  if (!loadingElement) {
    loadingElement = document.createElement('div');
    loadingElement.id = 'board-loading';
    loadingElement.classList.add('loading-indicator');
    loadingElement.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading tasks...</p>
    `;
    
    
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


function hideLoadingIndicator() {
  isDataLoading = false;
  
  const loadingElement = document.getElementById('board-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}


async function fetchContacts() {
  try {
    // Get contacts from the API
    const response = await apiGet(API_CONFIG.ENDPOINTS.CONTACTS);
    
    if (response && Array.isArray(response)) {
      contactsArray = response;
    } else if (response && typeof response === 'object') {
      contactsArray = Object.values(response);
    } else {
      throw new Error("Invalid contacts data format");
    }
    
    console.log("Contacts from API:", contactsArray);
    
    // Initialize contact selections
    contactsArray.forEach((contact, index) => {
      boardContactSelections[index] = false;
    });
    
    return contactsArray;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    showErrorNotification("Could not load contacts from the server. Please try again later.");
    throw error;
  }
}


async function fetchTasks(updateUI = true) {
  try {
    // Get tasks from the API
    const response = await apiGet(API_CONFIG.ENDPOINTS.TASKS);
    
    if (!response) {
      throw new Error("No data received from API");
    }
    
    if (updateUI) {
      console.log("Tasks from API:", response);
    }
    
    // Process the tasks from the API response
    if (updateUI) {
      tasksData = response;
      tasksArray = Array.isArray(response) ? response : Object.values(response);
      tasksKeys = Object.keys(tasksData);
      return tasksArray;
    } else {
      // Return the processed data but don't update the global variables
      return Array.isArray(response) ? response : Object.values(response);
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
    if (updateUI) {
      showErrorNotification("Could not load tasks from the server. Please try again later.");
    }
    throw error;
  }
}


// This function is no longer needed as we use the API exclusively
function useAndProcessMockTasks() {
  // Intentionally empty - API is used instead
}


// This function is no longer needed as we use the API exclusively
function getMockContacts() {
  // Intentionally empty - API is used instead
  return [];
}


function addContactClickListeners() {
  const contacts = document.querySelectorAll(".task-on-board-contact");
  
  contacts.forEach(contact => {
    
    contact.removeEventListener("click", toggleContactSelection);
    
    contact.addEventListener("click", toggleContactSelection);
  });
}


function toggleContactSelection(event) {
  
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  
  if (this && typeof this.classList !== 'undefined') {
    this.classList.toggle("selected-contact");
  }
}


// This function is no longer needed as we use the API exclusively
function getMockTasks() {
  // Intentionally empty - API is used instead
  return [];
}


function createTaskOnBoard() {
  console.log("Creating tasks on board with data:", tasksArray);
  
  const boardIds = {
    "to-do": "to-do",
    "in-progress": "in-progress",
    "await-feedback": "await-feedback",
    "done": "done",
  };

  clearBoards(boardIds);

  tasksArray.forEach((task, index) => {
    let taskId = task.id || "undefined";
    
    // Handle contacts - API may return them in different formats
    let taskContacts = [];
    if (task.assigned_members && Array.isArray(task.assigned_members)) {
      taskContacts = task.assigned_members;
    } else if (task.contacts && Array.isArray(task.contacts)) {
      taskContacts = task.contacts;
    } else if (task.member_assignments && Array.isArray(task.member_assignments)) {
      taskContacts = task.member_assignments;
    }
    
    let contactsHTML = generateContactsHTML(taskContacts);
    let boardId = boardIds[task.board_category] || selectedBoardCategory;
    let content = document.getElementById(boardId);
    let prioSrc = handlePrio(task.priority);
    let categoryClass = task.task_category && task.task_category.toLowerCase().includes("user") ? "user-story" : "technical-task";

    if (content) {
      content.innerHTML += generateTaskOnBoardHTML(index, taskId, categoryClass, task, contactsHTML, prioSrc);
    }
  });
}


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


function searchTasks() {
  let input = document.getElementById("search-input").value.toLowerCase();
  let filteredTasks = tasksArray.filter((task) => {
    return task.title.toLowerCase().includes(input) || task.description.toLowerCase().includes(input);
  });
  renderFilteredTasks(filteredTasks);
}


function searchTasksMobile() {
  let input = document.getElementById("find-task2").value.toLowerCase();
  let filteredTasks = tasksArray.filter((task) => {
    return task.title.toLowerCase().includes(input) || task.description.toLowerCase().includes(input);
  });
  renderFilteredTasks(filteredTasks);
}


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


function clearBoards(boardIds) {
  for (let id in boardIds) {
    let content = document.getElementById(boardIds[id]);
    if (content) {
      content.innerHTML = "";
    }
  }
}


function generateContactsHTML(contacts) {
  // Initialize or convert to empty array if undefined/null
  let contactsArray = [];
  
  if (contacts) {
    // Handle different contact formats from API
    if (Array.isArray(contacts)) {
      contactsArray = contacts;
    } else if (typeof contacts === 'object') {
      contactsArray = Object.values(contacts);
    }
  }
  
  const contactCount = contactsArray.length;
  const displayedContacts = getDisplayedContactsHTML(contactsArray);
  const remainingContacts = getRemainingContactsHTML(contactCount);

  return displayedContacts + remainingContacts;
}


function getDisplayedContactsHTML(contacts) {
  let contactsHTML = "";
  let displayedContacts = 0;

  // Handle array format from API
  if (Array.isArray(contacts)) {
    for (let i = 0; i < contacts.length && displayedContacts < 4; i++) {
      let contact = contacts[i];
      
      // If contact is just an ID number or reference, find the full contact info
      if (typeof contact === 'number' || (contact && !contact.name)) {
        const contactId = typeof contact === 'object' ? contact.id : contact;
        contact = window.contactsArray.find(c => c.id === contactId);
      }
      
      if (contact) {
        contactsHTML += generateContact(contact);
        displayedContacts++;
      }
    }
  } 
  // Handle object format with keys
  else if (typeof contacts === 'object') {
    for (let key in contacts) {
      if (contacts.hasOwnProperty(key) && displayedContacts < 4) {
        const contact = contacts[key];
        contactsHTML += generateContact(contact);
        displayedContacts++;
      } else if (displayedContacts >= 4) {
        break;
      }
    }
  }

  return contactsHTML;
}


function generateContact(contact) {
  if (!contact || !contact.name) return '';
  
  const initials = getInitials(contact.name);
  const color = generateColorForContact(contact.name);
  
  return `<div class="task-on-board-contact" style="background-color: ${color};">${initials}</div>`;
}


function generateColorForContact(name) {
  if (!name) return '#2A3647';
  
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  
  const colors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', 
    '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
    '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B'
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}


function getRemainingContactsHTML(contactCount) {
  if (contactCount > 4) {
    const remainingContacts = contactCount - 4;
    return `<div class="task-on-board-contact remaining-count">+${remainingContacts}</div>`;
  }
  return "";
}


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


function generateTaskOnBoardHTML(key, taskId, categoryClass, task, contactsHTML, prioSrc) {
  // Get subtasks info and count completed ones
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  
  // Get the appropriate subtasks container
  let subtasksContainer = null;
  
  // Try each possible subtasks property
  if (task.task_components && (Array.isArray(task.task_components) || typeof task.task_components === 'object')) {
    subtasksContainer = task.task_components;
  } else if (task.subtasks && (Array.isArray(task.subtasks) || typeof task.subtasks === 'object')) {
    subtasksContainer = task.subtasks;
  } else if (task.components && (Array.isArray(task.components) || typeof task.components === 'object')) {
    subtasksContainer = task.components;
  }
  
  // Calculate subtask progress
  if (subtasksContainer) {
    if (Array.isArray(subtasksContainer)) {
      totalSubtasks = subtasksContainer.length;
      completedSubtasks = subtasksContainer.filter(subtask => subtask.completed).length;
    } else {
      totalSubtasks = Object.keys(subtasksContainer).length;
      completedSubtasks = Object.values(subtasksContainer).filter(subtask => subtask.completed).length;
    }
  }
  
  let progressPercentage = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;
  
  return `
    <div class="task-on-board" onclick="openTask(${taskId})" draggable="true" ondragstart="startDragging(${taskId})" data-task-id="${taskId}">
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


function getInitials(name) {
  if (!name) return "";
  
  let initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");
  return initials.toUpperCase();
}


function generateInitials() {
  const userProfile = document.getElementById('user-profile');
  if (!userProfile) return;
  
  const userName = localStorage.getItem('userName') || 'Guest';
  const initials = getInitials(userName);
  
  userProfile.textContent = initials;
  userProfile.style.backgroundColor = generateColorForContact(userName);
}


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


function startDragging(taskId) {
  if (!taskId || taskId === 0) {
    console.error("Error: Task ID is invalid!", taskId);
    return;
  }
  currentDraggedTaskKey = taskId;
}


function allowDrop(ev) {
  ev.preventDefault();
  
}


function resetBackground(ev) {
  
}


function drop(event, category) {
  event.preventDefault();
  
  if (!currentDraggedTaskKey || currentDraggedTaskKey === 0) {
    return;
  }

  moveTo(category, currentDraggedTaskKey);
}


async function moveTo(category, taskId) {
  if (!taskId || taskId === 0) {
    console.error("Error: Task ID is invalid!", taskId);
    return;
  }

  // Find the task to update
  const taskToUpdate = tasksArray.find(t => t.id == taskId);
  if (taskToUpdate) {
    const oldCategory = taskToUpdate.board_category;
    taskToUpdate.board_category = category.toLowerCase();
    
    // Optimistically update UI
    createTaskOnBoard();
    
    try {
      // Update task on the server
      await apiPatch(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`, {
        board_category: category.toLowerCase()
      });
      
      // Refresh data from server
      await fetchTasks();
      createTaskOnBoard();
      checkAndAddNoTask();
    } catch (error) {
      // Revert UI if update fails
      console.error("Failed to update task:", error);
      showErrorNotification("Failed to update task. Please try again.");
      
      // Revert the local state
      if (taskToUpdate) {
        taskToUpdate.board_category = oldCategory;
        createTaskOnBoard();
      }
    }
  } else {
    console.error(`Task with ID ${taskId} not found`);
  }
}


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
      <p class="show-task-characteristic d-none" id="assignees-section-heading">Assigned to:</p>
    </div>
    <div class="show-task-contacts assignees-container">
      ${generateAssigneesList(getTaskAssignees(task))}
    </div>
    <div class="show-task-text-rows pb8 mt12">
      <p class="show-task-characteristic d-none" id="subtasks-section-heading">Subtasks:</p>
    </div>
    <div class="show-task-subtasks subtasks-container">
      ${generateSubtasksList(getTaskSubtasks(task), taskId)}
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
  
  // Check if there are subtasks and show/hide the section heading
  const subtasksContainer = document.querySelector('.subtasks-container');
  if (subtasksContainer && subtasksContainer.innerHTML.trim() !== '') {
    document.getElementById("subtasks-section-heading").classList.remove("d-none");
  }
  
  // Check if there are assignees and show/hide the section heading
  const assigneesContainer = document.querySelector('.assignees-container');
  if (assigneesContainer && assigneesContainer.innerHTML.trim() !== '') {
    document.getElementById("assignees-section-heading").classList.remove("d-none");
  }
}


function getTaskAssignees(task) {
  // Try to get contacts from different possible properties
  let assignees = null;
  
  if (task.contacts && (Array.isArray(task.contacts) || typeof task.contacts === 'object')) {
    assignees = task.contacts;
  } else if (task.assigned_members && (Array.isArray(task.assigned_members) || typeof task.assigned_members === 'object')) {
    assignees = task.assigned_members;
  } else if (task.member_assignments && (Array.isArray(task.member_assignments) || typeof task.member_assignments === 'object')) {
    // Convert member_assignments IDs to actual contact objects
    if (Array.isArray(task.member_assignments)) {
      assignees = task.member_assignments.map(id => {
        const contact = contactsArray.find(c => c.id == id);
        return contact || { id, name: `User ${id}`, color: generateColorForContact(`User ${id}`) };
      });
    }
  }
  
  return assignees;
}

function getTaskSubtasks(task) {
  console.log("Getting subtasks for task:", task);
  
  // Try to get subtasks from different possible properties
  let subtasks = null;
  
  // First try task_components property (from serializer)
  if (task.task_components && (Array.isArray(task.task_components) || typeof task.task_components === 'object')) {
    subtasks = task.task_components;
    console.log("Found subtasks in task.task_components:", subtasks);
  }
  // Then try direct subtasks property
  else if (task.subtasks && (Array.isArray(task.subtasks) || typeof task.subtasks === 'object')) {
    subtasks = task.subtasks;
    console.log("Found subtasks in task.subtasks:", subtasks);
  } 
  // Then try components property (Django model relation name)
  else if (task.components && (Array.isArray(task.components) || typeof task.components === 'object')) {
    subtasks = task.components;
    console.log("Found subtasks in task.components:", subtasks);
  }
  
  // If we found subtasks but they're empty, return null
  if (subtasks) {
    if (Array.isArray(subtasks) && subtasks.length === 0) {
      return null;
    } else if (typeof subtasks === 'object' && Object.keys(subtasks).length === 0) {
      return null;
    }
  } else {
    console.log("No subtasks found in task");
  }
  
  console.log("Final subtasks:", subtasks);
  return subtasks;
}

function generateAssigneesList(contacts) {
  if (!contacts || (typeof contacts === 'object' && Object.keys(contacts).length === 0) || 
      (Array.isArray(contacts) && contacts.length === 0)) {
    return '';
  }
  
  // Handle both array and object formats
  const contactsList = Array.isArray(contacts) ? contacts : Object.values(contacts);
  
  return contactsList.map(contact => {
    if (!contact) return '';
    
    const color = contact.color || generateColorForContact(contact.name || 'Unknown');
    const name = contact.name || 'Unknown';
    return `
      <div class="show-task-contact">
        <div class="show-task-contact-letters" style="background-color: ${color};">${getInitials(name)}</div>
        <p>${name}</p>
      </div>
    `;
  }).join('');
}


function generateSubtasksList(subtasks, taskId) {
  console.log("Generating subtasks list for task", taskId, "with subtasks:", subtasks);
  
  if (!subtasks) {
    console.log("No subtasks found for task", taskId);
    return '';
  }
  
  // Handle array format for subtasks (from task_components)
  if (Array.isArray(subtasks)) {
    if (subtasks.length === 0) {
      console.log("Empty array of subtasks");
      return '';
    }
    
    console.log("Processing array of", subtasks.length, "subtasks");
    return subtasks.map((subtask, index) => {
      // Handle different subtask properties for completed status
      const isCompleted = 
        subtask.completed === true || 
        subtask.done === true || 
        subtask.finished === true;
        
      const checkboxImage = isCompleted ? 
        "../assets/images/subtasks_checked.svg" : 
        "../assets/images/subtasks_notchecked.svg";
      
      // Handle different subtask properties for title
      const subtaskTitle = 
        subtask.title || 
        subtask.name || 
        subtask.text || 
        'Untitled Subtask';
      
      // Store the subtask index directly as data attribute 
      return `
        <div class="show-task-subtask" onclick="toggleSubtask('${taskId}', ${index}, this)" data-subtask-index="${index}">
          <img src="${checkboxImage}" alt="checkbox">
          <p>${subtaskTitle}</p>
        </div>
      `;
    }).join('');
  } 
  // Handle object format for subtasks
  else if (typeof subtasks === 'object') {
    if (Object.keys(subtasks).length === 0) {
      console.log("Empty object of subtasks");
      return '';
    }
    
    console.log("Processing object with", Object.keys(subtasks).length, "subtasks");
    return Object.entries(subtasks).map(([key, subtask], index) => {
      // If subtask is just a string, create a simple object
      if (typeof subtask === 'string') {
        subtask = { title: subtask, completed: false };
      }
      
      // Handle different subtask properties for completed status
      const isCompleted = 
        subtask.completed === true || 
        subtask.done === true || 
        subtask.finished === true;
        
      const checkboxImage = isCompleted ? 
        "../assets/images/subtasks_checked.svg" : 
        "../assets/images/subtasks_notchecked.svg";
      
      // Handle different subtask properties for title
      const subtaskTitle = 
        subtask.title || 
        subtask.name || 
        subtask.text || 
        'Untitled Subtask';
        
      return `
        <div class="show-task-subtask" onclick="toggleSubtask('${taskId}', ${index}, this)" data-subtask-index="${index}" data-subtask-key="${key}">
          <img src="${checkboxImage}" alt="checkbox">
          <p>${subtaskTitle}</p>
        </div>
      `;
    }).join('');
  }
  
  console.log("Unexpected subtask format:", typeof subtasks);
  return '';
}


function toggleSubtask(taskId, subtaskIndex, element) {
  console.log("Toggling subtask:", taskId, subtaskIndex);
  
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    console.error("Task not found:", taskId);
    return;
  }
  
  // First determine which property contains the subtasks
  let subtasksContainer = null;
  let subtaskProperty = null;
  
  if (task.task_components) {
    subtasksContainer = task.task_components;
    subtaskProperty = 'task_components';
  } else if (task.subtasks) {
    subtasksContainer = task.subtasks;
    subtaskProperty = 'subtasks';
  } else if (task.components) {
    subtasksContainer = task.components;
    subtaskProperty = 'components';
  } else {
    console.error("No subtasks container found in task:", task);
    return;
  }
  
  console.log("Using subtasks from:", subtaskProperty);
  
  // Handle both array and object formats for subtasks
  let subtask;
  
  if (Array.isArray(subtasksContainer)) {
    // Use direct index access
    if (subtaskIndex >= subtasksContainer.length) {
      console.error(`Subtask index ${subtaskIndex} out of bounds (array length: ${subtasksContainer.length})`);
      return;
    }
    
    subtask = subtasksContainer[subtaskIndex];
    if (!subtask) {
      console.error("Subtask lookup failed for index:", subtaskIndex);
      return;
    }
    
    // Toggle completion
    console.log(`Toggling completion for subtask at index ${subtaskIndex} from`, subtasksContainer[subtaskIndex].completed);
    subtasksContainer[subtaskIndex].completed = !subtasksContainer[subtaskIndex].completed;
    console.log("New completion status:", subtasksContainer[subtaskIndex].completed);
    subtask = subtasksContainer[subtaskIndex];
  } else if (typeof subtasksContainer === 'object') {
    // For objects, we need to get the key from the data attribute
    const subtaskKey = element.getAttribute('data-subtask-key');
    if (!subtaskKey) {
      console.error("No subtask key found in element data attributes");
      return;
    }
    
    subtask = subtasksContainer[subtaskKey];
    if (!subtask) {
      console.error("Subtask not found in object with key:", subtaskKey);
      return;
    }
    
    // Toggle completion
    console.log(`Toggling completion for subtask with key ${subtaskKey} from`, subtasksContainer[subtaskKey].completed);
    subtasksContainer[subtaskKey].completed = !subtasksContainer[subtaskKey].completed;
    console.log("New completion status:", subtasksContainer[subtaskKey].completed);
    subtask = subtasksContainer[subtaskKey];
  } else {
    console.error("Unsupported subtasks container format:", typeof subtasksContainer);
    return;
  }
  
  // Update the UI
  const checkboxImg = element.querySelector('img');
  if (subtask.completed) {
    checkboxImg.src = "../assets/images/subtasks_checked.svg";
  } else {
    checkboxImg.src = "../assets/images/subtasks_notchecked.svg";
  }
  
  // For arrays, send the index
  if (Array.isArray(subtasksContainer)) {
    updateSubtaskStatus(taskId, subtaskProperty, subtaskIndex, subtask.completed);
  } else {
    // For objects, send the key from data attribute
    const subtaskKey = element.getAttribute('data-subtask-key');
    updateSubtaskStatus(taskId, subtaskProperty, subtaskKey, subtask.completed);
  }
}


async function updateSubtaskStatus(taskId, subtaskProperty, subtaskIdentifier, completed) {
  console.log(`Updating subtask status for task ${taskId}, ${subtaskProperty}[${subtaskIdentifier}] = ${completed}`);
  
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    console.error("Error: Task not found");
    return;
  }
  
  // Get the correct subtasks container
  const subtasksContainer = task[subtaskProperty];
  if (!subtasksContainer) {
    console.error(`Error: No ${subtaskProperty} in task`);
    return;
  }
  
  // Handle both array and object formats for subtasks
  let subtask;
  let previousState;
  let subtaskIndex = null;
  let subtaskKey = null;
  
  if (Array.isArray(subtasksContainer)) {
    // For arrays, use direct index access
    subtaskIndex = Number(subtaskIdentifier);
    
    if (isNaN(subtaskIndex) || subtaskIndex < 0 || subtaskIndex >= subtasksContainer.length) {
      console.error(`Invalid array index: ${subtaskIdentifier}`);
      return;
    }
    
    subtask = subtasksContainer[subtaskIndex];
    if (!subtask) {
      console.error(`Subtask not found at index ${subtaskIndex}`);
      return;
    }
    
    previousState = subtask.completed;
    console.log(`Setting subtask completion at index ${subtaskIndex} to ${completed}`);
    // Make a direct update to the subtask object
    subtasksContainer[subtaskIndex] = { 
      ...subtask,
      completed: completed 
    };
  } else {
    // For objects, use the key directly
    subtaskKey = subtaskIdentifier;
    subtask = subtasksContainer[subtaskKey];
    if (!subtask) {
      console.error(`Subtask not found with key ${subtaskKey}`);
      return;
    }
    
    previousState = subtask.completed;
    console.log(`Setting subtask completion with key ${subtaskKey} to ${completed}`);
    // Make a direct update to the subtask object
    subtasksContainer[subtaskKey] = {
      ...subtask,
      completed: completed
    };
  }
  
  // Create a deep copy of the task to avoid reference issues
  const taskCopy = JSON.parse(JSON.stringify(task));
  
  // Update all task cards on the board immediately
  updateTaskOnBoard(taskCopy);
  
  // Update subtask checkbox states in ALL instances in the popup
  updateAllSubtaskCheckboxes(taskCopy, subtaskProperty, subtaskIndex !== null ? subtaskIndex : subtaskKey, completed);
  
  // Update visual indicators in detail view
  const subtasksContainerElement = document.querySelector('.subtasks-container');
  if (subtasksContainerElement) {
    updateSubtaskProgressIndicators(taskCopy);
  }
  
  // Disable page refresh and re-rendering during the API call
  const disableRefresh = true;
  
  try {
    // Create a patch payload that includes the correct subtask property
    const patchPayload = {};
    
    // Deep clone the subtasks container to avoid any reference issues
    patchPayload[subtaskProperty] = JSON.parse(JSON.stringify(taskCopy[subtaskProperty]));
    
    console.log("Sending subtask update to server:", patchPayload);
    
    // Use the whole task update approach
    await apiPatch(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`, patchPayload);
    
    // Only refresh data if we need to
    if (!disableRefresh) {
      // Refresh data from server without disrupting the UI
      const freshData = await fetchTasks(false);
      if (freshData) {
        // Update tasksArray silently
        tasksArray = freshData;
        
        // Find the task in the updated data
        const updatedTask = tasksArray.find(t => t.id == taskId);
        if (updatedTask) {
          // Update UI elements that depend on the task data
          updateTaskCardWithoutReopening(updatedTask);
        }
      }
    }
  } catch (error) {
    console.error("Error updating subtask:", error);
    showErrorNotification("Failed to update subtask. Please try again.");
    
    // Revert the local state
    if (Array.isArray(subtasksContainer)) {
      if (subtaskIndex !== null) {
        subtasksContainer[subtaskIndex].completed = previousState;
      }
    } else if (subtaskKey && subtasksContainer[subtaskKey]) {
      subtasksContainer[subtaskKey].completed = previousState;
    }
    
    // Update UI to reflect the reverted state
    updateTaskOnBoard(task);
    updateAllSubtaskCheckboxes(task, subtaskProperty, subtaskIndex !== null ? subtaskIndex : subtaskKey, previousState);
  }
}

// Helper function to update all checkboxes for a specific subtask
function updateAllSubtaskCheckboxes(task, subtaskProperty, subtaskIdentifier, completed) {
  // Get the corresponding subtask title for matching
  let subtaskTitle = "";
  const subtasksContainer = task[subtaskProperty];
  
  if (Array.isArray(subtasksContainer)) {
    const subtask = subtasksContainer[Number(subtaskIdentifier)];
    if (subtask) {
      subtaskTitle = subtask.title || subtask.name || subtask.text || "";
    }
  } else if (typeof subtasksContainer === 'object') {
    const subtask = subtasksContainer[subtaskIdentifier];
    if (subtask) {
      subtaskTitle = subtask.title || subtask.name || subtask.text || "";
    }
  }
  
  if (!subtaskTitle) return;
  
  // Find all elements showing this subtask and update the checkbox images
  const taskSubtaskElements = document.querySelectorAll('.show-task-subtask');
  for (let i = 0; i < taskSubtaskElements.length; i++) {
    const element = taskSubtaskElements[i];
    const elementText = element.textContent.trim();
    
    if (elementText.includes(subtaskTitle)) {
      const checkboxImg = element.querySelector('img');
      if (checkboxImg) {
        checkboxImg.src = completed 
          ? "../assets/images/subtasks_checked.svg" 
          : "../assets/images/subtasks_notchecked.svg";
      }
    }
  }
}

// Helper function to update a task card without reopening the popup
function updateTaskCardWithoutReopening(task) {
  // Find the task card in the DOM
  const taskCard = document.querySelector(`.task-on-board[data-task-id="${task.id}"]`);
  if (!taskCard) return;
  
  // Update progress bar and other visual elements
  updateTaskOnBoard(task);
  
  // If task popup is open for this task, update subtask checkboxes
  if (!document.getElementById("show-task-layer").classList.contains("d-none")) {
    // Find all subtask checkboxes and update them based on the current state
    const taskSubtaskElements = document.querySelectorAll('.show-task-subtask');
    
    // Try to get subtasks from the task
    let subtasks = getTaskSubtasks(task);
    if (!subtasks) return;
    
    // Match subtasks to their elements by title
    if (Array.isArray(subtasks)) {
      for (let i = 0; i < subtasks.length; i++) {
        const subtask = subtasks[i];
        const title = subtask.title || subtask.name || subtask.text || "";
        
        // Find the corresponding element
        for (let j = 0; j < taskSubtaskElements.length; j++) {
          const element = taskSubtaskElements[j];
          if (element.textContent.trim().includes(title)) {
            // Update the checkbox image
            const checkboxImg = element.querySelector('img');
            if (checkboxImg) {
              checkboxImg.src = subtask.completed
                ? "../assets/images/subtasks_checked.svg"
                : "../assets/images/subtasks_notchecked.svg";
            }
            break;
          }
        }
      }
    } else if (typeof subtasks === 'object') {
      // For object format
      for (const key in subtasks) {
        const subtask = subtasks[key];
        const title = subtask.title || subtask.name || subtask.text || "";
        
        // Find the corresponding element
        for (let j = 0; j < taskSubtaskElements.length; j++) {
          const element = taskSubtaskElements[j];
          if (element.textContent.trim().includes(title)) {
            // Update the checkbox image
            const checkboxImg = element.querySelector('img');
            if (checkboxImg) {
              checkboxImg.src = subtask.completed
                ? "../assets/images/subtasks_checked.svg"
                : "../assets/images/subtasks_notchecked.svg";
            }
            break;
          }
        }
      }
    }
  }
}


// Add a new function to update task on board dynamically
function updateTaskOnBoard(task) {
  const taskCard = document.querySelector(`.task-on-board[data-task-id="${task.id}"]`);
  if (!taskCard) return;
  
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  
  // Get the appropriate subtasks container
  let subtasksContainer = null;
  
  // Try each possible subtasks property
  if (task.task_components && (Array.isArray(task.task_components) || typeof task.task_components === 'object')) {
    subtasksContainer = task.task_components;
  } else if (task.subtasks && (Array.isArray(task.subtasks) || typeof task.subtasks === 'object')) {
    subtasksContainer = task.subtasks;
  } else if (task.components && (Array.isArray(task.components) || typeof task.components === 'object')) {
    subtasksContainer = task.components;
  }
  
  // Calculate subtask progress
  if (subtasksContainer) {
    if (Array.isArray(subtasksContainer)) {
      totalSubtasks = subtasksContainer.length;
      completedSubtasks = subtasksContainer.filter(subtask => subtask.completed).length;
    } else {
      totalSubtasks = Object.keys(subtasksContainer).length;
      completedSubtasks = Object.values(subtasksContainer).filter(subtask => subtask.completed).length;
    }
  }
  
  // Update subtask progress display
  const progressPercentage = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;
  const progressBar = taskCard.querySelector('.progress-bar');
  const progressText = taskCard.querySelector('.task-on-board-subtasks-text');
  
  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
  }
  
  if (progressText) {
    progressText.textContent = `${completedSubtasks}/${totalSubtasks} Subtasks`;
  }
}

function updateSubtaskProgressIndicators(task) {
  if (!task) return;
  
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  
  // Get the appropriate subtasks container
  let subtasksContainer = null;
  
  // Try each possible subtasks property
  if (task.task_components && (Array.isArray(task.task_components) || typeof task.task_components === 'object')) {
    subtasksContainer = task.task_components;
  } else if (task.subtasks && (Array.isArray(task.subtasks) || typeof task.subtasks === 'object')) {
    subtasksContainer = task.subtasks;
  } else if (task.components && (Array.isArray(task.components) || typeof task.components === 'object')) {
    subtasksContainer = task.components;
  }
  
  if (!subtasksContainer) return;
  
  // Handle both array and object formats for subtasks
  if (Array.isArray(subtasksContainer)) {
    totalSubtasks = subtasksContainer.length;
    completedSubtasks = subtasksContainer.filter(subtask => subtask.completed).length;
  } else {
    totalSubtasks = Object.keys(subtasksContainer).length;
    completedSubtasks = Object.values(subtasksContainer).filter(subtask => subtask.completed).length;
  }
  
  const progressPercentage = totalSubtasks === 0 
    ? 0 
    : (completedSubtasks / totalSubtasks) * 100;
  
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


function openAddTask(category) {
  
  sessionStorage.setItem('selectedBoardCategory', category);
  
  
  window.location.href = 'add_task.html';
}


function closeTask() {
  const layer = document.getElementById("show-task-layer");
  layer.classList.add("d-none");
}


function showEditTask(taskId) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    console.error("ERROR: Task not found for ID:", taskId);
    return;
  }

  console.log("Editing task:", task);

  // Find the subtasks in the task
  let subtasks = getTaskSubtasks(task);
  console.log("Subtasks for edit form:", subtasks);
  
  // Get assigned contacts properly
  let assignedContacts = getTaskAssignees(task);
  console.log("Assigned contacts for edit form:", assignedContacts);
  
  // Convert assignees to object format if array
  let contactsObject = {};
  if (assignedContacts) {
    if (Array.isArray(assignedContacts)) {
      assignedContacts.forEach(contact => {
        if (contact && contact.id) {
          contactsObject[contact.id] = {
            name: contact.name || `Contact ${contact.id}`,
            email: contact.email,
            color: contact.color || generateColorForContact(contact.name || `Contact ${contact.id}`)
          };
        }
      });
    } else if (typeof assignedContacts === 'object') {
      contactsObject = assignedContacts;
    }
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
          <input type="hidden" id="edit-subtask-property" value="${getSubtasksPropertyName(task)}">
        </div>
      </div>
      
      <div class="edit-task-section">
        <label>Assigned To</label>
        <div id="edit-contacts-container" class="edit-contacts-container">
          ${generateEditContactsHTML(contactsObject)}
        </div>
      </div>
      
      <div class="edit-task-section">
        <label>Subtasks</label>
        <div id="edit-subtasks-container" class="edit-subtasks-container">
          ${generateEditSubtasksHTML(subtasks)}
        </div>
        <div class="edit-subtask-add">
          <input type="text" id="new-subtask-input" placeholder="Add new subtask">
          <button type="button" onclick="addSubtaskToEdit()">+</button>
        </div>
        <div id="subtask-counter" class="subtask-counter"></div>
      </div>
      
      <div class="edit-task-buttons">
        <button type="button" class="cancel-btn" onclick="closeTask()">Cancel</button>
        <button type="submit" class="save-btn">Save</button>
      </div>
    </form>
  `;
  
  addEditTaskStyles();
  
  // Update subtask counter
  updateSubtaskCounter();
}

function getSubtasksPropertyName(task) {
  if (task.task_components && (Array.isArray(task.task_components) || typeof task.task_components === 'object')) {
    return 'task_components';
  } else if (task.subtasks && (Array.isArray(task.subtasks) || typeof task.subtasks === 'object')) {
    return 'subtasks';
  } else if (task.components && (Array.isArray(task.components) || typeof task.components === 'object')) {
    return 'components';
  }
  return 'subtasks'; // default
}


function addEditTaskStyles() {
  // Skip if already added
  if (document.getElementById('edit-task-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'edit-task-styles';
  styleElement.textContent = `
    /* Fix for the overall task popup layout */
    .add-contact-layer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    /* Fix the inner layer to have a proper width */
    #show-task-inner-layer {
      width: 100%;
      max-width: 700px !important; /* Increased width for better visibility */
      min-width: 320px;
      box-sizing: border-box;
      overflow-x: hidden;
      padding: 35px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
      max-height: 90vh;
      overflow-y: auto;
      margin: 20px;
    }
    
    #edit-task-form {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 28px; /* Add more spacing between form sections */
    }
    
    /* Make sure the first row is properly contained */
    .show-task-firstrow {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 20px;
    }
    
    /* Responsive layout for priority buttons */
    .edit-priority-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      width: 100%;
      box-sizing: border-box;
    }
    
    .edit-task-section {
      margin-bottom: 0; /* Removed since we're using gap in the form */
      width: 100%;
      box-sizing: border-box;
    }
    
    .edit-task-section label {
      display: block;
      margin-bottom: 14px;
      font-weight: bold;
      font-size: 17px;
      color: #2A3647;
    }
    
    .edit-task-section input[type="text"],
    .edit-task-section input[type="date"],
    .edit-task-section textarea {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #D1D1D1;
      border-radius: 10px;
      box-sizing: border-box;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }
    
    .edit-task-section input[type="text"]:focus,
    .edit-task-section input[type="date"]:focus,
    .edit-task-section textarea:focus {
      outline: none;
      border-color: #29ABE2;
      box-shadow: 0 0 8px rgba(41, 171, 226, 0.5);
      transform: translateY(-1px);
    }
    
    .edit-task-section textarea {
      min-height: 120px;
      resize: vertical;
    }
    
    .priority-btn {
      flex: 1;
      min-width: 110px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border: 2px solid #D1D1D1;
      border-radius: 10px;
      background: white;
      cursor: pointer;
      box-sizing: border-box;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .priority-btn:hover {
      border-color: #29ABE2;
      box-shadow: 0 3px 8px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }
    
    .priority-btn.active {
      color: white;
      font-weight: bold;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    
    #edit-high-btn.active {
      background-color: #FF3D00;
      border-color: #FF3D00;
    }
    
    #edit-medium-btn.active {
      background-color: #FFA800;
      border-color: #FFA800;
    }
    
    #edit-low-btn.active {
      background-color: #7AE229;
      border-color: #7AE229;
    }
    
    .edit-contacts-container,
    .edit-subtasks-container {
      margin-bottom: 15px;
      width: 100%;
      box-sizing: border-box;
      max-height: 280px;
      overflow-y: auto;
      border-radius: 10px;
      border: 1px solid #E6E6E6;
      padding: 15px;
      background-color: #f9f9f9;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
    }
    
    .edit-contact-item,
    .edit-subtask-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 10px;
      background-color: white;
      border-radius: 10px;
      width: 100%;
      box-sizing: border-box;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      border: 1px solid #EFEFEF;
      transition: all 0.2s ease;
    }
    
    .edit-contact-item:hover,
    .edit-subtask-item:hover {
      background-color: #F6F7F8;
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(0,0,0,0.08);
    }
    
    .edit-contact-item input[type="checkbox"] {
      margin-right: 15px;
      min-width: 20px;
      height: 20px;
      accent-color: #2A3647;
      cursor: pointer;
    }
    
    .edit-contact-item label {
      cursor: pointer;
      font-weight: normal !important;
      margin-bottom: 0 !important;
      font-size: 15px !important;
    }
    
    .edit-subtask-item {
      justify-content: space-between;
    }
    
    .subtask-content {
      display: flex;
      align-items: center;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .subtask-content input[type="checkbox"] {
      margin-right: 15px;
      min-width: 20px;
      height: 20px;
      accent-color: #2A3647;
      cursor: pointer;
    }
    
    .subtask-content label {
      cursor: pointer;
      font-weight: normal !important;
      margin-bottom: 0 !important;
      font-size: 15px !important;
    }
    
    .edit-subtask-add {
      display: flex;
      gap: 10px;
      width: 100%;
      box-sizing: border-box;
      margin-top: 18px;
    }
    
    .edit-subtask-add input {
      flex: 1;
      padding: 14px 16px;
      border: 1px solid #D1D1D1;
      border-radius: 10px;
      box-sizing: border-box;
      font-size: 16px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }
    
    .edit-subtask-add input:focus {
      outline: none;
      border-color: #29ABE2;
      box-shadow: 0 0 8px rgba(41, 171, 226, 0.5);
      transform: translateY(-1px);
    }
    
    .edit-subtask-add button {
      padding: 14px 18px;
      background-color: #2A3647;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      min-width: 52px;
      box-sizing: border-box;
      font-size: 20px;
      font-weight: bold;
      transition: all 0.2s ease;
      box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    }
    
    .edit-subtask-add button:hover {
      background-color: #0038FF;
      transform: translateY(-2px);
      box-shadow: 0 5px 12px rgba(0,0,0,0.3);
    }
    
    .delete-subtask-btn {
      background: none;
      border: none;
      color: #2A3647;
      cursor: pointer;
      padding: 6px 10px;
      font-size: 18px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    
    .delete-subtask-btn:hover {
      color: #FF3D00;
      background-color: rgba(255, 61, 0, 0.1);
      transform: scale(1.1);
    }
    
    .edit-task-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 24px;
      margin-top: 40px;
      width: 100%;
      box-sizing: border-box;
      border-top: 1px solid #E6E6E6;
      padding-top: 24px;
    }
    
    .cancel-btn,
    .save-btn {
      padding: 16px 30px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      min-width: 140px;
      transition: all 0.2s ease;
      box-shadow: 0 3px 8px rgba(0,0,0,0.15);
      text-align: center;
    }
    
    .cancel-btn {
      background-color: white;
      border: 2px solid #2A3647;
      color: #2A3647;
    }
    
    .cancel-btn:hover {
      background-color: rgba(42, 54, 71, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 5px 12px rgba(0,0,0,0.2);
    }
    
    .save-btn {
      background-color: #2A3647;
      border: 2px solid #2A3647;
      color: white;
    }
    
    .save-btn:hover {
      background-color: #0038FF;
      border-color: #0038FF;
      transform: translateY(-2px);
      box-shadow: 0 5px 12px rgba(0,56,255,0.3);
    }
    
    /* Additional style for subtask counter */
    .subtask-counter {
      margin-top: 12px;
      font-size: 14px;
      color: #6E7180;
      background-color: #F6F7F8;
      display: inline-block;
      padding: 8px 14px;
      border-radius: 20px;
      border: 1px solid #E6E6E6;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .subtask-counter:before {
      content: "Subtasks: ";
      font-weight: bold;
    }
    
    /* Style for the unassigned contacts divider */
    .unassigned-contacts-divider {
      margin: 20px 0 16px;
      padding: 10px 0;
      font-weight: bold;
      color: #2A3647;
      border-top: 1px solid #E6E6E6;
      font-size: 15px;
    }
    
    /* Break long labels */
    label {
      word-break: break-word;
    }
    
    /* Ensure close button in modal is clickable and visible */
    .show-task-close {
      cursor: pointer;
      padding: 8px;
      margin: -8px; /* Expands the clickable area */
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .show-task-close:hover {
      background-color: rgba(0,0,0,0.05);
    }
    
    .show-task-close img {
      width: 26px;
      height: 26px;
    }
    
    /* Task category styling */
    .task-on-board-category {
      padding: 6px 16px;
      border-radius: 10px;
      display: inline-block;
      font-size: 15px;
      font-weight: 500;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .technical-task {
      background-color: #0038FF;
      color: white;
    }
    
    .user-story {
      background-color: #1FD7C1;
      color: white;
    }
    
    /* No items placeholders */
    .no-subtasks, .no-contacts {
      text-align: center;
      padding: 20px;
      color: #6E7180;
      font-style: italic;
    }
    
    /* Scrollbar styling */
    .edit-contacts-container::-webkit-scrollbar,
    .edit-subtasks-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .edit-contacts-container::-webkit-scrollbar-track,
    .edit-subtasks-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    
    .edit-contacts-container::-webkit-scrollbar-thumb,
    .edit-subtasks-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 10px;
    }
    
    .edit-contacts-container::-webkit-scrollbar-thumb:hover,
    .edit-subtasks-container::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    
    /* Focus indicators for accessibility */
    input:focus, button:focus, textarea:focus {
      outline: 2px solid #29ABE2;
      outline-offset: 2px;
    }
    
    /* Responsive adjustments for small screens */
    @media (max-width: 600px) {
      #show-task-inner-layer {
        padding: 20px;
        margin: 15px;
        max-width: 95% !important;
      }
      
      .edit-task-buttons {
        flex-direction: column-reverse;
        gap: 12px;
      }
      
      .cancel-btn, .save-btn {
        width: 100%;
        padding: 14px;
      }
      
      .edit-priority-buttons {
        flex-direction: column;
      }
      
      .priority-btn {
        width: 100%;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}


function generateEditContactsHTML(contacts) {
  console.log("Generating edit contacts HTML with:", contacts);
  
  // Handle empty or null contacts
  if (!contacts || 
      (Array.isArray(contacts) && contacts.length === 0) || 
      (typeof contacts === 'object' && Object.keys(contacts).length === 0)) {
    return '<div class="no-contacts">No contacts assigned</div>';
  }
  
  // Handle array of contacts
  if (Array.isArray(contacts)) {
    const contactsHTML = contacts.map(contact => {
      // Skip if missing id or name
      if (!contact || !contact.id) return '';
      
      const name = contact.name || `Contact ${contact.id}`;
      return `
        <div class="edit-contact-item">
          <input type="checkbox" id="edit-contact-${contact.id}" data-contact-id="${contact.id}" checked>
          <label for="edit-contact-${contact.id}">${name}</label>
        </div>
      `;
    }).join('');
    
    // Convert array to object for generateUnassignedContactsHTML
    const contactsObj = {};
    contacts.forEach(contact => {
      if (contact && contact.id) {
        contactsObj[contact.id] = contact;
      }
    });
    
    return contactsHTML + generateUnassignedContactsHTML(contactsObj);
  }
  
  // Handle object of contacts
  return Object.entries(contacts).map(([id, contact]) => {
    // Handle plain ID references
    if (!contact || typeof contact !== 'object') {
      // Find the contact in contactsArray
      const contactObj = contactsArray.find(c => c.id == id);
      if (!contactObj) {
        return `
          <div class="edit-contact-item">
            <input type="checkbox" id="edit-contact-${id}" data-contact-id="${id}" checked>
            <label for="edit-contact-${id}">Contact ${id}</label>
          </div>
        `;
      }
      
      return `
        <div class="edit-contact-item">
          <input type="checkbox" id="edit-contact-${id}" data-contact-id="${id}" checked>
          <label for="edit-contact-${id}">${contactObj.name}</label>
        </div>
      `;
    }
    
    // Handle contact object
    return `
      <div class="edit-contact-item">
        <input type="checkbox" id="edit-contact-${id}" data-contact-id="${id}" checked>
        <label for="edit-contact-${id}">${contact.name || `Contact ${id}`}</label>
      </div>
    `;
  }).join('') + generateUnassignedContactsHTML(contacts);
}


function generateUnassignedContactsHTML(assignedContacts) {
  // Convert assigned IDs to strings for comparison
  const assignedIds = Object.keys(assignedContacts).map(id => id.toString());
  
  // Filter contacts to find unassigned ones
  const unassignedContacts = contactsArray.filter(contact => {
    if (!contact || !contact.id) return false;
    return !assignedIds.includes(contact.id.toString());
  });
  
  if (unassignedContacts.length === 0) return '';
  
  const unassignedHTML = unassignedContacts.map(contact => {
    if (!contact || !contact.id) return '';
    return `
      <div class="edit-contact-item">
        <input type="checkbox" id="edit-contact-${contact.id}" data-contact-id="${contact.id}">
        <label for="edit-contact-${contact.id}">${contact.name || `Contact ${contact.id}`}</label>
      </div>
    `;
  }).join('');
  
  if (!unassignedHTML) return '';
  
  return `
    <div class="unassigned-contacts-divider">Other contacts</div>
    ${unassignedHTML}
  `;
}


function generateEditSubtasksHTML(subtasks) {
  console.log("Generating edit subtasks HTML with:", subtasks);
  
  if (!subtasks || 
      (Array.isArray(subtasks) && subtasks.length === 0) || 
      (typeof subtasks === 'object' && Object.keys(subtasks).length === 0)) {
    return '<div class="no-subtasks">No subtasks created</div>';
  }
  
  // Handle array format
  if (Array.isArray(subtasks)) {
    return subtasks.map((subtask, index) => {
      // Handle different subtask properties for completed status
      const isCompleted = 
        subtask.completed === true || 
        subtask.done === true || 
        subtask.finished === true;
        
      // Handle different subtask properties for title
      const subtaskTitle = 
        subtask.title || 
        subtask.name || 
        subtask.text || 
        'Untitled Subtask';
      
      // Mark this as an existing subtask (not a new one)
      return `
        <div class="edit-subtask-item" data-subtask-key="subtask-${index}" data-subtask-index="${index}" data-is-new="false">
          <div class="subtask-content">
            <input type="checkbox" id="edit-subtask-${index}" ${isCompleted ? 'checked' : ''}>
            <label for="edit-subtask-${index}">${subtaskTitle}</label>
          </div>
          <button type="button" class="delete-subtask-btn" onclick="removeSubtaskFromEdit('subtask-${index}')">✕</button>
        </div>
      `;
    }).join('');
  }
  // Handle object format
  else if (typeof subtasks === 'object') {
    return Object.entries(subtasks).map(([key, subtask], index) => {
      // If subtask is just a string, create a simple object
      if (typeof subtask === 'string') {
        subtask = { title: subtask, completed: false };
      }
      
      // Handle different subtask properties for completed status
      const isCompleted = 
        subtask.completed === true || 
        subtask.done === true || 
        subtask.finished === true;
        
      // Handle different subtask properties for title
      const subtaskTitle = 
        subtask.title || 
        subtask.name || 
        subtask.text || 
        'Untitled Subtask';
      
      // Mark this as an existing subtask (not a new one)
      return `
        <div class="edit-subtask-item" data-subtask-key="${key}" data-subtask-index="${index}" data-is-new="false">
          <div class="subtask-content">
            <input type="checkbox" id="edit-subtask-${key}" ${isCompleted ? 'checked' : ''}>
            <label for="edit-subtask-${key}">${subtaskTitle}</label>
          </div>
          <button type="button" class="delete-subtask-btn" onclick="removeSubtaskFromEdit('${key}')">✕</button>
        </div>
      `;
    }).join('');
  }
  
  return '<div class="no-subtasks">No subtasks created</div>';
}


function setEditPriority(priority) {
  
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.classList.remove('active');
    
    
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
  
  
  const activeButton = document.getElementById(`edit-${priority === 'urgent' ? 'high' : priority}-btn`);
  if (activeButton) {
    activeButton.classList.add('active');
    
    
    const img = activeButton.querySelector('img');
    if (img) {
      img.src = `../assets/images/${priority === 'urgent' ? 'high' : priority}-white.svg`;
    }
  }
  
  
  document.getElementById('edit-priority').value = priority;
}


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
  const subtaskIndex = container.querySelectorAll('.edit-subtask-item').length;
  
  // Add a data attribute to indicate this is a new subtask
  const subtaskHTML = `
    <div class="edit-subtask-item" data-subtask-key="${newKey}" data-is-new="true" data-subtask-index="${subtaskIndex}">
      <div class="subtask-content">
        <input type="checkbox" id="edit-subtask-${newKey}">
        <label for="edit-subtask-${newKey}">${title}</label>
      </div>
      <button type="button" class="delete-subtask-btn" onclick="removeSubtaskFromEdit('${newKey}')">✕</button>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', subtaskHTML);
  
  // Clear the input field and focus it for easy addition of multiple subtasks
  input.value = '';
  input.focus();
  
  // Update a counter to reflect the total number of subtasks for UI feedback
  updateSubtaskCounter();
  
  console.log(`Added new subtask: "${title}" with key ${newKey} and index ${subtaskIndex}`);
}

// Helper function to update the subtask counter in the UI
function updateSubtaskCounter() {
  const container = document.getElementById('edit-subtasks-container');
  const subtaskCount = container.querySelectorAll('.edit-subtask-item').length;
  
  // Update a counter if it exists
  const counter = document.getElementById('subtask-counter');
  if (counter) {
    counter.textContent = subtaskCount;
  }
}


function removeSubtaskFromEdit(key) {
  const subtaskItem = document.querySelector(`.edit-subtask-item[data-subtask-key="${key}"]`);
  
  if (subtaskItem) {
    // Log what we're removing
    const label = subtaskItem.querySelector('label');
    const title = label ? label.textContent.trim() : 'unknown';
    console.log(`Removing subtask "${title}" with key ${key}`);
    
    // Remove the element from the DOM
    subtaskItem.remove();
    
    // Update the container if no subtasks remain
    const container = document.getElementById('edit-subtasks-container');
    if (!container.querySelector('.edit-subtask-item')) {
      container.innerHTML = '<div class="no-subtasks">No subtasks created</div>';
    }
    
    // Update the counter
    updateSubtaskCounter();
  }
}


async function saveEditedTask(taskId) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    console.error("ERROR: Task not found for ID:", taskId);
    return;
  }
  
  // Show loading indicator
  showLoadingIndicator();
  
  const title = document.getElementById('edit-title').value;
  const description = document.getElementById('edit-description').value;
  const dueDate = document.getElementById('edit-due-date').value;
  const priority = document.getElementById('edit-priority').value;
  
  // Get the subtasks property name from the hidden field
  const subtaskProperty = document.getElementById('edit-subtask-property').value || 'subtasks';
  console.log("Using subtask property:", subtaskProperty);
  
  // Collect selected contacts
  const selectedContactIds = [];
  document.querySelectorAll('.edit-contact-item input[type="checkbox"]:checked').forEach(checkbox => {
    selectedContactIds.push(checkbox.dataset.contactId);
  });
  
  // Create updated contacts object
  const updatedContacts = {};
  selectedContactIds.forEach(id => {
    const contact = contactsArray.find(c => c.id == id);
    if (contact) {
      updatedContacts[id] = {
        name: contact.name,
        email: contact.email || `contact${id}@example.com`
      };
    } else if (task.contacts && task.contacts[id]) {
      // Keep existing contact data if not found in contactsArray
      updatedContacts[id] = task.contacts[id];
    }
  });
  
  // Process subtasks - handle based on original format (array or object)
  let subtasksArray = [];
  let subtasksObject = {};
  
  // Collect all subtasks from the edit form
  const subtaskElements = document.querySelectorAll('.edit-subtask-item');
  console.log(`Found ${subtaskElements.length} subtask elements in the form`);
  
  // Debug what subtasks are in the DOM
  subtaskElements.forEach((item, index) => {
    const label = item.querySelector('label');
    const isNew = item.dataset.isNew === "true";
    const key = item.dataset.subtaskKey;
    console.log(`Subtask ${index}: "${label ? label.textContent : 'no label'}", isNew: ${isNew}, key: ${key}`);
  });
  
  subtaskElements.forEach((item, index) => {
    const key = item.dataset.subtaskKey;
    const isNew = item.dataset.isNew === "true";
    const subtaskIndex = item.dataset.subtaskIndex;
    const checkbox = item.querySelector('input[type="checkbox"]');
    const label = item.querySelector('label');
    
    if (label) {
      const title = label.textContent.trim();
      console.log(`Processing subtask: "${title}", isNew: ${isNew}, key: ${key}, index: ${subtaskIndex}`);
      
      // Create clean subtask object with only necessary properties
      const subtask = {
        title: title,
        completed: checkbox ? checkbox.checked : false,
      };
      
      // Add optional properties needed for proper API handling
      if (!isNew && subtaskIndex) {
        subtask.id = parseInt(subtaskIndex);
      }
      
      // Always add to array for consistent API format
      subtasksArray.push(subtask);
      
      // Also maintain object format for backwards compatibility
      if (isNew) {
        // For new subtasks, create a guaranteed unique key
        const uniqueKey = `new_subtask_${Date.now()}_${index}`;
        subtasksObject[uniqueKey] = subtask;
      } else {
        // For existing subtasks, preserve their original key
        const objectKey = key || `subtask_${index}`;
        subtasksObject[objectKey] = subtask;
      }
    }
  });
  
  console.log("Collected subtasks - Array:", subtasksArray);
  console.log("Collected subtasks - Object:", subtasksObject);
  
  // The server expects subtasks in a field called "subtasks" when updating a task
  // From the server code, we can see it processes subtasks on task update
  
  // Collect subtasks in the format expected by the server
  const formattedSubtasks = subtasksArray.map(subtask => {
    return {
      title: subtask.title,
      completed: subtask.completed
    };
  });
  
  console.log("Formatted subtasks for server:", formattedSubtasks);
  
  // This is what we'll send to the API
  let updatedSubtasks = formattedSubtasks;
  
  // If we have no subtasks, handle it properly
  if (formattedSubtasks.length === 0) {
    updatedSubtasks = [];
  }
  
  // Update local task data
  task.title = title;
  task.description = description;
  task.due_date = dueDate;
  task.priority = priority;
  task.contacts = updatedContacts;
  
  // Update the correct subtasks property
  task[subtaskProperty] = updatedSubtasks;
  
  try {
    // Create a complete payload with all required properties
    const apiPayload = {
      title,
      description,
      due_date: dueDate,
      priority,
      board_category: task.board_category, // Include the current board category
      task_category: task.task_category,   // Include the task category (if any)
      icon: task.icon || null               // Include any icon (if any)
    };
    
    // Based on the server code, it specifically looks for "subtasks" field
    apiPayload.subtasks = updatedSubtasks;
    
    // Add the contacts in a way that will work with the API
    apiPayload.contacts = updatedContacts;
    
    // Also include any assigned_members or member_assignments if present
    if (task.assigned_members) {
      apiPayload.assigned_members = task.assigned_members;
    }
    if (task.member_assignments) {
      apiPayload.member_assignments = selectedContactIds; // Use the updated IDs
    }
    
    console.log("Sending API update with payload:", apiPayload);
    
    // Send update to API - the server will handle subtasks with the main task update
    const response = await apiPatch(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`, apiPayload);
    console.log("Task API update response:", response);
    
    if (!response) {
      throw new Error("No response from server");
    }
    
    // Fetch the updated task to make sure we have the latest state
    const updatedTaskWithComponents = await apiGet(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`);
    console.log("Refreshed task data with components:", updatedTaskWithComponents);
    
    // Update task in local array with the updated task data that includes the subtasks
    const taskIndex = tasksArray.findIndex(t => t.id == taskId);
    if (taskIndex !== -1) {
      // If we got the updated task with components, use it
      if (updatedTaskWithComponents && updatedTaskWithComponents.id) {
        tasksArray[taskIndex] = updatedTaskWithComponents;
      } 
      // Otherwise, use the response from the initial task update
      else if (response && response.id) {
        tasksArray[taskIndex] = response;
      }
      // Last resort: update our local copy manually
      else {
        tasksArray[taskIndex] = {
          ...task,
          title,
          description,
          due_date: dueDate,
          priority,
          contacts: updatedContacts,
          [subtaskProperty]: updatedSubtasks
        };
      }
    }
    
    // Update the UI
    createTaskOnBoard();
    closeTask();
    
    // Show success message
    showSuccessNotification("Task and subtasks updated successfully");
    
    // Fetch fresh data from server to ensure we have the latest state
    await fetchTasks();
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    // Refresh the board with the latest data
    createTaskOnBoard();
    checkAndAddNoTask();
  } catch (err) {
    console.error("API update failed:", err);
    showErrorNotification("Could not save task changes. Please try again later.");
    hideLoadingIndicator();
  }
}


async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }
  
  try {
    
    showLoadingIndicator();
    
    
    const taskIndex = tasksArray.findIndex(t => t.id == taskId);
    let removedTask = null;
    
    if (taskIndex !== -1) {
      
      removedTask = { ...tasksArray[taskIndex] };
      
      
      tasksArray.splice(taskIndex, 1);
      
      
      closeTask();
      createTaskOnBoard();
      checkAndAddNoTask();
    } else {
      console.error("Task not found in array:", taskId);
      showErrorNotification("Task not found");
      hideLoadingIndicator();
      return;
    }
    
    
    // Always use the API - no localStorage fallback
    
    
    await apiDelete(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`);
    
    
    await fetchTasks();
    createTaskOnBoard();
    checkAndAddNoTask();
    
    
    showSuccessNotification("Task deleted successfully");
  } catch (error) {
    console.error("Error deleting task:", error);
    
    
    if (typeof handleApiError === 'function') {
      const errorInfo = handleApiError(error);
      showErrorNotification(`Failed to delete task: ${errorInfo.message}`);
    } else {
      showErrorNotification("Failed to delete task. Please try again.");
    }
    
    
    const taskIndex = tasksArray.findIndex(t => t.id == taskId);
    if (taskIndex === -1 && removedTask) {
      tasksArray.push(removedTask);
      createTaskOnBoard();
      checkAndAddNoTask();
    }
  } finally {
    
    hideLoadingIndicator();
  }
}


function showSuccessNotification(message, duration = 3000) {
  
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
  
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);
  
  
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
  
  
  container.appendChild(notification);
  
  
  setTimeout(() => {
    notification.remove();
  }, duration);
}


function toggleUserPanel() {
  const userPanel = document.getElementById('user-panel');
  if (userPanel) {
    userPanel.classList.toggle('hidden');
  }
}


function terminateSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  sessionStorage.clear();
  window.location.href = 'index.html';
}
