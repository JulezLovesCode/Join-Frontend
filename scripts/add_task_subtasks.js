
function initializeSubtaskInput() {
  
  const subtaskField = document.getElementById('subtaskTextField');
  subtaskField.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addNewSubtask();
    }
  });

  
  document.getElementById('subtaskAddButton').classList.add('hidden');
  const controlsGroup = document.getElementById('subtaskControls');
  controlsGroup.classList.remove('hidden');
  controlsGroup.innerHTML = generateSubtaskControlsHTML();
}


function addNewSubtask() {
  const inputField = document.getElementById('subtaskTextField');
  const subtaskText = inputField.value.trim();
  
  if (subtaskText === '') {
    return;
  }
  
  
  subtasks.push({
    title: subtaskText,
    completed: false
  });
  
  
  displaySubtaskList();
  
  
  inputField.value = '';
  cancelSubtask();
}


function displaySubtaskList() {
  const subtaskListContainer = document.getElementById('subtaskListContainer');
  subtaskListContainer.innerHTML = '';
  
  for (let i = 0; i < subtasks.length; i++) {
    let subtask = subtasks[i];
    subtaskListContainer.innerHTML += generateSubtaskItemHTML(i, subtask);
  }
}


function toggleSubtaskEditState(subtaskIndex) {
  const subtaskItem = document.getElementById(`subtaskItem${subtaskIndex}`);
  const editIcon = document.getElementById(`editIcon${subtaskIndex}`);
  
  
  if (subtaskItem.classList.contains('subtaskItemEditing')) {
    saveSubtaskChanges(subtaskIndex);
    return;
  }
  
  
  subtaskItem.classList.remove('subtaskItemRow');
  subtaskItem.classList.add('subtaskItemEditing');
  
  
  const subtaskElement = document.getElementById(`subtask-${subtaskIndex}`);
  const currentText = subtasks[subtaskIndex].title;
  
  subtaskElement.innerHTML = `
    <div contenteditable="true" id="subtask-edit-${subtaskIndex}" class="subtaskEditableContent">${currentText}</div>
  `;
  
  
  setTimeout(() => {
    document.getElementById(`subtask-edit-${subtaskIndex}`).focus();
  }, 50);
  
  
  editIcon.src = '../assets/images/check.svg';
}


function saveSubtaskChanges(subtaskIndex) {
  const subtaskItem = document.getElementById(`subtaskItem${subtaskIndex}`);
  const editElement = document.getElementById(`subtask-edit-${subtaskIndex}`);
  const editIcon = document.getElementById(`editIcon${subtaskIndex}`);
  
  
  const editedContent = editElement ? editElement.textContent.trim() : '';
  
  if (editedContent === '') {
    
    document.getElementById('subtaskValidation').textContent = 'Subtask cannot be empty';
    return;
  }
  
  
  subtasks[subtaskIndex].title = editedContent;
  
  
  subtaskItem.classList.remove('subtaskItemEditing');
  subtaskItem.classList.add('subtaskItemRow');
  
  
  const subtaskElement = document.getElementById(`subtask-${subtaskIndex}`);
  subtaskElement.textContent = editedContent;
  
  
  editIcon.src = '../assets/images/edit.svg';
  
  
  document.getElementById('subtaskValidation').textContent = '';
}


function removeSubtask(subtaskIndex) {
  
  subtasks.splice(subtaskIndex, 1);
  
  
  displaySubtaskList();
}


function restoreDefaultState() {
  const addButton = document.getElementById('subtaskAddButton');
  const controlsGroup = document.getElementById('subtaskControls');
  
  if (addButton) addButton.classList.remove('hidden');
  if (controlsGroup) controlsGroup.classList.add('hidden');
  
  const inputField = document.getElementById('subtaskTextField');
  if (inputField) inputField.value = '';
}