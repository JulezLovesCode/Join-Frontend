/**
 * Displays the detailed view of a task when clicking on a task card
 * @param {string} taskId - Unique identifier of the task
 */
function displayTaskDetails(taskId) {
  if (taskId === undefined || taskId === null) {
    console.error('Error: taskId is undefined or null');
    return;
  }

  // Convert to number for proper comparison
  taskId = Number(taskId);

  // Find the task in the tasks array
  const taskData = tasksArray.find((task) => task.id == taskId);
  if (!taskData) {
    console.error('Error: Task not found for ID:', taskId);
    return;
  }

  // Set current task and prepare the UI
  currentTaskId = taskId;
  showDetailsPanel();

  // Get DOM elements for animation
  const detailsPanel = document.getElementById('task-details-panel');
  const mainContent = document.getElementById('board-content');

  // Animate panel and render content
  animateDetailsPanel(detailsPanel, mainContent);
  renderTaskDetails(detailsPanel, taskData, taskId);
  updateSectionVisibility();
}

/**
 * Makes the task details panel visible
 */
function showDetailsPanel() {
  document.getElementById('task-details-overlay').classList.remove('hidden');
}

/**
 * Animates the task details panel sliding in
 * @param {HTMLElement} panel - The details panel element
 * @param {HTMLElement} mainContent - The main content container
 */
function animateDetailsPanel(panel, mainContent) {
  // Reset animation classes
  panel.classList.remove('flexible-width');
  panel.classList.remove('slide-in-animation');
  panel.classList.remove('slide-out-animation');

  // Force reflow to ensure animation runs
  void panel.offsetWidth;

  // Apply animation and prevent scrolling of background
  panel.classList.add('slide-in-animation');
  mainContent.classList.add('content-locked');
}

/**
 * Renders the task details content in the panel
 * @param {HTMLElement} panel - The details panel element
 * @param {Object} taskData - The task data object
 * @param {string} taskId - Unique identifier of the task
 */
function renderTaskDetails(panel, taskData, taskId) {
  // Clear existing content
  panel.innerHTML = '';

  // Generate and insert new content
  panel.innerHTML = buildTaskDetailsContent(taskData, taskId);
}

/**
 * Ensures that section headlines are only visible when they have content
 */
function updateSectionVisibility() {
  toggleSubtasksSectionVisibility();
  toggleAssigneesSectionVisibility();
}

/**
 * Toggles visibility of subtasks headline based on content
 */
function toggleSubtasksSectionVisibility() {
  const subtasksHeading = document.getElementById('subtasks-section-heading');
  const subtasksContainer = document.querySelector('.subtasks-container');

  if (subtasksContainer && subtasksContainer.innerHTML.trim() === '') {
    subtasksHeading.classList.add('hidden');
  } else {
    subtasksHeading.classList.remove('hidden');
  }
}

/**
 * Toggles visibility of assignees headline based on content
 */
function toggleAssigneesSectionVisibility() {
  const assigneesHeading = document.getElementById('assignees-section-heading');
  const assigneesContainer = document.querySelector('.assignees-container');

  if (assigneesContainer && assigneesContainer.innerHTML.trim() === '') {
    assigneesHeading.classList.add('hidden');
  } else {
    assigneesHeading.classList.remove('hidden');
  }
}

/**
 * Builds the complete HTML for task details view
 * @param {Object} taskData - The task data object
 * @param {string} taskId - Unique identifier of the task
 * @returns {string} Complete HTML for task details
 */
function buildTaskDetailsContent(taskData, taskId) {
  const assignedContacts = taskData.contacts || {};
  const taskSubtasks = taskData.subtasks || {};
  const categoryStyleClass = getCategoryStyleClass(taskData.task_category);

  // Initialize contact selection state for editing
  initializeContactSelections(contactsArray);

  // Get current user name for highlighting in the assignee list
  const currentUser = sessionStorage.getItem('userName');

  // Generate HTML for assignees and subtasks sections
  const assigneesHtml = generateAssigneesList(taskData.contacts, currentUser);
  const subtasksHtml = generateSubtasksList(taskSubtasks, taskId);

  // Build complete details HTML
  return constructTaskDetailsHtml(
    taskData,
    taskId,
    categoryStyleClass,
    assigneesHtml,
    subtasksHtml
  );
}

