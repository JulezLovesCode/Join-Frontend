const CONTACTS_API_ENDPOINT = 'api/contacts/';

let contacts = []; 
let contactColors = {}; 
let selectedContact = null; 

async function initializeContactsView() {
  await loadContacts();
  renderUserInitials();
  renderContactsList();
}

function renderUserInitials() {
  const profileAvatar = document.getElementById('profileAvatar');
  if (!profileAvatar) return;
  
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Guest User';
  const initials = getInitials(userName);
  profileAvatar.textContent = initials;
}

function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

async function loadContacts() {
  try {
    // Fetch contacts from the API
    const response = await makeApiRequest(CONTACTS_API_ENDPOINT, 'GET');
    
    if (response && !response.error) {
      // Process API response
      contacts = Array.isArray(response) ? response : Object.values(response);
      
      // Ensure all contacts have a color
      contacts.forEach(contact => {
        if (!contactColors[contact.id]) {
          contactColors[contact.id] = generateRandomColor();
        }
        contact.color = contactColors[contact.id];
      });
      
      return contacts;
    } else {
      throw new Error('Error in API response');
    }
  } catch (error) {
    // Show error message to user
    showErrorMessage('Could not load contacts from the server. Please try again later.');
    
    // Return empty array as fallback
    return [];
  }
}

function renderContactsList() {
  const contactsContainer = document.getElementById('contacts-list');
  if (!contactsContainer) return;
  
  // Sort contacts alphabetically
  const sortedContacts = [...contacts].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  // Group contacts by first letter
  const contactsByLetter = {};
  sortedContacts.forEach(contact => {
    const firstLetter = contact.name.charAt(0).toUpperCase();
    if (!contactsByLetter[firstLetter]) {
      contactsByLetter[firstLetter] = [];
    }
    contactsByLetter[firstLetter].push(contact);
  });
  
  // Clear the container
  contactsContainer.innerHTML = '';
  
  // Render contacts by letter groups
  Object.keys(contactsByLetter).sort().forEach(letter => {
    // Add the letter heading
    contactsContainer.innerHTML += `
      <div class="first-letter">${letter}</div>
      <div class="line"></div>
    `;
    
    // Add contacts for this letter
    contactsByLetter[letter].forEach(contact => {
      contactsContainer.innerHTML += renderContactListItem(contact);
    });
  });
}

function renderContactListItem(contact) {
  const initials = getInitials(contact.name);
  const contactClass = selectedContact && selectedContact.id === contact.id ? 'contact selected-contact' : 'contact';
  
  return `
    <div id="contact-${contact.id}" class="${contactClass}" onclick="showContactDetails(${contact.id})">
      <div class="contact-letters" style="background-color: ${contact.color || '#FF7A00'}">${initials}</div>
      <div class="contact-data">
        <div class="contact-name">${contact.name}</div>
        <div class="contact-mail">${contact.email}</div>
      </div>
    </div>
  `;
}

function showContactDetails(contactId) {
  // Find the contact by id
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return;
  
  // Update selected contact
  selectedContact = contact;
  
  // Update the selected contact style
  updateSelectedContactStyle(contactId);
  
  // Get the details container
  const detailsContainer = document.getElementById('contact-details');
  if (!detailsContainer) return;
  
  // For mobile: hide the contacts panel
  if (window.innerWidth <= 1120) {
    const contactsList = document.getElementById('contacts-panel');
    if (contactsList) {
      contactsList.classList.add('d-none');
    }
  }
  
  // Render the contact details
  const initials = getInitials(contact.name);
  detailsContainer.innerHTML = `
    <div class="contact-profile-firstrow">
      <div class="contact-letters-big" style="background-color: ${contact.color || '#FF7A00'}">${initials}</div>
      <div class="contact-profile-firstrow-right">
        <h3>${contact.name}</h3>
        <div class="contact-actions">
          <div class="contact-links" onclick="openEditContactForm(${contact.id})">
            <img class="contact-icon" src="../assets/images/contact-edit.svg" alt="Edit">
            Edit
          </div>
          <div class="contact-links" onclick="deleteContact(${contact.id})">
            <img class="contact-icon" src="../assets/images/contact-delete.svg" alt="Delete">
            Delete
          </div>
        </div>
      </div>
    </div>
    <div class="contact-channels">
      <p>Contact Information</p>
      <div class="padding-top-bottom-27">
        <p>Email</p>
        <a href="mailto:${contact.email}">${contact.email}</a>
      </div>
      <div>
        <p>Phone</p>
        <a href="tel:${contact.phone}" class="black-link">${contact.phone}</a>
      </div>
    </div>
  `;
  
  // Add slide-in animation
  detailsContainer.classList.add('slide-in-right');
}

