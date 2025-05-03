/**
 * Contacts Manager Module
 * Handles contact data management, rendering, and interaction for the contacts view
 */

// State Management
let contacts = []; // Array for storing contact data
let contactColors = {}; // Map to store persistent colors for contacts
let selectedContact = null; // Currently selected contact
let isContactsLoading = false;

/**
 * Initializes the contacts view
 */
async function initializeContactsView() {
  showContactsLoadingIndicator();
  
  try {
    await loadContacts();
    renderUserInitials();
    renderContactsList();
  } catch (error) {
    console.error("Error initializing contacts view:", error);
    showErrorNotification("Could not load contacts. Using sample data.");
  } finally {
    hideContactsLoadingIndicator();
  }
}

/**
 * Shows loading indicator during contacts fetch
 */
function showContactsLoadingIndicator() {
  isContactsLoading = true;
  
  // Create loading UI if needed
  let loadingElement = document.getElementById('contacts-loading');
  if (!loadingElement) {
    loadingElement = document.createElement('div');
    loadingElement.id = 'contacts-loading';
    loadingElement.classList.add('loading-indicator');
    loadingElement.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading contacts...</p>
    `;
    
    // Add some basic inline styles
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.background = 'rgba(255, 255, 255, 0.9)';
    loadingElement.style.padding = '20px';
    loadingElement.style.borderRadius = '10px';
    loadingElement.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    loadingElement.style.zIndex = '1000';
    loadingElement.style.textAlign = 'center';
    
    document.body.appendChild(loadingElement);
  }
  
  loadingElement.style.display = 'block';
}

/**
 * Hides loading indicator after contacts fetch
 */
function hideContactsLoadingIndicator() {
  isContactsLoading = false;
  
  const loadingElement = document.getElementById('contacts-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

/**
 * Fetches contacts from API or initializes with mock data
 */
async function loadContacts() {
  try {
    // Try to get contacts from the API using centralized API functions
    const response = await apiGet(API_CONFIG.ENDPOINTS.CONTACTS);
    
    if (response && Array.isArray(response)) {
      contacts = response;
    } else if (response && typeof response === 'object') {
      contacts = Object.values(response);
    } else {
      throw new Error("Invalid contacts data format");
    }
    
    // Assign or retrieve colors for contacts
    contacts.forEach(contact => {
      if (!contactColors[contact.id]) {
        contactColors[contact.id] = generateRandomColor();
      }
      contact.color = contactColors[contact.id];
    });
  } catch (error) {
    // Use standardized error handling
    const errorInfo = handleApiError(error);
    console.log("Using mock contacts due to API error:", errorInfo.type);
    
    // Initialize with mock data
    contacts = getMockContacts();
    
    // Generate colors for mock contacts
    contacts.forEach(contact => {
      if (!contactColors[contact.id]) {
        contactColors[contact.id] = generateRandomColor();
      }
      contact.color = contactColors[contact.id];
    });
  }
  
  return contacts;
}

/**
 * Provides mock contacts for testing when API is unavailable
 * @returns {Array} Array of mock contact objects
 */
function getMockContacts() {
  return [
    { id: 1, name: "John Doe", email: "john@example.com", phone: "+1 234 567 890", color: "#FF7A00" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+1 234 567 891", color: "#FF5EB3" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", phone: "+1 234 567 892", color: "#6E52FF" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", phone: "+1 234 567 893", color: "#9327FF" },
    { id: 5, name: "Charlie Davis", email: "charlie@example.com", phone: "+1 234 567 894", color: "#00BEE8" }
  ];
}

/**
 * Renders the user initials in the profile avatar
 */
function renderUserInitials() {
  const profileAvatar = document.getElementById('profileAvatar');
  if (!profileAvatar) return;
  
  const userName = getCurrentUsername();
  const initials = getInitials(userName);
  profileAvatar.textContent = initials;
  
  // Generate consistent color for user
  const color = generateColorForContact(userName);
  profileAvatar.style.backgroundColor = color;
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
 * Generates consistent color for contact based on name
 * @param {string} name - Contact name
 * @returns {string} CSS color value
 */
function generateColorForContact(name) {
  if (!name) return '#2A3647';
  
  // Simple hash function for consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use predefined colors for consistency
  const colors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', 
    '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
    '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B'
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
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
  
  // Check if there are any contacts
  if (Object.keys(contactsByLetter).length === 0) {
    contactsContainer.innerHTML = `
      <div class="no-contacts-message">
        <p>No contacts found.</p>
        <p>Click "New contact" to add a new contact.</p>
      </div>
    `;
    return;
  }
  
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
async function showContactDetails(contactId) {
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
  
  // Show loading state
  detailsContainer.innerHTML = `
    <div class="loading-contact-details">
      <div class="loading-spinner"></div>
      <p>Loading contact details...</p>
    </div>
  `;
  
  try {
    // Try to fetch fresh contact details from API
    const refreshedContact = await apiGet(`${API_CONFIG.ENDPOINTS.CONTACTS}${contactId}/`);
    
    // Use refreshed data if available
    if (refreshedContact && !refreshedContact.error) {
      contact.name = refreshedContact.name || contact.name;
      contact.email = refreshedContact.email || contact.email;
      contact.phone = refreshedContact.phone || contact.phone;
      contact.color = contactColors[contactId] || refreshedContact.color || contact.color;
      
      // Update in our contacts array
      const index = contacts.findIndex(c => c.id === contactId);
      if (index !== -1) {
        contacts[index] = contact;
      }
    }
  } catch (error) {
    // Just log the error, we'll continue with the data we have
    console.warn("Could not refresh contact details:", error);
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
  // Show loading indicator
  showContactsLoadingIndicator();
  
  // Get input values
  const name = document.getElementById('contact-name-input').value;
  const email = document.getElementById('contact-email-input').value;
  const phone = document.getElementById('contact-phone-input').value;
  const color = generateRandomColor();
  
  // Validate inputs
  if (!name || !email) {
    hideContactsLoadingIndicator();
    showErrorNotification("Name and email are required");
    return;
  }
  
  // Create contact object
  const newContact = {
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  try {
    // Send to API using centralized API functions
    const response = await apiPost(API_CONFIG.ENDPOINTS.CONTACTS, newContact);
    
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
    showSuccessNotification('Contact successfully created');
  } catch (error) {
    // Use centralized error handling
    const errorInfo = handleApiError(error);
    showErrorNotification(errorInfo.message);
    
    // If network error, try to save locally
    if (errorInfo.type === ERROR_TYPES.NETWORK) {
      // Generate a temporary ID
      const tempId = Date.now();
      
      // Add to local contacts array
      const tempContact = {
        id: tempId,
        name: name,
        email: email,
        phone: phone,
        color: color,
        isLocalOnly: true // Mark as local only
      };
      
      contacts.push(tempContact);
      contactColors[tempId] = color;
      
      // Update UI
      renderContactsList();
      showContactDetails(tempId);
      closeContactForm();
      
      showSuccessNotification('Contact saved locally (offline mode)');
    }
  } finally {
    hideContactsLoadingIndicator();
  }
}

/**
 * Updates an existing contact from the form data
 */
async function updateContact() {
  // Show loading indicator
  showContactsLoadingIndicator();
  
  // Get input values
  const id = document.getElementById('edit-contact-id').value;
  const name = document.getElementById('edit-contact-name').value;
  const email = document.getElementById('edit-contact-email').value;
  const phone = document.getElementById('edit-contact-phone').value;
  
  // Validate inputs
  if (!name || !email) {
    hideContactsLoadingIndicator();
    showErrorNotification("Name and email are required");
    return;
  }
  
  // Find existing contact to preserve color
  const existingContact = contacts.find(c => c.id == id);
  if (!existingContact) {
    hideContactsLoadingIndicator();
    showErrorNotification("Contact not found");
    return;
  }
  
  const color = existingContact.color || generateRandomColor();
  
  // Create updated contact object
  const updatedContact = {
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  // Store old values for rollback if needed
  const oldContact = { ...existingContact };
  
  // Update locally for immediate feedback
  Object.assign(existingContact, updatedContact);
  
  try {
    // Update UI immediately
    renderContactsList();
    
    // If contact was selected, update the details view
    if (selectedContact && selectedContact.id == id) {
      showContactDetails(parseInt(id));
    }
    
    // Send to API
    await apiPut(`${API_CONFIG.ENDPOINTS.CONTACTS}${id}/`, updatedContact);
    
    // Close the form
    closeEditContactForm();
    
    // Success message
    showSuccessNotification('Contact successfully updated');
  } catch (error) {
    // Use centralized error handling
    const errorInfo = handleApiError(error);
    
    // If it's not a network error, revert changes locally
    if (errorInfo.type !== ERROR_TYPES.NETWORK) {
      // Revert the contact to original state
      Object.assign(existingContact, oldContact);
      
      // Update UI
      renderContactsList();
      
      // If contact was selected, update the details view
      if (selectedContact && selectedContact.id == id) {
        showContactDetails(parseInt(id));
      }
      
      showErrorNotification(errorInfo.message);
    } else {
      // For network errors, keep the local changes but inform user
      showSuccessNotification('Contact updated locally (offline mode)');
      closeEditContactForm();
    }
  } finally {
    hideContactsLoadingIndicator();
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
  
  // Show loading indicator
  showContactsLoadingIndicator();
  
  // Find the contact
  const contactIndex = contacts.findIndex(c => c.id == contactId);
  if (contactIndex === -1) {
    hideContactsLoadingIndicator();
    showErrorNotification("Contact not found");
    return;
  }
  
  // Store contact for potential restore
  const deletedContact = { ...contacts[contactIndex] };
  
  // Remove locally for immediate feedback
  contacts.splice(contactIndex, 1);
  
  // Clear selected contact if it was the deleted one
  if (selectedContact && selectedContact.id === contactId) {
    selectedContact = null;
    
    // Clear details panel
    const detailsPanel = document.getElementById('contact-details');
    if (detailsPanel) {
      detailsPanel.innerHTML = '';
    }
  }
  
  // Update UI
  renderContactsList();
  
  try {
    // Send delete request to API
    await apiDelete(`${API_CONFIG.ENDPOINTS.CONTACTS}${contactId}/`);
    
    // Remove color mapping
    delete contactColors[contactId];
    
    // Success message
    showSuccessNotification('Contact successfully deleted');
  } catch (error) {
    // Use centralized error handling
    const errorInfo = handleApiError(error);
    
    // If it's not a network error, restore the contact
    if (errorInfo.type !== ERROR_TYPES.NETWORK) {
      // Restore the contact
      contacts.splice(contactIndex, 0, deletedContact);
      
      // Update UI
      renderContactsList();
      
      showErrorNotification(errorInfo.message);
    } else {
      // For network errors, keep the local deletion but inform user
      showSuccessNotification('Contact deleted locally (offline mode)');
      
      // Mark for deletion when back online
      if (!window.contactsPendingDeletion) {
        window.contactsPendingDeletion = [];
      }
      window.contactsPendingDeletion.push(contactId);
    }
  } finally {
    hideContactsLoadingIndicator();
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
async function terminateUserSession() {
  try {
    // Try to call logout API if authenticated
    if (isAuthenticated()) {
      await apiPost(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
    }
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // Always clear local data regardless of API success
    clearAuthentication();
    
    // Clear additional storage items
    sessionStorage.clear();
    localStorage.removeItem('userEmail');
    localStorage.removeItem('greetingShown');
    
    // Redirect to login page
    window.location.href = 'index.html';
  }
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