/**
 * Determines the CSS class for task category styling
 * @param {string} taskCategory - Category name (User Story or Technical Task)
 * @returns {string} CSS class name
 */
function getCategoryStyleClass(taskCategory) {
  return taskCategory === 'User Story'
    ? 'user-story-category'
    : 'technical-task-category';
}

/**
 * Initializes the contact selection state array for editing
 * @param {Array} availableContacts - Array of all contacts
 */
function initializeContactSelections(availableContacts) {
  // Reference the existing contactSelections from board.js rather than redeclaring
  if (typeof contactSelections !== 'undefined') {
    // Reset the existing object
    Object.keys(contactSelections).forEach(key => {
      delete contactSelections[key];
    });
    
    // Fill with new values
    availableContacts.forEach((contact, index) => {
      contactSelections[index] = false;
    });
  }
}

/**
 * Generates HTML for assignees list in task details
 * @param {Object} assignedContacts - Object containing task contacts
 * @param {string} currentUser - Name of the logged-in user
 * @returns {string} HTML markup for assignees section
 */
function generateAssigneesList(assignedContacts, currentUser) {
  if (!assignedContacts || typeof assignedContacts !== 'object') {
    return '';
  }

  return Object.values(assignedContacts)
    .map((contact) => {
      // Mark contact as selected for potential editing
      // Use a try-catch to handle potential errors with contactsArray
      try {
        if (Array.isArray(contactsArray)) {
          const contactIndex = contactsArray.findIndex(
            (c) => c && c.email === contact.email && c.name === contact.name
          );

          if (contactIndex !== -1 && typeof contactSelections !== 'undefined') {
            contactSelections[contactIndex] = true;
          }
        }
      } catch (error) {
        console.warn("Error checking contact index:", error);
      }

      // Use an inline function to generate the HTML
      return `
        <div class="show-task-contact">
          <div class="show-task-contact-letters" style="background-color: ${contact.color || generateColorForContact(contact.name)};">${getInitials(contact.name)}</div>
          <p>${contact.name}${currentUser && contact.name === currentUser ? ' (You)' : ''}</p>
        </div>
      `;
    })
    .join('');
}

/**
 * Helper function to generate consistent color based on contact name
 * @param {string} name - Contact name
 * @returns {string} CSS color value
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
 * Helper function to get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
function getInitials(name) {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Updates the completion status of a subtask
 * @param {string} taskId - Task identifier
 * @param {string} subtaskId - Subtask identifier
 * @param {HTMLElement} checkboxIcon - The checkbox image element
 */
async function toggleSubtaskCompletion(taskId, subtaskId, checkboxIcon) {
  const subtask = tasksData[taskId].subtasks[subtaskId];
  const newStatus = !subtask.completed;

  await updateSubtaskStatusOnServer(taskId, subtaskId, newStatus);
  updateSubtaskCheckboxDisplay(subtask, checkboxIcon);

  await refreshBoardView();
}

/**
 * Sends subtask status update to the server
 * @param {string} taskId - Task identifier
 * @param {string} subtaskId - Subtask identifier
 * @param {boolean} newStatus - New completion status
 */
async function updateSubtaskStatusOnServer(taskId, subtaskId, newStatus) {
  try {
    await executeApiRequest(`api/tasks/${taskId}/subtasks/${subtaskId}/`, 'PATCH', {
      completed: newStatus,
    });
    tasksData[taskId].subtasks[subtaskId].completed = newStatus;
  } catch (error) {
    console.error('Failed to update subtask status:', error);
  }
}

/**
 * Updates the subtask checkbox UI based on completion status
 * @param {Object} subtask - The subtask object
 * @param {HTMLElement} checkboxIcon - The checkbox image element
 */
function updateSubtaskCheckboxDisplay(subtask, checkboxIcon) {
  checkboxIcon.src = subtask.completed
    ? '/add_task_img/subtasks_checked.svg'
    : '/add_task_img/subtasks_notchecked.svg';
}

