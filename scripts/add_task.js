
// Define variables only if they don't already exist
if (typeof window.subtasks === 'undefined') {
  let subtasks = [];
  window.subtasks = subtasks;
}

if (typeof window.contactSelections === 'undefined') {
  let contactSelections = {};
  window.contactSelections = contactSelections;
}

if (typeof window.currentPriority === 'undefined') {
  let currentPriority = 'medium';
  window.currentPriority = currentPriority;
}


async function initializeTaskCreation() {
  try {
    createUserProfile();
    applyDefaultPriority();
    await fetchContacts();
    setupEventListeners();
    configureDateRestrictions();
    
    
    if (window.contactsArray && window.contactsArray.length > 0) {
      console.log("Initializing contact selection with:", window.contactsArray.length, "contacts");
      renderContactList();
    }
  } catch (error) {
    console.error('Error initializing task creation:', error);
  }
}


function createUserProfile() {
  const userProfile = document.getElementById('user-profile');
  if (!userProfile) return;
  
  const userName = localStorage.getItem('userName') || 'Guest User';
  const initials = getInitials(userName);
  
  userProfile.textContent = initials;
  userProfile.style.backgroundColor = generateUserColor(userName);
}


function getInitials(name) {
  if (!name) return '?';
  
  const words = name.split(' ').filter(word => word.length > 0);
  if (words.length === 0) return '?';
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}


