/**
 * Opens the task editor interface for a specific task
 * @param {string} taskId - Unique identifier of the task to edit
 */
window.openTaskEditor = async function (taskId) {
  await refreshTaskData(taskId);

  const taskData = tasksData[taskId];

  if (!taskId) {
    console.error(`Error: No task found with ID ${taskId}`);
    return;
  }

  const editorContainer = document.getElementById('task-editor-container');
  editorContainer.innerHTML = buildTaskEditorInterface(taskData, taskId);
};

/**
 * Fetches the latest data for a specific task from the server
 * @param {string} taskId - Unique identifier of the task
 */
async function refreshTaskData(taskId) {
  try {
    const authToken = localStorage.getItem('access_token');

    if (!authToken) {
      console.error(
        'Authentication error: No token found. User must be logged in.'
      );
      return;
    }

    const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${authToken}`,
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} - ${response.statusText}`);
      return;
    }

    const latestTaskData = await response.json();

    // Only update if data has changed
    if (JSON.stringify(tasksData[taskId]) === JSON.stringify(latestTaskData)) {
      return;
    }

    tasksData[taskId] = latestTaskData;

    if (typeof openTaskEditor === 'function') {
      openTaskEditor(taskId);
    }
  } catch (error) {
    console.error('Failed to refresh task data:', error);
  }
}

/**
 * Updates a task with new data via API
 * @param {string} taskId - Unique identifier of the task
 * @param {object} updatedTaskData - Object containing the updated task properties
 */
async function persistTaskChanges(taskId, updatedTaskData) {
  try {
    if (
      !updatedTaskData.contact_ids ||
      updatedTaskData.contact_ids.length === 0
    ) {
      // Empty contact list - using existing data if available
    }

    const response = await executeApiRequest(
      `tasks/${taskId}/`,
      'PATCH',
      updatedTaskData
    );

    if (response) {
      await initializeBoard();
    }
  } catch (error) {
    console.error('Task update failed:', error);
  }
}

/**
 * Collects form data and saves all changes to the task
 * @param {string} taskId - Unique identifier of the task
 */
async function saveAllTaskChanges(taskId) {
  try {
    // Get selected contact IDs
    let participantIds = getParticipantIds();

    // Use existing contact IDs if none selected
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      participantIds = currentTask.contact_ids || [];
    }

    // Prepare updated task data
    const taskUpdates = collectTaskFormData(
      participantIds,
      collectSubtaskData()
    );

    // Persist changes and refresh UI
    await persistTaskChanges(taskId, taskUpdates);
    openTaskEditor(taskId);
  } catch (error) {
    console.error('Failed to save task changes:', error);
  }
}

/**
 * Updates only the contact assignments for a task
 * @param {string} taskId - Unique identifier of the task
 */
async function updateTaskParticipants(taskId) {
  try {
    const participantIds = getParticipantIds();

    if (!Array.isArray(participantIds)) {
      throw new Error('Error: participant_ids must be an array');
    }

    const contactUpdate = { contact_ids: participantIds };

    await persistTaskChanges(taskId, contactUpdate);
    await refreshTaskData(taskId);

    setTimeout(() => openTaskEditor(taskId), 100);
  } catch (error) {
    console.error('Failed to update task participants:', error);
  }
}

/**
 * Extracts IDs of all selected contacts from the form
 * @returns {Array} Array of selected contact IDs
 */
function getParticipantIds() {
  const selectedIds = [];

  document.querySelectorAll('.contact-checkbox').forEach((checkbox) => {
    if (checkbox.checked) {
      selectedIds.push(parseInt(checkbox.dataset.contactId));
    }
  });

  return selectedIds;
}

/**
 * Transforms the subtasks array into a properly formatted object
 * @returns {Object} Formatted subtasks object
 */
function collectSubtaskData() {
  return subtasks.reduce((result, subtask, index) => {
    result[`subtask${index + 1}`] = {
      title: subtask.title,
      completed: subtask.completed,
    };
    return result;
  }, {});
}

/**
 * Collects all task data from the editor form
 * @param {Array} participantIds - Array of contact IDs to assign to the task
 * @param {Object} subtasksData - Formatted subtask data
 * @returns {Object} Complete task data object
 */
function collectTaskFormData(participantIds, subtasksData) {
  // Ensure we have valid contact IDs
  if (!participantIds || participantIds.length === 0) {
    participantIds = currentTask.contact_ids || [];
  }

  return {
    task_category: currentTask.task_category,
    board_category: currentTask.board_category,
    contact_ids: participantIds,
    subtasks: subtasksData,
    title: document.getElementById('task-title-field').value,
    description: document.getElementById('task-description-field').value,
    due_date: document.getElementById('task-due-date').value,
    priority: determineSelectedPriority(),
  };
}

