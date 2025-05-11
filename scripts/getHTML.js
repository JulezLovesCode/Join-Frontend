
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


function formatTextLength(text, charLimit) {
  text = text || '';
  return text.length > charLimit ? text.substring(0, charLimit) + '...' : text;
}


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


function createSubtaskEditInterface() {
  return `<div id="closeAndCheck" class="closeAndCheck">
      <img id="closeSubtask" onclick="closeSubtask()" src="add_task_img/close.svg" alt="" />
      <div class="subtask-line"></div>
      <img onclick="createSubtask()" id="checkSubtask" src="add_task_img/check.svg" alt="" />
    </div>`;
}


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


function buildContactAvatar(person) {
  let initials = getInitials(person.name);
  return `
        <div class="show-task-contact">
            <div class="show-task-contact-letters" style="background-color: ${person.color};">${initials}</div>
        </div>
      `;
}


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


function createContactBubble(person) {
  const initials = getInitials(person.name);
  return `
            <div class="task-on-board-contact" style="background-color: ${person.color};">${initials}</div>
        `;
}


function renderExtraContactsBubble(additionalMembers) {
  return `
          <div class="task-on-board-contact" style="background-color: white; color: black; border: 1px solid black;">+${additionalMembers}</div>
      `;
}


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
        <div onclick="openTask(${item?.id || 'undefined'})"  
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


function createPriorityButton(level, buttonClass, iconSrc) {
  const label =
    level === 'high' ? 'Urgent' : level === 'medium' ? 'Medium' : 'Low';
  const buttonId = `${level}Button`;
  const imageId = `${level}ButtonImg`;
  const clickHandler = `${level}Button()`;

  return `<button id="${buttonId}" onclick="${clickHandler}" class="prio-buttons pb-edit prio-buttons-shadow ${buttonClass}">${label} <img id="${imageId}" src="${iconSrc}"></button>`;
}


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


function createEditorHeader() {
  return `
        <div class="show-task-firstrow flex-end">
            <div class="show-task-close" onclick="closeTask()">
                <img src="img/add-contact-close.svg" alt="">
            </div>
        </div>
    `;
}


function createEditorField(label, fieldId, value) {
  return `
        <div class="edit-task-element">
            <p>${label}</p>
            <input type="text" id="${fieldId}" value="${value}">
        </div>
    `;
}


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


function createEditorFooter(identifier) {
  return `
        <div class="show-task-lastrow">
            <button class="button-dark" onclick="saveTaskChanges('${identifier}')">Ok <img src="add_task_img/check-white.svg" alt=""></button>
        </div>
    `;
}


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


function createFormSectionHeader(title, required = false) {
  return `<p class="${title.toLowerCase().replace(' ', '-')}">${title}${
    required ? '<span class="span-red">*</span>' : ''
  }</p>`;
}


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
