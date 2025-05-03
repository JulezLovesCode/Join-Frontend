/**
 * Creates the profile section of contact details
 * @param {string} letters - contact initials
 * @param {object} person - contact object
 * @param {string} identifier - contact identifier
 * @returns HTML structure for contact profile header
 */
function renderContactProfileHeader(letters, person, identifier) {
  return `
          <div class="contact-profile-firstrow">
            <div class="contact-letters-big" style="background-color: ${person.color}">${letters}</div>
            <div class="contact-profile-firstrow-right">
              <h3>${person.name}</h3>
              <div class="contact-actions">
                <a onclick='openEditContactLayer("${identifier}", "${person.name}", "${person.email}", "${person.phone}")' class="contact-links">
                  <img class="contact-icon" src="img/contact-edit.svg" alt="">Edit
                </a>
                <a onclick="deleteContact('${identifier}')" class="contact-links">
                  <img class="contact-icon" src="img/contact-delete.svg" alt="">Delete
                </a>
              </div>
            </div>
          </div>
    
          <p class="padding-top-bottom-27">Contact Information</p>
    
          <div class="contact-channels">
            <p>Email</p>
            <a href="#">${person.email}</a>
          </div>
          <div class="contact-channels">
            <p>Phone</p>
            <a class="black-link" href="#">${person.phone}</a>
          </div>
      `;
}

/**
 * Formats text to ensure it doesn't exceed character limit
 * @param {string} text - text to format
 * @param {number} charLimit - maximum characters allowed
 * @returns formatted text with ellipsis if needed
 */
function formatTextLength(text, charLimit) {
  text = text || '';
  return text.length > charLimit ? text.substring(0, charLimit) + '...' : text;
}

/**
 * Creates HTML for contacts in an edit panel
 * @param {number} memberCount - total number of contacts
 * @returns HTML for showing additional contacts count
 */
function displayExtraContacts(memberCount) {
  if (memberCount > 4) {
    let additionalMembers = memberCount - 4;
    return `
          <div class="show-task-contact">
              <div class="show-task-contact-letters" style="background-color: white; color: black; border: 2px solid black;">+${additionalMembers}</div>
          </div>
          `;
  }
  return '';
}

/**
 * Generates HTML for edit icons in subtask interface
 * @returns HTML structure for subtask edit interface
 */
function createSubtaskEditInterface() {
  return `<div id="closeAndCheck" class="closeAndCheck">
      <img id="closeSubtask" onclick="closeSubtask()" src="add_task_img/close.svg" alt="" />
      <div class="subtask-line"></div>
      <img onclick="createSubtask()" id="checkSubtask" src="add_task_img/check.svg" alt="" />
    </div>`;
}

/**
 * Creates a single subtask item display for edit view
 * @param {number} index - subtask index
 * @param {object} item - subtask data
 * @returns HTML for subtask item in edit interface
 */
function buildSubtaskItem(index, item) {
  return `<div id="subtask-tasks${index}" class="subtasks-tasks">
        <div>
          <ul class="subtask-list">
            <li id="subtask-${index}" ondblclick="changeSubtask(${index})" class="subtask-list-element">${item.title}</li>
          </ul>
        </div>
        <div class="subtask-list-icons">
          <img id="edit-logo${index}" onclick="whichSourceSubtask(${index})" src="add_task_img/edit.svg" alt="" />
          <div class="subtask-line"></div>
          <img onclick="deleteSubtask(${index})" src="add_task_img/delete.svg" alt="" />
        </div>
      </div>`;
}

/**
 * Generates subtask item for editor view
 * @param {number} index - subtask identifier
 * @param {object} item - subtask data object
 * @returns HTML structure for subtask in editor
 */