function updateSelectedContactStyle(contactId) {
  // Remove selected class from all contacts
  const allContacts = document.querySelectorAll('.contact');
  allContacts.forEach(element => {
    element.classList.remove('selected-contact');
  });
  
  // Add selected class to the clicked contact
  const selectedElement = document.getElementById(`contact-${contactId}`);
  if (selectedElement) {
    selectedElement.classList.add('selected-contact');
  }
}

function openContactForm() {
  const modal = document.getElementById('contact-form-overlay');
  if (modal) {
    // Show the modal
    modal.style.display = "flex";
    
    // Add slide-in animation to the panel
    const panel = document.getElementById('contact-form-panel');
    if (panel) {
      panel.classList.add('slide-in-right');
    }
  }
  
  // Clear form fields
  const nameInput = document.getElementById('contact-name-input');
  const emailInput = document.getElementById('contact-email-input');
  const phoneInput = document.getElementById('contact-phone-input');
  
  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  if (phoneInput) phoneInput.value = '';
}

function closeContactForm() {
  const modal = document.getElementById('contact-form-overlay');
  const panel = document.getElementById('contact-form-panel');
  
  if (panel) {
    // Add slide-out animation
    panel.classList.remove('slide-in-right');
    panel.classList.add('slide-out-right');
    
    // Hide the modal after animation completes
    setTimeout(() => {
      if (modal) modal.style.display = "none";
      if (panel) panel.classList.remove('slide-out-right');
    }, 300);
  } else if (modal) {
    // If panel not found, just hide the modal
    modal.style.display = "none";
  }
}

function openEditContactForm(contactId) {
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return;
  
  const modal = document.getElementById('edit-contact-overlay');
  if (modal) {
    modal.classList.remove('d-none');
    
    // Add slide-in animation to the panel
    const panel = document.getElementById('edit-contact-panel');
    if (panel) {
      panel.classList.add('slide-in-right');
    }
  }
  
  // Fill form with contact data
  const idInput = document.getElementById('edit-contact-id');
  const nameInput = document.getElementById('edit-contact-name');
  const emailInput = document.getElementById('edit-contact-email');
  const phoneInput = document.getElementById('edit-contact-phone');
  
  if (idInput) idInput.value = contact.id;
  if (nameInput) nameInput.value = contact.name;
  if (emailInput) emailInput.value = contact.email;
  if (phoneInput) phoneInput.value = contact.phone;
}

function closeEditContactForm() {
  const modal = document.getElementById('edit-contact-overlay');
  const panel = document.getElementById('edit-contact-panel');
  
  if (panel) {
    // Add slide-out animation
    panel.classList.remove('slide-in-right');
    panel.classList.add('slide-out-right');
    
    // Hide the modal after animation completes
    setTimeout(() => {
      if (modal) modal.classList.add('d-none');
      if (panel) panel.classList.remove('slide-out-right');
    }, 300);
  } else if (modal) {
    modal.classList.add('d-none');
  }
}

