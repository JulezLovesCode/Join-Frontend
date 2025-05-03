/**
 * Configures the subtask input field for creating new tasks
 * Sets up keyboard event handling and adjusts UI elements visibility
 */
function initializeSubtaskInput() {
  // Add keyboard event listener
  const subtaskField = document.getElementById('subtaskTextField');
  subtaskField.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addNewSubtask();
    }
  });

  // Hide add button and show controls
  document.getElementById('subtaskAddButton').classList.add('hidden');
  const controlsGroup = document.getElementById('subtaskControls');
  controlsGroup.classList.remove('hidden');
  controlsGroup.innerHTML = generateSubtaskControlsHTML();
}

/**
 * Creates a new subtask from the input field value and updates the subtask list
 */
function addNewSubtask() {
  const inputField = document.getElementById('subtaskTextField');
  const subtaskText = inputField.value.trim();
  
  if (subtaskText === '') {
    return;
  }
  
  // Add to subtasks array
  subtasks.push({
    title: subtaskText,
    completed: false
  });
  
  // Update UI
  displaySubtaskList();
  
  // Reset input
  inputField.value = '';
  cancelSubtask();
}

/**
 * Displays all subtasks in the UI
 */
function displaySubtaskList() {
  const subtaskListContainer = document.getElementById('subtaskListContainer');
  subtaskListContainer.innerHTML = '';
  
  for (let i = 0; i < subtasks.length; i++) {
    let subtask = subtasks[i];
    subtaskListContainer.innerHTML += generateSubtaskItemHTML(i, subtask);
  }
}

/**
 * Changes the UI state of a subtask item to editing mode
 * @param {number} subtaskIndex - The index of the subtask to edit
 */
function toggleSubtaskEditState(subtaskIndex) {
  const subtaskItem = document.getElementById(`subtaskItem${subtaskIndex}`);
  const editIcon = document.getElementById(`editIcon${subtaskIndex}`);
  
  // If already in edit mode, save changes
  if (subtaskItem.classList.contains('subtaskItemEditing')) {
    saveSubtaskChanges(subtaskIndex);
    return;
  }
  
  // Switch to edit mode
  subtaskItem.classList.remove('subtaskItemRow');
  subtaskItem.classList.add('subtaskItemEditing');
  
  // Replace content with editable version
  const subtaskElement = document.getElementById(`subtask-${subtaskIndex}`);
  const currentText = subtasks[subtaskIndex].title;
  
  subtaskElement.innerHTML = `
    <div contenteditable="true" id="subtask-edit-${subtaskIndex}" class="subtaskEditableContent">${currentText}</div>
  `;
  
  // Focus on editable content
  setTimeout(() => {
    document.getElementById(`subtask-edit-${subtaskIndex}`).focus();
  }, 50);
  
  // Change edit icon to confirm icon
  editIcon.src = '../assets/images/check.svg';
}

/**
 * Saves changes made to a subtask and updates the UI
 * @param {number} subtaskIndex - The index of the subtask to update
 */
function saveSubtaskChanges(subtaskIndex) {
  const subtaskItem = document.getElementById(`subtaskItem${subtaskIndex}`);
  const editElement = document.getElementById(`subtask-edit-${subtaskIndex}`);
  const editIcon = document.getElementById(`editIcon${subtaskIndex}`);
  
  // Get edited content
  const editedContent = editElement ? editElement.textContent.trim() : '';
  
  if (editedContent === '') {
    // Handle empty content (optional: show validation error)
    document.getElementById('subtaskValidation').textContent = 'Subtask cannot be empty';
    return;
  }
  
  // Update subtask data
  subtasks[subtaskIndex].title = editedContent;
  
  // Restore display mode
  subtaskItem.classList.remove('subtaskItemEditing');
  subtaskItem.classList.add('subtaskItemRow');
  
  // Update content
  const subtaskElement = document.getElementById(`subtask-${subtaskIndex}`);
  subtaskElement.textContent = editedContent;
  
  // Reset edit icon
  editIcon.src = '../assets/images/edit.svg';
  
  // Clear any validation messages
  document.getElementById('subtaskValidation').textContent = '';
}

/**
 * Removes a subtask from the list and updates the UI
 * @param {number} subtaskIndex - The index of the subtask to remove
 */
function removeSubtask(subtaskIndex) {
  // Remove from array
  subtasks.splice(subtaskIndex, 1);
  
  // Update UI
  displaySubtaskList();
}

/**
 * Restores the default state of the subtask input UI
 */
function restoreDefaultState() {
  const addButton = document.getElementById('subtaskAddButton');
  const controlsGroup = document.getElementById('subtaskControls');
  
  if (addButton) addButton.classList.remove('hidden');
  if (controlsGroup) controlsGroup.classList.add('hidden');
  
  const inputField = document.getElementById('subtaskTextField');
  if (inputField) inputField.value = '';
}