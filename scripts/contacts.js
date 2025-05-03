/**
 * Contacts Manager Module
 * Handles contact data management, rendering, and interaction for the contacts view
 */

// API endpoint for contact operations
const CONTACTS_API_ENDPOINT = 'api/contacts/';

// State Management
let contacts = []; // Array for storing contact data
let contactColors = {}; // Map to store persistent colors for contacts
let selectedContact = null; // Currently selected contact

/**
 * Initializes the contacts view
 */
async function initializeContactsView() {
  await loadContacts();
  renderUserInitials();
  renderContactsList();
}

/**
 * Renders the user initials in the profile avatar
 */
function renderUserInitials() {
  const profileAvatar = document.getElementById('profileAvatar');
  if (!profileAvatar) return;
  
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Guest User';
  const initials = getInitials(userName);
  profileAvatar.textContent = initials;
}

/**
 * Extracts and formats initials from a name
 * @param {string} name - Full name
 * @returns {string} Uppercase initials
 */
function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Fetches contact data from the API
 */
async function loadContacts() {
  try {
    const response = await makeApiRequest(CONTACTS_API_ENDPOINT, 'GET');
    
    if (response && !response.error) {
      contacts = Array.isArray(response) ? response : Object.values(response);
      
      // Assign or retrieve colors for contacts
      contacts.forEach(contact => {
        if (!contactColors[contact.id]) {
          contactColors[contact.id] = generateRandomColor();
        }
        contact.color = contactColors[contact.id];
      });
    }
  } catch (error) {
    console.error('Error loading contacts:', error);
    
    // Create mock contacts if API fails
    const mockContactsJson = localStorage.getItem('mockContacts');
    if (mockContactsJson) {
      try {
        const storedContacts = JSON.parse(mockContactsJson);
        if (Array.isArray(storedContacts) && storedContacts.length > 0) {
          contacts = storedContacts;
          // Assign colors if missing
          contacts.forEach(contact => {
            if (!contact.color) {
              contact.color = contactColors[contact.id] || generateRandomColor();
              contactColors[contact.id] = contact.color;
            }
          });
          console.log("Using contacts from localStorage:", contacts);
          // Save contacts to localStorage
          localStorage.setItem('mockContacts', JSON.stringify(contacts));
        } else {
          createDefaultContacts();
        }
      } catch (e) {
        console.error("Error parsing stored contacts:", e);
        createDefaultContacts();
      }
    } else {
      createDefaultContacts();
    }
  }
}

/**
 * Creates default contacts when no contacts are available
 */
function createDefaultContacts() {
  // Create default contacts
  contacts = [
    { id: 1, name: "Martina Bohm", email: "martina@example.com", phone: "123-456-7890", color: "#FF7A00" },
    { id: 2, name: "Sas Sas", email: "sas@example.com", phone: "234-567-8901", color: "#FF5EB3" },
    { id: 3, name: "Tobias Mal", email: "tobias@example.com", phone: "345-678-9012", color: "#6E52FF" }
  ];
  
  // Assign colors
  contacts.forEach(contact => {
    contactColors[contact.id] = contact.color;
  });
  
  // Save to localStorage
  localStorage.setItem('mockContacts', JSON.stringify(contacts));
  console.log("Created default contacts:", contacts);
}

/**
 * Renders all contacts organized by first letter
 */
