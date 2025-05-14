


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


async function boardInit() {
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


async function fetchTasks() {
  try {
    // Get tasks from the API
    const response = await apiGet(API_CONFIG.ENDPOINTS.TASKS);
    
    if (!response) {
      throw new Error("No data received from API");
    }
    
    console.log("Tasks from API:", response);
    
    // Process the tasks from the API response
    tasksData = response;
    tasksArray = Array.isArray(response) ? response : Object.values(response);
    tasksKeys = Object.keys(tasksData);
    
    return tasksArray;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    showErrorNotification("Could not load tasks from the server. Please try again later.");
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
  
  
  if (!task.subtasks || Object.keys(task.subtasks).length === 0) {
    document.getElementById("subtasks-section-heading").classList.add("d-none");
  }
  
  if (!task.contacts || Object.keys(task.contacts).length === 0) {
    document.getElementById("assignees-section-heading").classList.add("d-none");
  }
}


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


function toggleSubtask(taskId, subtaskKey, element) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task || !task.subtasks || !task.subtasks[subtaskKey]) {
    return;
  }
  
  
  task.subtasks[subtaskKey].completed = !task.subtasks[subtaskKey].completed;
  
  
  const checkboxImg = element.querySelector('img');
  if (task.subtasks[subtaskKey].completed) {
    checkboxImg.src = "../assets/images/subtasks_checked.svg";
  } else {
    checkboxImg.src = "../assets/images/subtasks_notchecked.svg";
  }
  
  
  updateSubtaskStatus(taskId, subtaskKey, task.subtasks[subtaskKey].completed);
}


async function updateSubtaskStatus(taskId, subtaskKey, completed) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task || !task.subtasks || !task.subtasks[subtaskKey]) {
    console.error("Error: Task or subtask not found");
    return;
  }
  
  
  const previousState = task.subtasks[subtaskKey].completed;
  task.subtasks[subtaskKey].completed = completed;
  
  
  const subtasksContainer = document.querySelector('.subtasks-container');
  if (subtasksContainer) {
    
    updateSubtaskProgressIndicators(task);
  }
  
  
  // Always use the API - we no longer support localStorage fallback
  
  try {
    
    await apiPatch(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/subtasks/${subtaskKey}/`, {
      completed
    });
    
    
    await fetchTasks();
    
    
    if (document.getElementById("show-task-layer").classList.contains("d-none")) {
      
      createTaskOnBoard();
    } else {
      
      openTask(taskId);
    }
  } catch (error) {
    
    handleApiError(error, () => {
      showErrorNotification("Failed to update subtask. Please try again.");
      
      
      if (task && task.subtasks && task.subtasks[subtaskKey] !== undefined) {
        task.subtasks[subtaskKey].completed = previousState;
        
        
        if (document.getElementById("show-task-layer").classList.contains("d-none")) {
          createTaskOnBoard();
        } else {
          
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


function updateSubtaskProgressIndicators(task) {
  if (!task || !task.subtasks) return;
  
  const subtasks = task.subtasks || {};
  const totalSubtasks = Object.keys(subtasks).length;
  const completedSubtasks = Object.values(subtasks)
    .filter(subtask => subtask.completed).length;
  
  
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
  
  
  addEditTaskStyles();
}


function addEditTaskStyles() {
  
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


function removeSubtaskFromEdit(key) {
  const subtaskItem = document.querySelector(`.edit-subtask-item[data-subtask-key="${key}"]`);
  
  if (subtaskItem) {
    subtaskItem.remove();
    
    
    const container = document.getElementById('edit-subtasks-container');
    if (!container.querySelector('.edit-subtask-item')) {
      container.innerHTML = '<div class="no-subtasks">No subtasks created</div>';
    }
  }
}


function saveEditedTask(taskId) {
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    console.error("ERROR: Task not found for ID:", taskId);
    return;
  }
  
  
  const title = document.getElementById('edit-title').value;
  const description = document.getElementById('edit-description').value;
  const dueDate = document.getElementById('edit-due-date').value;
  const priority = document.getElementById('edit-priority').value;
  
  
  const selectedContactIds = [];
  document.querySelectorAll('.edit-contact-item input[type="checkbox"]:checked').forEach(checkbox => {
    selectedContactIds.push(checkbox.dataset.contactId);
  });
  
  
  const updatedContacts = {};
  selectedContactIds.forEach(id => {
    const contact = contactsArray.find(c => c.id == id);
    if (contact) {
      updatedContacts[id] = {
        name: contact.name,
        email: contact.email || `contact${id}@example.com`
      };
    } else if (task.contacts && task.contacts[id]) {
      
      updatedContacts[id] = task.contacts[id];
    }
  });
  
  
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
  
  
  task.title = title;
  task.description = description;
  task.due_date = dueDate;
  task.priority = priority;
  task.contacts = updatedContacts;
  task.subtasks = updatedSubtasks;
  
  
  try {
    // Always use the API
    apiPatch(`${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`, {
      title,
      description,
      due_date: dueDate,
      priority,
      contacts: updatedContacts,
      subtasks: updatedSubtasks
    });
  } catch (err) {
    console.error("API update failed:", err);
    showErrorNotification("Could not save task changes. Please try again later.");
  }
  
  
  createTaskOnBoard();
  closeTask();
  
  
  showSuccessNotification("Task updated successfully");
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
