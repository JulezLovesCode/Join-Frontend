// Ensure global objects exist
window.contactSelections = window.contactSelections || {};

// Replace the original toggleContactSelection with our version
window.originalToggleContactSelection = window.toggleContactSelection;
window.toggleContactSelection = function(contactId) {
  console.log("Custom toggleContactSelection called with ID:", contactId);
  
  // Initialize if needed
  if (typeof window.contactSelections[contactId] === 'undefined') {
    window.contactSelections[contactId] = false;
  }
  
  // Toggle selection state
  window.contactSelections[contactId] = !window.contactSelections[contactId]; 
  
  // Update UI
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
  
  // Update the display of selected contacts
  if (typeof updateSelectedContactsDisplay === 'function') {
    updateSelectedContactsDisplay();
  }
};

/**
 * Toggles the visibility of the contact selection panel
 */
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
    // Panel is now visible, so render the contact list
    console.log("Contact panel opened, rendering list");
    
    // Check if we have contacts
    if ((!window.contactsArray || window.contactsArray.length === 0) && 
        typeof apiGet === 'function' && API_CONFIG) {
      
      // Try to fetch contacts again if none are loaded
      console.log("No contacts loaded, fetching from API");
      apiGet(API_CONFIG.ENDPOINTS.CONTACTS)
        .then(response => {
          console.log("Fetched contacts:", response);
          
          // Process and store contacts
          if (response && (Array.isArray(response) || typeof response === 'object')) {
            if (Array.isArray(response)) {
              window.contactsArray = response;
            } else {
              window.contactsArray = Object.values(response);
            }
            
            // Render with newly fetched contacts
            renderContactList();
          }
        })
        .catch(error => {
          console.error("Error fetching contacts:", error);
          
          // Fetch contacts directly from the API
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
            // Only then fall back to mockContacts, but don't save them to localStorage
            window.contactsArray = [];
            // In a real scenario, we would show an error to the user
            renderContactList();
          });
          
          // Render mock contacts
          renderContactList();
        });
    }
    
    // Always try to render what we have
    renderContactList();
  }
}

// Expose function globally
window.toggleContactSelector = toggleContactSelector;

/**
 * Renders the contact list in the selection panel
 */
function renderContactList() {
  console.log("Rendering contact list");
  
  // Get contacts array and ensure it exists
  const contactsArray = window.contactsArray || [];
  console.log("Contact array length:", contactsArray.length);
  
  const currentUser = localStorage.getItem('userName');
  let contactsHTML = '';
  
  if (!contactsArray || contactsArray.length === 0) {
    contactsHTML = `<div class="contactItem">No contacts available</div>`;
    console.log("No contacts to display");
  } else {
    console.log("Rendering contact list with:", contactsArray);
    
    // Process each contact
    contactsArray.forEach((contact) => {
      // Make sure contact is a valid object
      if (!contact || typeof contact !== 'object') {
        console.error("Invalid contact:", contact);
        return;
      }
      
      // Ensure contact has an ID
      const contactId = contact.id;
      if (!contactId) {
        console.error("Contact missing ID:", contact);
        return;
      }
      
      // Ensure contact has a name
      const contactName = contact.name || "Unnamed Contact";
      console.log(`Processing contact: ${contactName} (ID: ${contactId})`);
      
      // Initialize selection state if needed
      if (typeof window.contactSelections[contactId] === 'undefined') {
        window.contactSelections[contactId] = false;
      }
      
      const isSelected = window.contactSelections[contactId];
      const selectedClass = isSelected ? 'contactItemSelected' : '';
      
      // Generate avatar color
      const avatarColor = contact.color || (typeof generateUserColor === 'function' ? 
                          generateUserColor(contactName) : '#2A3647');
      
      // Generate initials
      const initials = typeof getInitials === 'function' ? 
                      getInitials(contactName) : 
                      contactName.charAt(0).toUpperCase();
      
      // Create HTML for this contact
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

/**
 * Toggles the selection state of a contact
 * @param {number} contactId - The ID of the contact to toggle
 */
function toggleContactSelection(contactId) {
  console.log(`Toggling contact selection for ID: ${contactId}`);
  
  // Initialize if needed
  if (typeof window.contactSelections[contactId] === 'undefined') {
    window.contactSelections[contactId] = false;
  }
  
  // Toggle selection state
  window.contactSelections[contactId] = !window.contactSelections[contactId];
  
  console.log(`Contact ${contactId} selection state: ${window.contactSelections[contactId]}`);
  
  // Update UI
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
  
  // Update the display of selected contacts
  updateSelectedContactsDisplay();
}

// Expose function globally
window.toggleContactSelection = toggleContactSelection;

/**
 * Updates the UI to display selected contacts
 */
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
  
  // Get all selected contacts
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
    // Ensure contact has a name
    const contactName = contact.name || "Unnamed Contact";
    
    // Generate avatar color
    const avatarColor = contact.color || (typeof generateUserColor === 'function' ? 
                        generateUserColor(contactName) : '#2A3647');
    
    // Generate initials
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

// Expose these functions globally
window.updateSelectedContactsDisplay = updateSelectedContactsDisplay;
window.renderContactList = renderContactList;

/**
 * Clears all contact selections
 */
function clearContactSelections() {
  // Reset all selections
  window.contactSelections = {};
  
  // Update UI
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