function generateSubtaskEditor(index, item) {
  return `
        <div id="subtask-tasks${index}" class="subtasks-tasks">
          <div>
            <ul class="subtask-list">
              <li id="subtask-${index}" ondblclick="changeSubtask(${index})" class="subtask-list-element">${item.title}</li>
            </ul>
          </div>
          <div class="subtask-list-icons">
            <img id="edit-logo${index}" onclick="whichSourceSubtask(${index})" src="add_task_img/edit.svg" alt="Delete" />
            <div class="subtask-line"></div>
            <img onclick="deleteSubtask(${index})" src="add_task_img/delete.svg" alt="" />
          </div>
        </div>`;
}

/**
 * Creates HTML for contact list item
 * @param {string} identifier - contact unique id
 * @param {string} letters - contact initials
 * @param {object} person - contact data
 * @returns HTML for contact list entry
 */
function createContactListEntry(identifier, letters, person) {
  return `
              <div id="contact${identifier}" onclick='showContact("${letters}", ${JSON.stringify(
    person
  )}, "${identifier}")' class="contact">
                  <div class="contact-letters" style="background-color: ${
                    person.color
                  };">${letters}</div>
                  <div class="contact-data">
                      <div class="contact-name">${person.name}</div>
                      <div class="contact-mail">${person.email}</div>
                  </div>
              </div>
          `;
}

/**
 * Builds a contact avatar icon
 * @param {object} person - contact information
 * @returns HTML for contact avatar in task view
 */
function buildContactAvatar(person) {
  let initials = getInitials(person.name);
  return `
        <div class="show-task-contact">
            <div class="show-task-contact-letters" style="background-color: ${person.color};">${initials}</div>
        </div>
      `;
}

/**
 * Handles overflow for additional contacts in add task interface
 * @param {number} memberCount - number of total contacts
 * @returns HTML for showing additional contact count
 */
function manageAdditionalContacts(memberCount) {
  if (!Array.isArray(selectedContacts)) {
    selectedContacts = Object.keys(selectedContacts)
      .filter((key) => selectedContacts[key] === true)
      .map(Number);
  }

  memberCount = selectedContacts.length;
  if (memberCount > 4) {
    let additionalMembers = memberCount - 4;
    return `
          <div class="show-task-contact">
              <div class="show-task-contact-letters" style="background-color: white; color: black; border: 2px solid black;">+${additionalMembers}</div>
          </div>
          `;
  }
  return '';
}

/**
 * Renders a contact icon with initials
 * @param {object} person - contact data
 * @returns HTML for contact avatar in board view
 */
function createContactBubble(person) {
  const initials = getInitials(person.name);
  return `
            <div class="task-on-board-contact" style="background-color: ${person.color};">${initials}</div>
        `;
}

/**
 * Displays indicator for additional contacts in board view
 * @param {number} additionalMembers - number of remaining contacts
 * @returns HTML for contact overflow indicator
 */
function renderExtraContactsBubble(additionalMembers) {
  return `
          <div class="task-on-board-contact" style="background-color: white; color: black; border: 1px solid black;">+${additionalMembers}</div>
      `;
}

/**
 * Creates a personalized contact bubble for task details
 * @param {object} person - contact information
 * @param {string} userName - current user's name
 * @returns HTML for contact item in task details
 */
function renderTaskDetailContact(person, userName) {
  let displayName = person.name;
  if (person.name === userName) {
    displayName += ' (You)';
  }
  return `
            <div class="show-task-contact">
                <div class="show-task-contact-letters" style="background-color: ${
                  person.color
                };">${getInitials(person.name)}</div>
                <p>${displayName}</p>
            </div>
        `;
}

/**
 * Generates HTML for subtasks in task detail view
 * @param {array} items - collection of subtasks
 * @param {string} identifier - task identifier
 * @returns HTML for subtask list in task details
 */
function constructSubtasksList(items, identifier) {
  return Object.keys(items)
    .map((itemKey) => {
      const item = items[itemKey];
      return `
                <div class="show-task-subtask" onclick="checkSubtask('${identifier}', '${itemKey}', this.querySelector('img'))">
                    <img src="/add_task_img/${
                      item.completed
                        ? 'subtasks_checked'
                        : 'subtasks_notchecked'
                    }.svg" alt="">
                    <p>${item.title}</p>
                </div>
            `;
    })
    .join('');
}