/**
 * Generates and renders contact selection for task assignment
 * @param {Object} selectedContacts - Object of selected contacts
 */
async function renderContactSelectionList(selectedContacts) {
  selectedContacts = selectedContacts || [];
  const contactCount = Object.keys(selectedContacts).length;

  const contactsContainer = document.getElementById(
    'selected-contacts-container'
  );
  contactsContainer.innerHTML = '';
  contactsContainer.innerHTML += renderVisibleContacts(selectedContacts);
  contactsContainer.innerHTML += renderRemainingContactsCounter(contactCount);
}

/**
 * Generates HTML string for contact selection
 * @param {Object} selectedContacts - Object of selected contacts
 * @returns {string} HTML markup for contacts display
 */
function generateContactSelectionHtml(selectedContacts) {
  selectedContacts = selectedContacts || [];
  const contactCount = Object.keys(selectedContacts).length;

  let contactsHtml = renderVisibleContacts(selectedContacts);
  contactsHtml += renderRemainingContactsCounter(contactCount);

  return contactsHtml;
}

/**
 * Renders visible contacts (up to 4) in selection display
 * @param {Object} selectedContacts - Object of selected contacts
 * @returns {string} HTML markup for visible contacts
 */
function renderVisibleContacts(selectedContacts) {
  let contactsHtml = '';
  let displayedCount = 0;

  for (let i = 0; i < contactsArray.length; i++) {
    if (selectedContacts[i]) {
      const contact = contactsArray[i];
      if (displayedCount < 4) {
        contactsHtml += generateContactBubbleHtml(contact);
        displayedCount++;
      } else {
        break;
      }
    }
  }

  return contactsHtml;
}

/**
 * Creates HTML for displaying the count of additional contacts
 * @param {number} totalCount - Total number of selected contacts
 * @returns {string} HTML for the counter display or empty string
 */
function renderRemainingContactsCounter(totalCount) {
  if (totalCount <= 4) {
    return '';
  }

  const remainingCount = totalCount - 4;
  return `<div class="contact-counter">+${remainingCount}</div>`;
}

/**
 * Opens the task creation interface for a specific board category
 * @param {string} boardCategory - The board category for the new task
 */
function openTaskCreation(boardCategory) {
  resetContactSelections();
  document.getElementById('task-details-overlay').classList.remove('hidden');

  const contactsHtml = generateContactSelectionHtml({});
  renderTaskCreationForm(boardCategory, contactsHtml);
}

/**
 * Renders the task creation form
 * @param {string} boardCategory - The board category for the new task
 * @param {string} contactsHtml - HTML for selected contacts
 */
function renderTaskCreationForm(boardCategory, contactsHtml) {
  const formPanel = document.getElementById('task-details-panel');
  formPanel.classList.add('flexible-width');

  // Reset and apply animations
  formPanel.classList.remove('slide-in-animation');
  formPanel.classList.remove('slide-out-animation');
  void formPanel.offsetWidth;
  formPanel.classList.add('slide-in-animation');

  // Render form content
  formPanel.innerHTML = '';
  formPanel.innerHTML += buildTaskCreationForm(boardCategory, contactsHtml);

  // Set default priority and store current board category
  applyDefaultPriority();
  currentBoardCategory = boardCategory;
}

/**
 * Closes the task details or creation panel with animation
 */
function closeDetailsPanel() {
  const overlay = document.getElementById('task-details-overlay');
  const panel = document.getElementById('task-details-panel');

  // Apply exit animation
  panel.classList.remove('slide-out-animation');
  void panel.offsetWidth;
  panel.classList.add('slide-out-animation');

  // Remove existing event listeners and add new one
  panel.removeEventListener('animationend', handleAnimationEnd);
  panel.addEventListener(
    'animationend',
    () => {
      panel.style.height = '';
      handleAnimationEnd();
    },
    { once: true }
  );
}

/**
 * Handles the end of panel animation
 */
function handleAnimationEnd() {
  document.getElementById('task-details-overlay').classList.add('hidden');
  document.getElementById('board-content').classList.remove('content-locked');
}
