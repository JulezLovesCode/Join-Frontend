
window.contactSelections = window.contactSelections || {};


window.originalToggleContactSelection = window.toggleContactSelection;
window.toggleContactSelection = function(contactId) {
  console.log("Custom toggleContactSelection called with ID:", contactId);
  
  
  if (typeof window.contactSelections[contactId] === 'undefined') {
    window.contactSelections[contactId] = false;
  }
  
  
  window.contactSelections[contactId] = !window.contactSelections[contactId]; 
  
  
  const listItem = document.getElementById(`contact-list-item-${contactId}`);
  const checkbox = document.getElementById(`contact-checkbox-${contactId}`);
  const checkboxIcon = document.getElementById(`contact-checkbox-icon-${contactId}`);
  
  if (listItem && checkbox && checkboxIcon) {
    if (window.contactSelections[contactId]) {
      listItem.classList.add('contactItemSelected');
      checkbox.checked = true;
      checkboxIcon.src = '../assets/images/checkbox-normal-checked-white.svg';
    } else {
      listItem.classList.remove('contactItemSelected');
      checkbox.checked = false;
      checkboxIcon.src = '../assets/images/checkbox-normal.svg';
    }
  }
  
  
  if (typeof updateSelectedContactsDisplay === 'function') {
    updateSelectedContactsDisplay();
  }
};