function generateUserColor(name) {
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


async function fetchContacts() {
  try {
    console.log('Fetching contacts for task assignment...');
    
    
    const response = await apiGet(API_CONFIG.ENDPOINTS.CONTACTS);
    console.log('Contacts API response:', response);
    
    
    if (response) {
      if (Array.isArray(response)) {
        window.contactsArray = response;
      } else if (typeof response === 'object') {
        
        if (Object.keys(response).every(key => !isNaN(parseInt(key)))) {
          window.contactsArray = Object.values(response);
        } else {
          window.contactsArray = [response]; 
        }
      } else {
        window.contactsArray = [];
      }
    } else {
      window.contactsArray = [];
    }
    
    console.log('Processed contacts array:', window.contactsArray);
    
    
    if (window.contactsArray.length > 0 && typeof window.renderContactList === 'function') {
      window.renderContactList();
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    
    if (typeof showErrorNotification === 'function') {
      showErrorNotification('Failed to load contacts');
    }
    window.contactsArray = [];
  }
}


function setupEventListeners() {
  
  document.addEventListener('click', function(event) {
    const contactPanel = document.getElementById('contact-selector-panel');
    const categorySelector = document.getElementById('category-selector');
    
    
    if (contactPanel && !contactPanel.contains(event.target) && 
        !event.target.closest('#contact-input-container')) {
      contactPanel.classList.add('hidden');
    }
    
    
    if (categorySelector && !categorySelector.contains(event.target) &&
        !event.target.closest('.dropdownSelector')) {
      categorySelector.classList.add('hidden');
    }
  });
  
  
  window.addEventListener('resize', adjustForMobileView);
  adjustForMobileView();
}


function adjustForMobileView() {
  const mobileThreshold = 581;
  const isMobile = window.innerWidth < mobileThreshold;
  
  const mobileNotice = document.querySelector('.requiredNoticeMobile');
  const desktopNotice = document.querySelector('.requiredNotice');
  const mobileActionBar = document.querySelector('.mobileActionBar');
  const desktopActions = document.querySelector('.actionsContainer');
  
  if (isMobile) {
    mobileNotice.classList.remove('hidden');
    mobileActionBar.classList.remove('hidden');
    desktopActions.classList.add('hidden');
    desktopNotice.classList.add('hidden');
  } else {
    mobileNotice.classList.add('hidden');
    mobileActionBar.classList.add('hidden');
    desktopActions.classList.remove('hidden');
    desktopNotice.classList.remove('hidden');
  }
}


function toggleUserPanel() {
  const userPanel = document.getElementById('user-panel');
  userPanel.classList.toggle('hidden');
}




function applyDefaultPriority() {
  document.getElementById('mediumPriorityBtn').classList.add('priorityMediumActive');
  document.getElementById('mediumPriorityIcon').src = '../assets/images/medium-white.svg';
  currentPriority = 'medium';
}


function selectHighPriority() {
  
  resetPriorityButtons();
  
  
  document.getElementById('highPriorityBtn').classList.add('priorityHighActive');
  document.getElementById('highPriorityIcon').src = '../assets/images/high-white.svg';
  currentPriority = 'urgent';
}


function selectMediumPriority() {
  
  resetPriorityButtons();
  
  
  document.getElementById('mediumPriorityBtn').classList.add('priorityMediumActive');
  document.getElementById('mediumPriorityIcon').src = '../assets/images/medium-white.svg';
  currentPriority = 'medium';
}


function selectLowPriority() {
  
  resetPriorityButtons();
  
  
  document.getElementById('lowPriorityBtn').classList.add('priorityLowActive');
  document.getElementById('lowPriorityIcon').src = '../assets/images/low-white.svg';
  currentPriority = 'low';
}


function getActivePriority() {
  return currentPriority;
}


function resetPriorityButtons() {
  
  document.getElementById('highPriorityBtn').classList.remove('priorityHighActive');
  document.getElementById('mediumPriorityBtn').classList.remove('priorityMediumActive');
  document.getElementById('lowPriorityBtn').classList.remove('priorityLowActive');
  
  
  document.getElementById('highPriorityIcon').src = '../assets/images/high.svg';
  document.getElementById('mediumPriorityIcon').src = '../assets/images/medium.svg';
  document.getElementById('lowPriorityIcon').src = '../assets/images/low.svg';
}




function toggleCategorySelector() {
  const categorySelector = document.getElementById('category-selector');
  categorySelector.classList.toggle('hidden');
  
  if (!categorySelector.classList.contains('hidden')) {
    categorySelector.innerHTML = `
      <div class="dropdownItem" onclick="selectTaskCategory('Technical Task')">Technical Task</div>
      <div class="dropdownItem" onclick="selectTaskCategory('User Story')">User Story</div>
    `;
  }
}


function selectTaskCategory(category) {
  const categoryDisplay = document.getElementById('task-category-display');
  const categorySelector = document.getElementById('category-selector');
  
  categoryDisplay.textContent = category;
  categorySelector.classList.add('hidden');
  validateCategoryField();
}




function configureDateRestrictions() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('due-date-input').setAttribute('min', today);
}


function activateDatePicker() {
  const dateInput = document.getElementById('due-date-input');
  dateInput.showPicker();
  validateDateField();
}


function validateDateField() {
  const dateInput = document.getElementById('due-date-input');
  const validationMessage = document.getElementById('date-validation');
  
  if (!dateInput.value) {
    dateInput.classList.add('inputError');
    validationMessage.textContent = 'This field is required';
  } else {
    dateInput.classList.remove('inputError');
    validationMessage.textContent = '';
  }
}




function validateCategoryField() {
  const categoryDisplay = document.getElementById('task-category-display');
  const validationMessage = document.getElementById('category-validation');
  
  if (categoryDisplay.textContent === 'Select task category') {
    validationMessage.textContent = 'This field is required';
    categoryDisplay.parentElement.classList.add('inputError');
    return false;
  } else {
    validationMessage.textContent = '';
    categoryDisplay.parentElement.classList.remove('inputError');
    return true;
  }
}


function validateTitleField() {
  const titleInput = document.getElementById('title-input');
  const validationMessage = document.getElementById('title-validation');
  
  if (!titleInput.value.trim()) {
    titleInput.classList.add('inputError');
    validationMessage.textContent = 'This field is required';
    return false;
  } else {
    titleInput.classList.remove('inputError');
    validationMessage.textContent = '';
    return true;
  }
}


function validateTaskForm() {
  const titleValid = validateTitleField();
  
  const dateInput = document.getElementById('due-date-input');
  const dateValidationMessage = document.getElementById('date-validation');
  const dateValid = dateInput.value.trim() !== '';
  
  if (!dateValid) {
    dateInput.classList.add('inputError');
    dateValidationMessage.textContent = 'This field is required';
  }
  
  const categoryValid = validateCategoryField();
  
  return titleValid && dateValid && categoryValid;
}




async function createNewTask(boardCategory) {
  
  if (!boardCategory) {
    boardCategory = sessionStorage.getItem('selectedBoardCategory') || 'to-do';
  }
  
  try {
    
    if (!validateTaskForm()) {
      return;
    }
    
    
    // Get all form data
    const title = document.getElementById('title-input').value;
    const description = document.getElementById('description-input').value;
    const dueDate = document.getElementById('due-date-input').value;
    const priority = getActivePriority();
    const taskCategory = document.getElementById('task-category-display').textContent;
    
    // Include ALL possible field names for maximum compatibility
    const taskData = {
      title: title,
      description: description,
      due_date: dueDate,
      priority: priority,
      task_category: taskCategory,
      board_category: boardCategory,
      // Include multiple ways to specify contacts
      contact_ids: getSelectedContactIds(),
      contacts: getSelectedContactIds(),
      member_assignments: getSelectedContactIds(),
      // Format subtasks properly
      subtasks: subtasks.map(subtask => ({
        title: subtask.title,
        completed: subtask.completed || false
      }))
    };
    
    console.log("SENDING TASK DATA WITH ALL FIELDS:", taskData);
    
    
    console.log('Creating new task with data:', taskData);
    
    
    // Send task data to API
    const response = await apiPost(API_CONFIG.ENDPOINTS.TASKS, taskData);
    
    if (response && !response.error) {
      // Success - show confirmation
      console.log("Task created successfully via API:", response);
      
      const confirmation = document.getElementById('task-confirmation');
      if (confirmation) {
        confirmation.classList.add('animate');
      }
      
      // Reset form
      resetTaskForm();
      
      // Remove any saved board category
      sessionStorage.removeItem('selectedBoardCategory');
      
      // Immediate redirect with a slight delay to allow animation
      console.log("Preparing to redirect to board.html");
      
      // Simple direct redirect to avoid timing issues
      setTimeout(() => {
        console.log("Redirecting to board.html now");
        window.location.href = 'board.html';
      }, 1000);
    } else {
      console.error('Error creating task:', response?.error || 'Unknown error');
      
      
      if (typeof showErrorNotification === 'function') {
        let errorMessage = 'Failed to create task. ';
        
        
        if (response && response.member_assignments) {
          errorMessage += 'Please check the assigned contacts and try again.';
        } else {
          errorMessage += 'Please try again.';
        }
        
        showErrorNotification(errorMessage);
      } else {
        alert('There was an error creating the task. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error creating task:', error);
  }
}


function getSelectedContactIds() {
  
  console.log("Getting selected contact IDs from global contactSelections:", window.contactSelections);
  
  
  if (typeof window.contactSelections === 'undefined' || Object.keys(window.contactSelections).length === 0) {
    console.log("No contacts selected");
    return [];
  }
  
  const selectedIds = Object.keys(window.contactSelections)
    .filter(id => window.contactSelections[id] === true)
    .map(id => {
      
      if (/^\d+$/.test(id)) {
        return parseInt(id);
      }
      
      return id;
    });
  
  console.log("Selected contact IDs:", selectedIds);
  return selectedIds;
}


function resetTaskForm() {
  
  document.getElementById('title-input').value = '';
  document.getElementById('description-input').value = '';
  document.getElementById('due-date-input').value = '';
  document.getElementById('subtaskTextField').value = '';
  
  
  document.getElementById('title-input').classList.remove('inputError');
  document.getElementById('due-date-input').classList.remove('inputError');
  document.getElementById('title-validation').textContent = '';
  document.getElementById('date-validation').textContent = '';
  document.getElementById('category-validation').textContent = '';
  
  
  document.getElementById('task-category-display').textContent = 'Select task category';
  
  
  resetPriorityButtons();
  applyDefaultPriority();
  
  
  window.contactSelections = {};
  subtasks = [];
  document.getElementById('contact-display-container').innerHTML = '';
  document.getElementById('subtaskListContainer').innerHTML = '';
  
  // Reset subtask input controls if they're visible
  const subtaskAddButton = document.getElementById('subtaskAddButton');
  const subtaskControls = document.getElementById('subtaskControls');
  
  if (subtaskAddButton && subtaskAddButton.classList.contains('hidden')) {
    subtaskAddButton.classList.remove('hidden');
  }
  
  if (subtaskControls && !subtaskControls.classList.contains('hidden')) {
    subtaskControls.classList.add('hidden');
  }
}


function terminateUserSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  sessionStorage.clear();
  window.location.href = 'index.html';
}


function generateSubtaskControlsHTML() {
  return `
    <img onclick="cancelSubtask()" src="../assets/images/close.svg" alt="Cancel">
    <div class="subtaskDivider"></div>
    <img onclick="addNewSubtask()" src="../assets/images/check.svg" alt="Confirm">
  `;
}


function generateSubtaskItemHTML(index, subtask) {
  return `
    <div id="subtaskItem${index}" class="subtaskItemRow">
      <div class="subtaskItemText" id="subtask-${index}">${subtask.title}</div>
      <div class="subtaskControlsGroup">
        <img id="editIcon${index}" onclick="toggleSubtaskEditState(${index})" src="../assets/images/edit.svg" alt="Edit">
        <div class="subtaskDivider"></div>
        <img onclick="removeSubtask(${index})" src="../assets/images/delete.svg" alt="Delete">
      </div>
    </div>
  `;
}


function cancelSubtask() {
  const inputField = document.getElementById('subtaskTextField');
  inputField.value = '';
  
  const addButton = document.getElementById('subtaskAddButton');
  addButton.classList.remove('hidden');
  
  const controlsGroup = document.getElementById('subtaskControls');
  controlsGroup.classList.add('hidden');
}