/**
 * Builds the task card HTML for board display
 * @param {string} identifier - task identifier
 * @param {string} categoryStyle - CSS class for task category
 * @param {object} item - task data
 * @param {number} index - task index
 * @param {string} membersHTML - HTML for assigned contacts
 * @param {string} priorityIcon - path to priority image
 * @param {number} totalItems - count of all subtasks
 * @param {number} finishedItems - count of completed subtasks
 * @param {number} completionRate - percentage of completion
 * @returns HTML structure for task card on board
 */
function renderBoardTaskCard(
  identifier,
  categoryStyle,
  item,
  index,
  membersHTML,
  priorityIcon = '',
  totalItems,
  finishedItems,
  completionRate
) {
  let shortDescription = formatTextLength(item.description || '', 50);

  return `
        <div onclick="openTask(${item?.id || 'undefined'})"  // Task-ID prüfen
             draggable="true" 
             ondragstart="startDragging(${identifier}, ${
    item?.id || 'undefined'
  })" 
             class="task-on-board" 
             data-key="${identifier}" 
             data-id="${item?.id || 'undefined'}">

            <div class="task-on-board-category ${categoryStyle}">${
    item?.task_category
  }</div>
            <button class="move-up" onclick="event.stopPropagation(); moveTask('up', ${
              item?.id || 'undefined'
            })">↑</button>
            <button class="move-down" onclick="event.stopPropagation(); moveTask('down', ${
              item?.id || 'undefined'
            })">↓</button>
            <div class="task-on-board-headline">${item?.title}</div>
            <div class="task-on-board-text">${shortDescription}</div>

            ${
              totalItems > 0
                ? `
                <div class="task-on-board-subtasks">
                      <div class="progress-bar-container">
                          <div class="progress-bar" style="width: ${completionRate}%;"></div>
                      </div>
                      <div class="task-on-board-subtasks-text">${finishedItems}/${totalItems} Subtasks</div>
                  </div>`
                : ''
            }
              <div class="task-on-board-lastrow">
                   <div class="task-on-board-contacts" id="task-on-board-contacts${index}">
                       ${membersHTML}
                   </div>
                   <img src="${priorityIcon}" alt="prio" class="task-on-board-relevance">
               </div>
           </div>
      `;
}

/**
 * Creates priority button HTML for task editor
 * @param {string} level - priority level (high/medium/low)
 * @param {string} buttonClass - CSS class for selected state
 * @param {string} iconSrc - path to priority icon
 * @returns HTML for a priority button
 */
function createPriorityButton(level, buttonClass, iconSrc) {
  const label =
    level === 'high' ? 'Urgent' : level === 'medium' ? 'Medium' : 'Low';
  const buttonId = `${level}Button`;
  const imageId = `${level}ButtonImg`;
  const clickHandler = `${level}Button()`;

  return `<button id="${buttonId}" onclick="${clickHandler}" class="prio-buttons pb-edit prio-buttons-shadow ${buttonClass}">${label} <img id="${imageId}" src="${iconSrc}"></button>`;
}

/**
 * Builds a task detail view section
 * @param {object} item - task data
 * @param {string} identifier - task identifier
 * @param {string} categoryStyle - CSS class for category
 * @param {string} membersHTML - HTML for assigned contacts
 * @param {string} itemsHTML - HTML for subtasks
 * @returns HTML structure for detailed task view
 */
