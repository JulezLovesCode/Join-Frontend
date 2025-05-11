
function displayTaskDetails(taskId) {
  if (taskId === undefined || taskId === null) {
    console.error('Error: taskId is undefined or null');
    return;
  }

  
  taskId = Number(taskId);

  
  const taskData = tasksArray.find((task) => task.id == taskId);
  if (!taskData) {
    console.error('Error: Task not found for ID:', taskId);
    return;
  }

  
  currentTaskId = taskId;
  showDetailsPanel();

  
  const detailsPanel = document.getElementById('task-details-panel');
  const mainContent = document.getElementById('board-content');

  
  animateDetailsPanel(detailsPanel, mainContent);
  renderTaskDetails(detailsPanel, taskData, taskId);
  updateSectionVisibility();
}


function showDetailsPanel() {
  document.getElementById('task-details-overlay').classList.remove('hidden');
}


function animateDetailsPanel(panel, mainContent) {
  
  panel.classList.remove('flexible-width');
  panel.classList.remove('slide-in-animation');
  panel.classList.remove('slide-out-animation');

  
  void panel.offsetWidth;

  
  panel.classList.add('slide-in-animation');
  mainContent.classList.add('content-locked');
}


function renderTaskDetails(panel, taskData, taskId) {
  
  panel.innerHTML = '';

  
  panel.innerHTML = buildTaskDetailsContent(taskData, taskId);
}


function updateSectionVisibility() {
  toggleSubtasksSectionVisibility();
  toggleAssigneesSectionVisibility();
}


function toggleSubtasksSectionVisibility() {
  const subtasksHeading = document.getElementById('subtasks-section-heading');
  const subtasksContainer = document.querySelector('.subtasks-container');

  if (subtasksContainer && subtasksContainer.innerHTML.trim() === '') {
    subtasksHeading.classList.add('hidden');
  } else {
    subtasksHeading.classList.remove('hidden');
  }
}


function toggleAssigneesSectionVisibility() {
  const assigneesHeading = document.getElementById('assignees-section-heading');
  const assigneesContainer = document.querySelector('.assignees-container');

  if (assigneesContainer && assigneesContainer.innerHTML.trim() === '') {
    assigneesHeading.classList.add('hidden');
  } else {
    assigneesHeading.classList.remove('hidden');
  }
}


function buildTaskDetailsContent(taskData, taskId) {
  const assignedContacts = taskData.contacts || {};
  const taskSubtasks = taskData.subtasks || {};
  const categoryStyleClass = getCategoryStyleClass(taskData.task_category);

  
  initializeContactSelections(contactsArray);

  
  const currentUser = sessionStorage.getItem('userName');

  
  const assigneesHtml = generateAssigneesList(taskData.contacts, currentUser);
  const subtasksHtml = generateSubtasksList(taskSubtasks, taskId);

  
  return constructTaskDetailsHtml(
    taskData,
    taskId,
    categoryStyleClass,
    assigneesHtml,
    subtasksHtml
  );
}


function getCategoryStyleClass(taskCategory) {
  return taskCategory === 'User Story'
    ? 'user-story-category'
    : 'technical-task-category';
}


function initializeContactSelections(availableContacts) {
  
  if (typeof contactSelections !== 'undefined') {
    
    Object.keys(contactSelections).forEach(key => {
      delete contactSelections[key];
    });
    
    
    availableContacts.forEach((contact, index) => {
      contactSelections[index] = false;
    });
  }
}


function generateAssigneesList(assignedContacts, currentUser) {
  if (!assignedContacts || typeof assignedContacts !== 'object') {
    return '';
  }

  return Object.values(assignedContacts)
    .map((contact) => {
      
      
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

      
      return `
        <div class="show-task-contact">
          <div class="show-task-contact-letters" style="background-color: ${contact.color || generateColorForContact(contact.name)};">${getInitials(contact.name)}</div>
          <p>${contact.name}${currentUser && contact.name === currentUser ? ' (You)' : ''}</p>
        </div>
      `;
    })
    .join('');
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


function getInitials(name) {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}


async function toggleSubtaskCompletion(taskId, subtaskId, checkboxIcon) {
  const subtask = tasksData[taskId].subtasks[subtaskId];
  const newStatus = !subtask.completed;

  await updateSubtaskStatusOnServer(taskId, subtaskId, newStatus);
  updateSubtaskCheckboxDisplay(subtask, checkboxIcon);

  await refreshBoardView();
}


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


function updateSubtaskCheckboxDisplay(subtask, checkboxIcon) {
  checkboxIcon.src = subtask.completed
    ? '/add_task_img/subtasks_checked.svg'
    : '/add_task_img/subtasks_notchecked.svg';
}


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


function generateContactSelectionHtml(selectedContacts) {
  selectedContacts = selectedContacts || [];
  const contactCount = Object.keys(selectedContacts).length;

  let contactsHtml = renderVisibleContacts(selectedContacts);
  contactsHtml += renderRemainingContactsCounter(contactCount);

  return contactsHtml;
}


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


function renderRemainingContactsCounter(totalCount) {
  if (totalCount <= 4) {
    return '';
  }

  const remainingCount = totalCount - 4;
  return `<div class="contact-counter">+${remainingCount}</div>`;
}


function openTaskCreation(boardCategory) {
  resetContactSelections();
  document.getElementById('task-details-overlay').classList.remove('hidden');

  const contactsHtml = generateContactSelectionHtml({});
  renderTaskCreationForm(boardCategory, contactsHtml);
}


function renderTaskCreationForm(boardCategory, contactsHtml) {
  const formPanel = document.getElementById('task-details-panel');
  formPanel.classList.add('flexible-width');

  
  formPanel.classList.remove('slide-in-animation');
  formPanel.classList.remove('slide-out-animation');
  void formPanel.offsetWidth;
  formPanel.classList.add('slide-in-animation');

  
  formPanel.innerHTML = '';
  formPanel.innerHTML += buildTaskCreationForm(boardCategory, contactsHtml);

  
  applyDefaultPriority();
  currentBoardCategory = boardCategory;
}


function closeDetailsPanel() {
  const overlay = document.getElementById('task-details-overlay');
  const panel = document.getElementById('task-details-panel');

  
  panel.classList.remove('slide-out-animation');
  void panel.offsetWidth;
  panel.classList.add('slide-out-animation');

  
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


function handleAnimationEnd() {
  document.getElementById('task-details-overlay').classList.add('hidden');
  document.getElementById('board-content').classList.remove('content-locked');
}
