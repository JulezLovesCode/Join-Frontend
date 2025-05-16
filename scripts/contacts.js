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
  console.log("Opening edit form for contact ID:", contactId);
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) {
    console.error("Contact not found with ID:", contactId);
    return;
  }
  
  const modal = document.getElementById('edit-contact-overlay');
  if (modal) {
    modal.style.display = "block";
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
  
  // Add event listeners to close buttons
  const closeButtons = document.querySelectorAll('.edit-close-btn');
  closeButtons.forEach(button => {
    button.onclick = closeEditContactForm;
  });
  
  document.getElementById('cancel-edit-btn').onclick = closeEditContactForm;
}

function closeEditContactForm() {
  console.log("Closing edit contact form");
  const modal = document.getElementById('edit-contact-overlay');
  
  if (modal) {
    modal.style.display = "none";
  }
}

async function createContact() {
  // Get form values
  const name = document.getElementById('contact-name-input').value;
  const email = document.getElementById('contact-email-input').value;
  const phone = document.getElementById('contact-phone-input').value;
  const color = generateRandomColor();
  
  // Validate inputs
  if (!name || !email || !phone) {
    showErrorMessage('Please fill in all required fields');
    return;
  }
  
  // Validate email format
  if (!validateEmail(email)) {
    showErrorMessage('Please enter a valid email address');
    return;
  }
  
  // Create new contact object
  const newContact = {
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  try {
    // First check if email already exists - this avoids server errors
    const existingContacts = contacts.filter(c => c.email && c.email.toLowerCase() === email.toLowerCase());
    if (existingContacts.length > 0) {
      showErrorMessage('A contact with this email already exists');
      return;
    }
    
    // Try to create the contact
    showSuccessMessage('Creating contact...');
    
    // Send contact to the API with proper error handling
    const response = await makeApiRequest(CONTACTS_API_ENDPOINT, 'POST', newContact);
    
    if (!response) {
      throw new Error('No response from server');
    }
    
    if (response.email && Array.isArray(response.email)) {
      throw new Error('Email: ' + response.email[0]);
    }
    
    if (response.error || response.detail) {
      throw new Error(response.error || response.detail || 'Error creating contact');
    }
    
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
  } catch (error) {
    console.error('Error creating contact:', error);
    
    // Handle specific errors
    if (error.message && error.message.includes('email already exists')) {
      showErrorMessage('A contact with this email already exists');
    } else {
      showErrorMessage(error.message || 'Error creating contact. Please try again later.');
    }
  }
}

// Helper function to validate email format
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

async function updateContact() {
  // Get form values
  const id = document.getElementById('edit-contact-id').value;
  const name = document.getElementById('edit-contact-name').value;
  const email = document.getElementById('edit-contact-email').value;
  const phone = document.getElementById('edit-contact-phone').value;
  
  console.log("Updating contact with ID:", id, "Name:", name, "Email:", email);
  
  // Validate inputs
  if (!name || !email || !phone) {
    showErrorMessage('Please fill in all required fields');
    return;
  }
  
  // Validate email format
  if (!validateEmail(email)) {
    showErrorMessage('Please enter a valid email address');
    return;
  }
  
  // Get existing contact color or generate new one
  const existingContact = contacts.find(c => c.id == id);
  if (!existingContact) {
    showErrorMessage('Contact not found');
    return;
  }
  
  const color = existingContact.color || generateRandomColor();
  
  // Create updated contact object
  const updatedContact = {
    id: id, // Include ID explicitly
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  try {
    // If email hasn't changed, we can simplify the update
    const emailChanged = existingContact.email.toLowerCase() !== email.toLowerCase();
    console.log("Email changed:", emailChanged, "From:", existingContact.email, "To:", email);
    
    if (emailChanged) {
      // Check for duplicate email with other contacts
      const duplicateEmail = contacts.find(c => 
        c.id != id && 
        c.email && 
        c.email.toLowerCase() === email.toLowerCase()
      );
      
      if (duplicateEmail) {
        showErrorMessage('A different contact with this email already exists');
        return;
      }
    }
    
    // Show processing message
    showSuccessMessage('Updating contact...');
    
    // Create a deep copy of the existing contact to preserve all fields
    const completeUpdatedContact = {
      ...existingContact,
      name: name,
      email: email,
      phone: phone,
      color: color
    };
    
    console.log("Sending update to API:", completeUpdatedContact);
    
    let response;
    
    // Handle update differently based on whether email changed
    if (!emailChanged) {
      // If email hasn't changed, update other fields using PATCH
      // This avoids triggering the email validation
      const fieldsToUpdate = {
        name: name,
        phone: phone,
        color: color
      };
      
      console.log("Using PATCH to update non-email fields:", fieldsToUpdate);
      response = await makeApiRequest(`${CONTACTS_API_ENDPOINT}${id}/`, 'PATCH', fieldsToUpdate);
    } else {
      // If email changed, using PUT for a full update but omit the ID
      const contactForUpdate = { ...completeUpdatedContact };
      delete contactForUpdate.id; // Remove ID since it's read-only on server
      
      console.log("Using PUT for complete update with new email:", contactForUpdate);
      response = await makeApiRequest(`${CONTACTS_API_ENDPOINT}${id}/`, 'PUT', contactForUpdate);
    }
    
    console.log("API update response:", response);
    
    // Use a separate variable to track if there was an error
    let hasError = false;

    // Check if the response contains any data
    if (!response) {
      // No response at all
      throw new Error('No response received from server');
    }
    
    // Check if this is a successful response (doesn't have error fields)
    const isSuccess = !(
      (response.email && (Array.isArray(response.email) || typeof response.email === 'string')) ||
      response.error || 
      response.detail
    );
    
    // If it's a success or we're not changing email, consider it successful
    if (isSuccess || !emailChanged) {
      // Success! No errors to handle
      hasError = false;
      
      // Close the form on success
      closeEditContactForm();
      
      // Show success message 
      showSuccessMessage('Contact successfully updated');
      
      // Fetch updated contacts from the server first, then update UI
      await loadContacts();
      renderContactsList();
      showContactDetails(parseInt(id));
    } else {
      // We only get here if there's an error AND we changed the email
      if (response.email) {
        // If the error is about email already existing, ignore it when appropriate
        const errorMsg = Array.isArray(response.email) ? response.email[0] : response.email;
        
        if (errorMsg.includes("already exists") && !emailChanged) {
          // Simply ignore the error - we've already confirmed the email hasn't changed
          console.log("Ignoring 'email already exists' error since email hasn't changed");
          
          // Close the form and update UI
          closeEditContactForm();
          showSuccessMessage('Contact successfully updated');
          await loadContacts();
          renderContactsList();
          showContactDetails(parseInt(id));
        } else {
          // For any other email error or when email has changed, show it
          showErrorMessage(`Please use a different email address`);
          // Don't close the form so user can fix the email
        }
      } else if (response.error || response.detail) {
        // For other API errors, show message and close form
        if (response.detail) {
          showErrorMessage(response.detail);
        } else {
          showErrorMessage(response.error);
        }
        closeEditContactForm();
      }
    }
    
  } catch (error) {
    console.error("Error updating contact:", error);
    
    // Close the form for unexpected errors
    closeEditContactForm();
    
    // Show a user-friendly error message
    showErrorMessage(error.message || 'Error updating contact. Please try again later.');
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