function constructTaskDetailView(
  item,
  identifier,
  categoryStyle,
  membersHTML,
  itemsHTML
) {
  return `
          <div class="show-task-firstrow">
              <div class="show-task-category ${categoryStyle}">${
    item.task_category
  }</div>
              <div class="show-task-close" onclick="closeTask()">
                  <img src="img/add-contact-close.svg" alt="">
              </div>
          </div>
          <h1>${item.title}</h1>
          <div class="show-task-scroll">
              <p class="show-task-description">${item.description}</p>
              <div class="show-task-text-rows">
                  <p class="show-task-characteristic">Due date:</p><p>${
                    item.due_date
                  }</p>
              </div>
              <div class="show-task-text-rows">
                  <p class="show-task-characteristic">Priority:</p>
                  <p>${item.priority ? capitalize(item.priority) : 'Medium'}</p>
                    <img src="./add_task_img/${
                      item.priority ? item.priority : 'medium'
                    }.svg" alt="">
              </div>
              <div id="assigned-headline" class="show-task-text-rows pb8 mt12">
                  <p class="show-task-characteristic">Assigned To:</p>
              </div>
              <div class="show-task-contacts">
                  ${membersHTML}
              </div>
              <div id="subtasks-headline" class="show-task-text-rows pb8 mt12">
                  <p class="show-task-characteristic">Subtasks:</p>
              </div>
              <div class="show-task-subtasks">
                  ${itemsHTML}
              </div>
              <div class="show-task-lastrow mt12">
                  <a href="#" class="show-task-lastrow-link" onclick="deleteTask('${identifier}')"><img class="show-task-icon" src="/add_task_img/delete.svg" alt="">Delete</a>
                  <div class="show-task-lastrow-line"></div>
                  <a href="#" class="show-task-lastrow-link" onclick="showEditTask('${identifier}')"><img class="show-task-icon" src="img/edit2.svg" alt="">Edit</a>
              </div>
          </div>
      `;
}

/**
 * Creates header section for task editor
 * @returns HTML for editor header with close button
 */
function createEditorHeader() {
  return `
        <div class="show-task-firstrow flex-end">
            <div class="show-task-close" onclick="closeTask()">
                <img src="img/add-contact-close.svg" alt="">
            </div>
        </div>
    `;
}

/**
 * Builds input field for task editor
 * @param {string} label - field label
 * @param {string} fieldId - input element ID
 * @param {string} value - current field value
 * @returns HTML for editor input field
 */
function createEditorField(label, fieldId, value) {
  return `
        <div class="edit-task-element">
            <p>${label}</p>
            <input type="text" id="${fieldId}" value="${value}">
        </div>
    `;
}

/**
 * Creates date field for task editor
 * @param {string} value - current date value
 * @returns HTML for date input component
 */
function createDateField(value) {
  return `
        <div class="edit-task-element">
            <p>Due Date</p>
            <div class="input-container">
                <input class="edit-task-input" id="edit-date-input" value="${value}" required type="date">
            </div>
        </div>
    `;
}

/**
 * Creates priority selection section for task editor
 * @param {string} highClass - CSS class for high priority button
 * @param {string} highIcon - high priority icon path
 * @param {string} mediumClass - CSS class for medium priority button
 * @param {string} mediumIcon - medium priority icon path
 * @param {string} lowClass - CSS class for low priority button
 * @param {string} lowIcon - low priority icon path
 * @returns HTML for priority selection component
 */
function createPrioritySection(
  highClass,
  highIcon,
  mediumClass,
  mediumIcon,
  lowClass,
  lowIcon
) {
  return `
        <div class="edit-task-element">
            <p>Priority</p>
            <div class="buttons gap-8px">
                ${createPriorityButton('high', highClass, highIcon)}
                ${createPriorityButton('medium', mediumClass, mediumIcon)}
                ${createPriorityButton('low', lowClass, lowIcon)}
            </div>
        </div>
    `;
}

/**
 * Creates assignee selection component for task editor
 * @param {string} membersHTML - HTML for selected contacts
 * @returns HTML for contact assignment section
 */