async function createContact() {
  // Get form values
  const name = document.getElementById('contact-name-input').value;
  const email = document.getElementById('contact-email-input').value;
  const phone = document.getElementById('contact-phone-input').value;
  const color = generateRandomColor();
  
  // Create new contact object
  const newContact = {
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  try {
    // Send contact to the API
    const response = await makeApiRequest(CONTACTS_API_ENDPOINT, 'POST', newContact);
    
    if (response && !response.error) {
      // Save color for the new contact
      contactColors[response.id] = color;
      
      // Close form
      closeContactForm();
      
      // Refresh contacts list
      await loadContacts();
      renderContactsList();
      
      // Show details of the new contact
      showContactDetails(response.id);
      
      // Show success message
      showSuccessMessage('Contact successfully created');
    } else {
      throw new Error('API returned error or invalid response');
    }
  } catch (error) {
    showErrorMessage('Error creating contact. Please try again later.');
  }
}

async function updateContact() {
  // Get form values
  const id = document.getElementById('edit-contact-id').value;
  const name = document.getElementById('edit-contact-name').value;
  const email = document.getElementById('edit-contact-email').value;
  const phone = document.getElementById('edit-contact-phone').value;
  
  // Get existing contact color or generate new one
  const existingContact = contacts.find(c => c.id == id);
  const color = existingContact ? existingContact.color : generateRandomColor();
  
  // Create updated contact object
  const updatedContact = {
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  try {
    // Send updated contact to the API
    const response = await makeApiRequest(`${CONTACTS_API_ENDPOINT}${id}/`, 'PUT', updatedContact);
    
    if (response && !response.error) {
      // Close form
      closeEditContactForm();
      
      // Refresh contacts list
      await loadContacts();
      renderContactsList();
      
      // Show details of the updated contact
      showContactDetails(parseInt(id));
      
      // Show success message
      showSuccessMessage('Contact successfully updated');
    } else {
      throw new Error('API returned error or invalid response');
    }
  } catch (error) {
    showErrorMessage('Error updating contact. Please try again later.');
  }
}

async function deleteContact(contactId) {
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this contact?')) {
    return;
  }
  
  try {
    // Send delete request to API
    const response = await makeApiRequest(`${CONTACTS_API_ENDPOINT}${contactId}/`, 'DELETE');
    
    // Remove color for deleted contact
    delete contactColors[contactId];
    
    // Clear selection if the deleted contact was selected
    if (selectedContact && selectedContact.id === contactId) {
      selectedContact = null;
      
      // Clear the details panel
      const detailsPanel = document.getElementById('contact-details');
      if (detailsPanel) {
        detailsPanel.innerHTML = '';
      }
    }
    
    // Refresh contacts list
    await loadContacts();
    renderContactsList();
    
    // Show success message
    showSuccessMessage('Contact successfully deleted');
    
  } catch (error) {
    showErrorMessage('Error deleting contact');
  }
}

function generateRandomColor() {
  const colors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', 
    '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
    '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B',
    '#FFE62B', '#FF4646', '#FFBB2B', '#9747FF'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

function showSuccessMessage(message) {
  // Create a notification element
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#2A3647';
  notification.style.color = 'white';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.style.zIndex = '9999';
  notification.textContent = message;
  
  // Add to the DOM
  document.body.appendChild(notification);
  
  // Remove after a few seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showErrorMessage(message) {
  // Create a notification element
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#FF3D00';
  notification.style.color = 'white';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.style.zIndex = '9999';
  notification.textContent = message;
  
  // Add to the DOM
  document.body.appendChild(notification);
  
  // Remove after a few seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

window.addEventListener('resize', function() {
  if (selectedContact && window.innerWidth > 1120) {
    const contactsList = document.getElementById('contacts-panel');
    if (contactsList) {
      contactsList.classList.remove('d-none');
    }
  }
});

function mobileBackToContactsList() {
  const contactsList = document.getElementById('contacts-panel');
  const detailsPanel = document.getElementById('contact-details');
  
  if (contactsList) {
    contactsList.classList.remove('d-none');
  }
  
  if (detailsPanel) {
    detailsPanel.innerHTML = '';
  }
}

function terminateUserSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userName');
  sessionStorage.removeItem('userName');
  window.location.href = 'index.html';
}

// Expose functions to global scope to ensure they're available for onclick attributes
window.openContactForm = openContactForm;
window.closeContactForm = closeContactForm;
window.createContact = createContact;
window.openEditContactForm = openEditContactForm;
window.closeEditContactForm = closeEditContactForm;
window.updateContact = updateContact;
window.deleteContact = deleteContact;
window.showContactDetails = showContactDetails;
window.mobileBackToContactsList = mobileBackToContactsList;
window.terminateUserSession = terminateUserSession;