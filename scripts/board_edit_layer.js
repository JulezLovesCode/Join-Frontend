
function getTaskById(taskId) {
  if (!tasksArray || !Array.isArray(tasksArray)) {
    return null;
  }
  
  const task = tasksArray.find(t => t.id == taskId);
  if (!task) {
    return null;
  }
  
  return task;
}

async function refreshTaskData(taskId) {
  try {
    // Fetch the latest data from the API
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY)}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const freshTaskData = await response.json();
    
    // Update the task in the global array
    const taskIndex = tasksArray.findIndex(t => t.id == taskId);
    if (taskIndex !== -1) {
      tasksArray[taskIndex] = freshTaskData;
    }
    
    return freshTaskData;
  } catch (error) {
    // Handle error but don't throw to allow fallback behavior
    return null;
  }
}

async function updateTask(taskId, updatedData) {
  const task = getTaskById(taskId);
  if (!task) {
    return false;
  }
  
  try {
    // Use the API to update the task
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TASKS}${taskId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY)}`
      },
      body: JSON.stringify(updatedData)
    });
    
    if (!response.ok) {
      return false;
    }
    
    const updatedTask = await response.json();
    
    // Update the task in the array
    const taskIndex = tasksArray.findIndex(t => t.id == taskId);
    if (taskIndex !== -1) {
      tasksArray[taskIndex] = { ...task, ...updatedTask };
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function saveTaskChanges(taskId, formData) {
  try {
    // Validate the form data (simplified validation)
    if (!formData.title || !formData.description) {
      return { success: false, error: 'Title and description are required' };
    }
    
    // Update the task via API
    const updated = await updateTask(taskId, formData);
    
    if (!updated) {
      return { success: false, error: 'Failed to update task on the server' };
    }
    
    // Refresh the board UI
    createTaskOnBoard();
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

async function updateTaskParticipants(taskId, participantIds) {
  // Early validation
  if (!taskId || !Array.isArray(participantIds)) {
    return false;
  }
  
  try {
    // Prepare the participants update payload
    const payload = {
      contacts: participantIds
    };
    
    // Call the API to update participants
    const updated = await updateTask(taskId, payload);
    
    return updated;
  } catch (error) {
    return false;
  }
}