function renderContactsList() {
  const contactsContainer = document.getElementById('contacts-list');
  if (!contactsContainer) return;
  
  // Sort contacts alphabetically by name
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
  
  // Render each letter group
  Object.keys(contactsByLetter).sort().forEach(letter => {
    // Add letter header
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

/**
 * Generates HTML for a single contact list item
 * @param {Object} contact - Contact data object
 * @returns {string} HTML for the contact list item
 */
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

/**
 * Displays a contact's details in the right panel
 * @param {number} contactId - ID of the contact to display
 */
function showContactDetails(contactId) {
  // Find the contact by ID
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return;
  
  // Update selected contact
  selectedContact = contact;
  
  // Highlight selected contact in the list
  updateSelectedContactStyle(contactId);
  
  // Get details container
  const detailsContainer = document.getElementById('contact-details');
  if (!detailsContainer) return;
  
  // On mobile, hide the contacts list
  if (window.innerWidth <= 1120) {
    const contactsList = document.getElementById('contacts-panel');
    if (contactsList) {
      contactsList.classList.add('d-none');
    }
  }
  
  // Render contact details
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

/**
 * Updates the visual selection state in the contact list
 * @param {number} contactId - ID of the selected contact
 */
function updateSelectedContactStyle(contactId) {
  // Remove selection from all contacts
  const allContacts = document.querySelectorAll('.contact');
  allContacts.forEach(element => {
    element.classList.remove('selected-contact');
  });
  
  // Add selection to the current contact
  const selectedElement = document.getElementById(`contact-${contactId}`);
  if (selectedElement) {
    selectedElement.classList.add('selected-contact');
  }
}

/**
 * Opens the add contact modal
 */
function openContactForm() {
  const modal = document.getElementById('contact-form-overlay');
  if (modal) {
    modal.classList.remove('d-none');
    
    // Add animation to panel
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

/**
 * Closes the add contact modal
 */
function closeContactForm() {
  const modal = document.getElementById('contact-form-overlay');
  const panel = document.getElementById('contact-form-panel');
  
  if (panel) {
    // Add exit animation
    panel.classList.remove('slide-in-right');
    panel.classList.add('slide-out-right');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      if (modal) modal.classList.add('d-none');
      if (panel) panel.classList.remove('slide-out-right');
    }, 500);
  } else if (modal) {
    modal.classList.add('d-none');
  }
}

/**
 * Opens the edit contact modal with pre-filled data
 * @param {number} contactId - ID of the contact to edit
 */
function openEditContactForm(contactId) {
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return;
  
  const modal = document.getElementById('edit-contact-overlay');
  if (modal) {
    modal.classList.remove('d-none');
    
    // Add animation to panel
    const panel = document.getElementById('edit-contact-panel');
    if (panel) {
      panel.classList.add('slide-in-right');
    }
  }
  
  // Fill form fields with contact data
  const idInput = document.getElementById('edit-contact-id');
  const nameInput = document.getElementById('edit-contact-name');
  const emailInput = document.getElementById('edit-contact-email');
  const phoneInput = document.getElementById('edit-contact-phone');
  
  if (idInput) idInput.value = contact.id;
  if (nameInput) nameInput.value = contact.name;
  if (emailInput) emailInput.value = contact.email;
  if (phoneInput) phoneInput.value = contact.phone;
}

/**
 * Closes the edit contact modal
 */
function closeEditContactForm() {
  const modal = document.getElementById('edit-contact-overlay');
  const panel = document.getElementById('edit-contact-panel');
  
  if (panel) {
    // Add exit animation
    panel.classList.remove('slide-in-right');
    panel.classList.add('slide-out-right');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      if (modal) modal.classList.add('d-none');
      if (panel) panel.classList.remove('slide-out-right');
    }, 500);
  } else if (modal) {
    modal.classList.add('d-none');
  }
}

/**
 * Creates a new contact from the form data
 */
async function createContact() {
  // Get input values
  const name = document.getElementById('contact-name-input').value;
  const email = document.getElementById('contact-email-input').value;
  const phone = document.getElementById('contact-phone-input').value;
  const color = generateRandomColor();
  
  // Create contact object
  const newContact = {
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  try {
    // Try to send to API
    let response;
    try {
      response = await makeApiRequest(CONTACTS_API_ENDPOINT, 'POST', newContact);
    } catch (apiError) {
      console.log('API error, using local storage instead:', apiError);
      response = null;
    }
    
    if (response && !response.error) {
      // Store the color for this contact
      contactColors[response.id] = color;
      
      // Close the form
      closeContactForm();
      
      // Refresh contacts and UI
      await loadContacts();
      renderContactsList();
      
      // Show the new contact details
      showContactDetails(response.id);
      
      // Success message
      showSuccessMessage('Contact successfully created');
    } else {
      // API failed, create contact locally
      console.log('Creating contact locally');
      
      // Generate a new ID for the contact
      const maxId = contacts.reduce((max, contact) => Math.max(max, contact.id || 0), 0);
      newContact.id = maxId + 1;
      
      // Add to local contacts
      contacts.push(newContact);
      
      // Store the color
      contactColors[newContact.id] = color;
      
      // Save to localStorage
      localStorage.setItem('mockContacts', JSON.stringify(contacts));
      
      // Close the form
      closeContactForm();
      
      // Refresh UI
      renderContactsList();
      
      // Show the new contact details
      showContactDetails(newContact.id);
      
      // Success message
      showSuccessMessage('Contact successfully created (saved locally)');
    }
  } catch (error) {
    console.error('Error creating contact:', error);
    showErrorMessage('Error creating contact');
  }
}

/**
 * Updates an existing contact from the form data
 */
async function updateContact() {
  // Get input values
  const id = document.getElementById('edit-contact-id').value;
  const name = document.getElementById('edit-contact-name').value;
  const email = document.getElementById('edit-contact-email').value;
  const phone = document.getElementById('edit-contact-phone').value;
  
  // Find existing contact to preserve color
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
    // Send to API
    const response = await makeApiRequest(`${CONTACTS_API_ENDPOINT}${id}/`, 'PUT', updatedContact);
    
    if (response && !response.error) {
      // Close the form
      closeEditContactForm();
      
      // Refresh contacts and UI
      await loadContacts();
      renderContactsList();
      
      // Show the updated contact details
      showContactDetails(parseInt(id));
      
      // Success message
      showSuccessMessage('Contact successfully updated');
    } else {
      showErrorMessage('Failed to update contact');
    }
  } catch (error) {
    console.error('Error updating contact:', error);
    showErrorMessage('Error updating contact');
  }
}

/**
 * Deletes a contact
 * @param {number} contactId - ID of the contact to delete
 */
async function deleteContact(contactId) {
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this contact?')) {
    return;
  }
  
  try {
    // Send delete request to API
    const response = await makeApiRequest(`${CONTACTS_API_ENDPOINT}${contactId}/`, 'DELETE');
    
    // Remove color mapping
    delete contactColors[contactId];
    
    // Clear selected contact if it was the deleted one
    if (selectedContact && selectedContact.id === contactId) {
      selectedContact = null;
      
      // Clear details panel
      const detailsPanel = document.getElementById('contact-details');
      if (detailsPanel) {
        detailsPanel.innerHTML = '';
      }
    }
    
    // Refresh contacts and UI
    await loadContacts();
    renderContactsList();
    
    // Success message
    showSuccessMessage('Contact successfully deleted');
    
  } catch (error) {
    console.error('Error deleting contact:', error);
    showErrorMessage('Error deleting contact');
  }
}

/**
 * Generates a random color for contact avatars
 * @returns {string} Random HEX color
 */
function generateRandomColor() {
  const colors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', 
    '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
    '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B',
    '#FFE62B', '#FF4646', '#FFBB2B', '#9747FF'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Shows a success message (can be customized with notification)
 * @param {string} message - Message to display
 */
function showSuccessMessage(message) {
  console.log('Success:', message);
  // Add visual notification if needed
}

/**
 * Shows an error message (can be customized with notification)
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  console.error('Error:', message);
  // Add visual notification if needed
}

/**
 * Handles responsive behavior when window is resized
 */
window.addEventListener('resize', function() {
  if (selectedContact && window.innerWidth > 1120) {
    const contactsList = document.getElementById('contacts-panel');
    if (contactsList) {
      contactsList.classList.remove('d-none');
    }
  }
});

/**
 * Handles mobile back button functionality
 */
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

/**
 * Logs out the user and redirects to the login page
 */
function terminateUserSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userName');
  sessionStorage.removeItem('userName');
  window.location.href = 'index.html';
}

/**
 * Toggles the user menu dropdown
 */
function toggleUserMenu() {
  const menu = document.getElementById('profilePanel');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}