
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


async function persistTaskChanges(taskId, updatedTaskData) {
  try {
    if (
      !updatedTaskData.contact_ids ||
      updatedTaskData.contact_ids.length === 0
    ) {
      
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


async function saveAllTaskChanges(taskId) {
  try {
    
    let participantIds = getParticipantIds();

    
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      participantIds = currentTask.contact_ids || [];
    }

    
    const taskUpdates = collectTaskFormData(
      participantIds,
      collectSubtaskData()
    );

    
    await persistTaskChanges(taskId, taskUpdates);
    openTaskEditor(taskId);
  } catch (error) {
    console.error('Failed to save task changes:', error);
  }
}


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


function getParticipantIds() {
  const selectedIds = [];

  document.querySelectorAll('.contact-checkbox').forEach((checkbox) => {
    if (checkbox.checked) {
      selectedIds.push(parseInt(checkbox.dataset.contactId));
    }
  });

  return selectedIds;
}


function collectSubtaskData() {
  return subtasks.reduce((result, subtask, index) => {
    result[`subtask${index + 1}`] = {
      title: subtask.title,
      completed: subtask.completed,
    };
    return result;
  }, {});
}


function collectTaskFormData(participantIds, subtasksData) {
  
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


function completeTaskUpdate() {
  closeTaskEditor();
  initializeBoard();
  subtasks = [];
}


function buildTaskEditorInterface(taskData, taskId) {
  currentTask = taskData;

  const contacts = Array.isArray(taskData.contacts) ? taskData.contacts : [];
  const taskSubtasks = Array.isArray(taskData.subtasks)
    ? taskData.subtasks
    : [];

  const participantListHtml = renderParticipantsList(contacts);
  const subtaskListHtml = renderSubtasksList(taskSubtasks);

  
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


function renderParticipantsList(contacts) {
  contacts = contacts || {};
  const contactCount = Object.keys(contacts).length;

  let participantsHtml = renderVisibleParticipants(contacts);
  participantsHtml += renderParticipantCounter(contactCount);

  return participantsHtml;
}


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


function renderParticipantCounter(totalCount) {
  if (totalCount <= 4) {
    return '';
  }

  const remainingCount = totalCount - 4;
  return generateParticipantCounterHtml(remainingCount);
}