function createAssigneeSection(membersHTML) {
  return `
        <div class="edit-task-element">
            <p>Assigned to</p>
            <div onclick="showContacts()" class="select-contact select-contact-edit">
                <span>Select contact to assign</span>
                <img src="add_task_img/arrow-down.svg" alt="">
            </div>
            <div class="add-task-contacts add-task-contacts-edit d-none" id="add-task-contacts"></div>
            <div class="edit-task-contacts">
                ${membersHTML}
            </div>
        </div>
    `;
}

/**
 * Creates subtask management section for task editor
 * @param {string} itemsHTML - HTML for existing subtasks
 * @returns HTML for subtask management component
 */
function createSubtaskSection(itemsHTML) {
  return `
        <div class="edit-task-element">
            <p>Subtasks</p>
            <div class="subtask-layout">
                <input placeholder="add new subtask" onclick="newSubtask()" id="subtask-field" class="subtasks-field">
                <div class="d-none" id="edit-subtask"></div>
                <img onclick="newSubtask()" id="subtask-plus" class="subtask-plus" src="add_task_img/plus.svg" alt="">  
            </div>
            <div class="create-subtask pos-relative" id="create-subtask">${itemsHTML}</div>
        </div>
    `;
}

/**
 * Creates footer with save button for task editor
 * @param {string} identifier - task identifier
 * @returns HTML for editor footer
 */
function createEditorFooter(identifier) {
  return `
        <div class="show-task-lastrow">
            <button class="button-dark" onclick="saveTaskChanges('${identifier}')">Ok <img src="add_task_img/check-white.svg" alt=""></button>
        </div>
    `;
}

/**
 * Assembles complete task editor interface
 * @param {object} item - task data
 * @param {string} identifier - task identifier
 * @param {string} membersHTML - HTML for assigned contacts
 * @param {string} itemsHTML - HTML for subtasks
 * @param {string} highClass - CSS class for high priority
 * @param {string} highIcon - high priority icon path
 * @param {string} mediumClass - CSS class for medium priority
 * @param {string} mediumIcon - medium priority icon path
 * @param {string} lowClass - CSS class for low priority
 * @param {string} lowIcon - low priority icon path
 * @returns Complete HTML for task editor
 */
function buildTaskEditor(
  item,
  identifier,
  membersHTML,
  itemsHTML,
  highClass,
  highIcon,
  mediumClass,
  mediumIcon,
  lowClass,
  lowIcon
) {
  return `
          ${createEditorHeader()}
          <div class="edit-scroll-area">
              ${createEditorField('Title', 'edit-title-input', item.title)}
              ${createEditorField(
                'Description',
                'edit-description-input',
                item.description
              )}
              ${createDateField(item.due_date)}
              ${createPrioritySection(
                highClass,
                highIcon,
                mediumClass,
                mediumIcon,
                lowClass,
                lowIcon
              )}
              ${createAssigneeSection(membersHTML)}
              ${createSubtaskSection(itemsHTML)}
          </div>
          ${createEditorFooter(identifier)}
      `;
}

/**
 * Builds form section for add task interface
 * @param {string} title - section title
 * @param {boolean} required - whether field is required
 * @returns HTML for form section header
 */
function createFormSectionHeader(title, required = false) {
  return `<p class="${title.toLowerCase().replace(' ', '-')}">${title}${
    required ? '<span class="span-red">*</span>' : ''
  }</p>`;
}

/**
 * Creates left column of add task form
 * @param {string} membersHTML - HTML for assigned contacts
 * @returns HTML for left section of add task form
 */
function buildAddTaskLeftSection(membersHTML) {
  return `
        ${createFormSectionHeader('Title', true)}
        <input class="title" id="title-input" onkeyup="emptyTitle()" required type="text" placeholder="Enter a title">
        <span id="title-required"></span>
        
        ${createFormSectionHeader('Description')}
        <textarea placeholder="Enter a Description" name="" id="description-input"></textarea>
        
        ${createFormSectionHeader('Assigned to')}
        <div id="select-contact" onclick="showContacts()" class="select-contact">
            <span>Select contact to assign</span>
            <img src="add_task_img/arrow-down.svg" alt="">
        </div>
        <div class="add-task-contacts pos-relative-add-contacts d-none" id="add-task-contacts"></div>
        <div id="add-task-contactsHTML" class="edit-task-contacts-site">
            ${membersHTML}
        </div>
    `;
}