/**
 * Determines which priority is currently selected in the form
 * @returns {string} Priority level: "urgent", "medium", or "low"
 */
function determineSelectedPriority() {
  if (document.querySelector('.priority-button.priority-high-active')) {
    return 'urgent';
  } else if (
    document.querySelector('.priority-button.priority-medium-active')
  ) {
    return 'medium';
  } else if (document.querySelector('.priority-button.priority-low-active')) {
    return 'low';
  } else {
    return currentTask.priority;
  }
}

/**
 * Completes the task update process and refreshes the UI
 */
function completeTaskUpdate() {
  closeTaskEditor();
  initializeBoard();
  subtasks = [];
}

/**
 * Builds the complete task editor interface
 * @param {Object} taskData - The task data to edit
 * @param {string} taskId - Unique identifier of the task
 * @returns {string} HTML markup for the task editor
 */
function buildTaskEditorInterface(taskData, taskId) {
  currentTask = taskData;

  const contacts = Array.isArray(taskData.contacts) ? taskData.contacts : [];
  const taskSubtasks = Array.isArray(taskData.subtasks)
    ? taskData.subtasks
    : [];

  const participantListHtml = renderParticipantsList(contacts);
  const subtaskListHtml = renderSubtasksList(taskSubtasks);

  // Priority button states
  const priorityConfig = {
    high: {
      activeClass: taskData.priority === 'urgent' ? 'priority-high-active' : '',
      iconSrc:
        taskData.priority === 'urgent'
          ? 'add_task_img/high-white.svg'
          : 'add_task_img/high.svg',
    },
    medium: {
      activeClass:
        taskData.priority === 'medium' ? 'priority-medium-active' : '',
      iconSrc:
        taskData.priority === 'medium'
          ? 'add_task_img/medium-white.svg'
          : 'add_task_img/medium.svg',
    },
    low: {
      activeClass: taskData.priority === 'low' ? 'priority-low-active' : '',
      iconSrc:
        taskData.priority === 'low'
          ? 'add_task_img/low-white.svg'
          : 'add_task_img/low.svg',
    },
  };

  return generateEditorHtml(
    taskData,
    taskId,
    participantListHtml,
    subtaskListHtml,
    priorityConfig.high.activeClass,
    priorityConfig.high.iconSrc,
    priorityConfig.medium.activeClass,
    priorityConfig.medium.iconSrc,
    priorityConfig.low.activeClass,
    priorityConfig.low.iconSrc
  );
}

/**
 * Renders the HTML for task subtasks and updates the global subtasks array
 * @param {Object} taskSubtasks - Object containing task subtasks
 * @returns {string} HTML markup for subtasks list
 */
function renderSubtasksList(taskSubtasks) {
  subtasks = [];

  return Object.keys(taskSubtasks)
    .map((subtaskKey, index) => {
      const subtask = taskSubtasks[subtaskKey];
      subtasks.push({
        title: subtask.title,
        completed: subtask.completed,
      });
      return generateSubtaskItemHtml(subtask, index);
    })
    .join('');
}

/**
 * Renders the HTML for task participants (contacts)
 * @param {Object} contacts - Object containing task contacts
 * @returns {string} HTML markup for contacts list
 */
function renderParticipantsList(contacts) {
  contacts = contacts || {};
  const contactCount = Object.keys(contacts).length;

  let participantsHtml = renderVisibleParticipants(contacts);
  participantsHtml += renderParticipantCounter(contactCount);

  return participantsHtml;
}

/**
 * Renders the HTML for the first four visible participants
 * @param {Object} contacts - Object containing task contacts
 * @returns {string} HTML markup for visible participants
 */
function renderVisibleParticipants(contacts) {
  let participantsHtml = '';
  let displayedCount = 0;

  for (let key in contacts) {
    if (contacts.hasOwnProperty(key)) {
      const contact = contacts[key];
      if (displayedCount < 4) {
        participantsHtml += generateParticipantHtml(contact);
        displayedCount++;
      } else {
        break;
      }
    }
  }

  return participantsHtml;
}

/**
 * Renders the HTML for the "remaining participants" counter
 * @param {number} totalCount - Total number of participants
 * @returns {string} HTML markup for the counter
 */
function renderParticipantCounter(totalCount) {
  if (totalCount <= 4) {
    return '';
  }

  const remainingCount = totalCount - 4;
  return generateParticipantCounterHtml(remainingCount);
}