function toggleContactSelector() {
  console.log("Toggle contact selector called");
  
  const contactSelectorPanel = document.getElementById('contact-selector-panel');
  if (!contactSelectorPanel) {
    console.error("Contact selector panel not found");
    return;
  }
  
  const wasHidden = contactSelectorPanel.classList.contains('hidden');
  contactSelectorPanel.classList.toggle('hidden');
  
  if (wasHidden) {
    
    console.log("Contact panel opened, rendering list");
    
    
    if ((!window.contactsArray || window.contactsArray.length === 0) && 
        typeof apiGet === 'function' && API_CONFIG) {
      
      
      console.log("No contacts loaded, fetching from API");
      apiGet(API_CONFIG.ENDPOINTS.CONTACTS)
        .then(response => {
          console.log("Fetched contacts:", response);
          
          
          if (response && (Array.isArray(response) || typeof response === 'object')) {
            if (Array.isArray(response)) {
              window.contactsArray = response;
            } else {
              window.contactsArray = Object.values(response);
            }
            
            
            renderContactList();
          }
        })
        .catch(error => {
          console.error("Error fetching contacts:", error);
          
          
          console.log("Will try direct fetch of contacts");
          fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACTS}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${localStorage.getItem('token')}`
            }
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data && (Array.isArray(data) || typeof data === 'object')) {
              if (Array.isArray(data)) {
                window.contactsArray = data;
              } else {
                window.contactsArray = Object.values(data);
              }
              console.log("Successfully fetched contacts directly:", window.contactsArray);
              renderContactList();
            }
          })
          .catch(directError => {
            console.error("Direct fetch of contacts failed:", directError);
            
            window.contactsArray = [];
            
            renderContactList();
          });
          
          
          renderContactList();
        });
    }
    
    
    renderContactList();
  }
}


window.toggleContactSelector = toggleContactSelector;


function renderContactList() {
  console.log("Rendering contact list");
  
  
  const contactsArray = window.contactsArray || [];
  console.log("Contact array length:", contactsArray.length);
  
  const currentUser = localStorage.getItem('userName');
  let contactsHTML = '';
  
  if (!contactsArray || contactsArray.length === 0) {
    contactsHTML = `<div class="contactItem">No contacts available</div>`;
    console.log("No contacts to display");
  } else {
    console.log("Rendering contact list with:", contactsArray);
    
    
    contactsArray.forEach((contact) => {
      
      if (!contact || typeof contact !== 'object') {
        console.error("Invalid contact:", contact);
        return;
      }
      
      
      const contactId = contact.id;
      if (!contactId) {
        console.error("Contact missing ID:", contact);
        return;
      }
      
      
      const contactName = contact.name || "Unnamed Contact";
      console.log(`Processing contact: ${contactName} (ID: ${contactId})`);
      
      
      if (typeof window.contactSelections[contactId] === 'undefined') {
        window.contactSelections[contactId] = false;
      }
      
      const isSelected = window.contactSelections[contactId];
      const selectedClass = isSelected ? 'contactItemSelected' : '';
      
      
      const avatarColor = contact.color || (typeof generateUserColor === 'function' ? 
                          generateUserColor(contactName) : '#2A3647');
      
      
      const initials = typeof getInitials === 'function' ? 
                      getInitials(contactName) : 
                      contactName.charAt(0).toUpperCase();
      
      
      contactsHTML += `
        <div id="contact-list-item-${contactId}" class="contactItem ${selectedClass}" onclick="toggleContactSelection(${contactId})">
          <div class="contactDisplay">
            <div class="contactAvatar" style="background-color: ${avatarColor};">
              ${initials}
            </div>
            <p>${contactName}${contactName === currentUser ? ' (You)' : ''}</p>
          </div>
          <div class="contactSelectionBox">
            <input type="checkbox" class="contact-checkbox" id="contact-checkbox-${contactId}" 
              data-contact-id="${contactId}" ${isSelected ? 'checked' : ''} hidden>
            <img id="contact-checkbox-icon-${contactId}" src="../assets/images/${isSelected ? 'checkbox-normal-checked-white.svg' : 'checkbox-normal.svg'}" alt="checkbox">
          </div>
        </div>
      `;
    });
  }
  
  document.getElementById('contact-selector-panel').innerHTML = contactsHTML;
  updateSelectedContactsDisplay();
}


function toggleContactSelection(contactId) {
  console.log(`Toggling contact selection for ID: ${contactId}`);
  
  
  if (typeof window.contactSelections[contactId] === 'undefined') {
    window.contactSelections[contactId] = false;
  }
  
  
  window.contactSelections[contactId] = !window.contactSelections[contactId];
  
  console.log(`Contact ${contactId} selection state: ${window.contactSelections[contactId]}`);
  
  
  const listItem = document.getElementById(`contact-list-item-${contactId}`);
  const checkbox = document.getElementById(`contact-checkbox-${contactId}`);
  const checkboxIcon = document.getElementById(`contact-checkbox-icon-${contactId}`);
  
  if (listItem && checkbox && checkboxIcon) {
    if (window.contactSelections[contactId]) {
      listItem.classList.add('contactItemSelected');
      checkbox.checked = true;
      checkboxIcon.src = '../assets/images/checkbox-normal-checked-white.svg';
    } else {
      listItem.classList.remove('contactItemSelected');
      checkbox.checked = false;
      checkboxIcon.src = '../assets/images/checkbox-normal.svg';
    }
  } else {
    console.error(`UI elements not found for contact ${contactId}`);
  }
  
  
  updateSelectedContactsDisplay();
}


window.toggleContactSelection = toggleContactSelection;


function updateSelectedContactsDisplay() {
  const selectedContactsContainer = document.getElementById('contact-display-container');
  if (!selectedContactsContainer) {
    console.error("Selected contacts container not found");
    return;
  }
  
  const contactsArray = window.contactsArray || [];
  
  console.log("Updating selected contacts display");
  console.log("Contacts array:", contactsArray);
  console.log("Selections:", window.contactSelections);
  
  
  const selectedContacts = contactsArray.filter(contact => {
    if (!contact || !contact.id) return false;
    
    const contactId = contact.id;
    const isSelected = window.contactSelections[contactId] === true;
    
    console.log(`Contact ${contactId} (${contact.name || 'unnamed'}) selected: ${isSelected}`);
    return isSelected;
  });
  
  console.log("Selected contacts:", selectedContacts);
  
  let selectedContactsHTML = '';
  
  selectedContacts.forEach(contact => {
    
    const contactName = contact.name || "Unnamed Contact";
    
    
    const avatarColor = contact.color || (typeof generateUserColor === 'function' ? 
                        generateUserColor(contactName) : '#2A3647');
    
    
    const initials = typeof getInitials === 'function' ? 
                    getInitials(contactName) : 
                    contactName.charAt(0).toUpperCase();
    
    selectedContactsHTML += `
      <div class="contactDisplay">
        <div class="contactAvatar" style="background-color: ${avatarColor};">
          ${initials}
        </div>
        <p>${contactName}</p>
      </div>
    `;
  });
  
  selectedContactsContainer.innerHTML = selectedContactsHTML;
}


window.updateSelectedContactsDisplay = updateSelectedContactsDisplay;
window.renderContactList = renderContactList;


function clearContactSelections() {
  
  window.contactSelections = {};
  
  
  const contactSelectorPanel = document.getElementById('contact-selector-panel');
  const selectedContactsContainer = document.getElementById('contact-display-container');
  
  if (contactSelectorPanel) {
    const checkboxes = contactSelectorPanel.querySelectorAll('.contact-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    const listItems = contactSelectorPanel.querySelectorAll('.contactItem');
    listItems.forEach(item => {
      item.classList.remove('contactItemSelected');
    });
    
    const checkboxIcons = contactSelectorPanel.querySelectorAll('[id^="contact-checkbox-icon-"]');
    checkboxIcons.forEach(icon => {
      icon.src = '../assets/images/checkbox-normal.svg';
    });
  }
  
  if (selectedContactsContainer) {
    selectedContactsContainer.innerHTML = '';
  }
}