/**
 * Creates right column of add task form
 * @returns HTML for right section of add task form
 */
function buildAddTaskRightSection() {
  return `
        ${createFormSectionHeader('Due date', true)}
        <input class="date-input" onclick="emptyDate()" id="date-input" required type="date">
        <span id="date-required"></span>

        ${createFormSectionHeader('Prio')}
        <div class="buttons">
            <button id="highButton" onclick="highButton()" class="prio-buttons">Urgent <img id="highButtonImg" src="add_task_img/high.svg"></button>
            <button id="mediumButton" onclick="mediumButton()" class="prio-buttons">Medium <img id="mediumButtonImg" src="add_task_img/medium.svg"></button>
            <button id="lowButton" onclick="lowButton()" class="prio-buttons">Low <img id="lowButtonImg" src="add_task_img/low.svg"></button>
        </div>

        ${createFormSectionHeader('Category', true)}
        <div class="dropdown-category">
            <div id="category-input" onclick="category()" required class="category-menu">
                <span id="task-category">Select task category</span>
                <img src="add_task_img/arrow-down.svg" alt="">
            </div>
            <div id="category-required"></div>
            <div class="d-none" id="category"></div>
        </div>

        ${createFormSectionHeader('Subtasks')}
        <div class="subtask-layout">
            <input placeholder="add new subtask" onclick="newSubtask()" id="subtask-field" class="subtasks-field">
            <div class="d-none" id="edit-subtask"></div>
            <img onclick="newSubtask()" id="subtask-plus" class="subtask-plus" src="add_task_img/plus.svg" alt="">
        </div>
        <div id="subtask-required"></div>
        <div class="create-subtask pos-relative-add" id="create-subtask"></div>
        <div class="mobile-create">
            <div class="required-text-mobile bottom-0 required-text-mobile-layer mt12">
                <p><span class="span-red">*</span>This field is required</p>
                <div>
                    <button onclick="createTask()" class="create-task-button-mobile">Create Task <img src="add_task_img/check-white.svg" alt=""></button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Creates add task form interface
 * @param {string} boardType - board category
 * @param {string} membersHTML - HTML for contacts selection
 * @returns Complete HTML for add task interface
 */
function prepareTaskCreationInterface(boardType, membersHTML) {
  return `
            <div class="add-task-section add-task-section-layer width-auto no-margin-left">
          <div class="add-task-firstrow align-items-start">
              <h1 class="headline">Add Task</h1>
              <div class="show-task-close" onclick="closeTask()">
                      <img src="img/add-contact-close.svg" alt="">
                  </div>
          </div>
          <div class="add-task-content border-bottom scroll">
              <div class="left-section">
                  ${buildAddTaskLeftSection(membersHTML)}
              </div>
  
              <div class="parting-line"></div>
  
              <div class="right-section">
                  ${buildAddTaskRightSection()}
              </div>
              
          </div>
          
          
          <div class="add-task-bottom">
              <div class="required-text  required-text-layer">
                  <p><span class="span-red">*</span>This field is required</p>
              </div>
              
  
              <div class="bottom-buttons bottom-buttons-layer">
                  <button onclick="clearTask()" class="clear-button">Clear <img src="add_task_img/x.svg" alt=""></button>
                  <button id="create-task" onclick="createTask('${boardType}')" class="create-task-button">Create Task <img
                          src="add_task_img/check-white.svg" alt=""></button>
              </div>
          </div>
      </div>
      <div id="added-to-board">
          <img id="addedBoardImg" src="./add_task_img/Added to board.svg" alt="">
      </div>
        `;
}
