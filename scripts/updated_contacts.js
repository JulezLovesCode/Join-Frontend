


let contacts = []; 
let contactColors = {}; 
let selectedContact = null; 
let isContactsLoading = false;


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


function showContactsLoadingIndicator() {
  isContactsLoading = true;
  
  
  let loadingElement = document.getElementById('contacts-loading');
  if (!loadingElement) {
    loadingElement = document.createElement('div');
    loadingElement.id = 'contacts-loading';
    loadingElement.classList.add('loading-indicator');
    loadingElement.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading contacts...</p>
    `;
    
    
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


function hideContactsLoadingIndicator() {
  isContactsLoading = false;
  
  const loadingElement = document.getElementById('contacts-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}


async function loadContacts() {
  try {
    
    const response = await apiGet(API_CONFIG.ENDPOINTS.CONTACTS);
    
    if (response && Array.isArray(response)) {
      contacts = response;
    } else if (response && typeof response === 'object') {
      contacts = Object.values(response);
    } else {
      throw new Error("Invalid contacts data format");
    }
    
    
    contacts.forEach(contact => {
      if (!contactColors[contact.id]) {
        contactColors[contact.id] = generateRandomColor();
      }
      contact.color = contactColors[contact.id];
    });
  } catch (error) {
    
    const errorInfo = handleApiError(error);
    console.log("Using mock contacts due to API error:", errorInfo.type);
    
    
    contacts = getMockContacts();
    
    
    contacts.forEach(contact => {
      if (!contactColors[contact.id]) {
        contactColors[contact.id] = generateRandomColor();
      }
      contact.color = contactColors[contact.id];
    });
  }
  
  return contacts;
}


function getMockContacts() {
  return [
    { id: 1, name: "John Doe", email: "john@example.com", phone: "+1 234 567 890", color: "#FF7A00" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+1 234 567 891", color: "#FF5EB3" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", phone: "+1 234 567 892", color: "#6E52FF" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", phone: "+1 234 567 893", color: "#9327FF" },
    { id: 5, name: "Charlie Davis", email: "charlie@example.com", phone: "+1 234 567 894", color: "#00BEE8" }
  ];
}


function renderUserInitials() {
  const profileAvatar = document.getElementById('profileAvatar');
  if (!profileAvatar) return;
  
  const userName = getCurrentUsername();
  const initials = getInitials(userName);
  profileAvatar.textContent = initials;
  
  
  const color = generateColorForContact(userName);
  profileAvatar.style.backgroundColor = color;
}


function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}


function generateColorForContact(name) {
  if (!name) return '#2A3647';
  
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  
  const colors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', 
    '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
    '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B'
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}


function renderContactsList() {
  const contactsContainer = document.getElementById('contacts-list');
  if (!contactsContainer) return;
  
  
  const sortedContacts = [...contacts].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  
  const contactsByLetter = {};
  sortedContacts.forEach(contact => {
    const firstLetter = contact.name.charAt(0).toUpperCase();
    if (!contactsByLetter[firstLetter]) {
      contactsByLetter[firstLetter] = [];
    }
    contactsByLetter[firstLetter].push(contact);
  });
  
  
  contactsContainer.innerHTML = '';
  
  
  if (Object.keys(contactsByLetter).length === 0) {
    contactsContainer.innerHTML = `
      <div class="no-contacts-message">
        <p>No contacts found.</p>
        <p>Click "New contact" to add a new contact.</p>
      </div>
    `;
    return;
  }
  
  
  Object.keys(contactsByLetter).sort().forEach(letter => {
    
    contactsContainer.innerHTML += `
      <div class="first-letter">${letter}</div>
      <div class="line"></div>
    `;
    
    
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


async function showContactDetails(contactId) {
  
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return;
  
  
  selectedContact = contact;
  
  
  updateSelectedContactStyle(contactId);
  
  
  const detailsContainer = document.getElementById('contact-details');
  if (!detailsContainer) return;
  
  
  if (window.innerWidth <= 1120) {
    const contactsList = document.getElementById('contacts-panel');
    if (contactsList) {
      contactsList.classList.add('d-none');
    }
  }
  
  
  detailsContainer.innerHTML = `
    <div class="loading-contact-details">
      <div class="loading-spinner"></div>
      <p>Loading contact details...</p>
    </div>
  `;
  
  try {
    
    const refreshedContact = await apiGet(`${API_CONFIG.ENDPOINTS.CONTACTS}${contactId}/`);
    
    
    if (refreshedContact && !refreshedContact.error) {
      contact.name = refreshedContact.name || contact.name;
      contact.email = refreshedContact.email || contact.email;
      contact.phone = refreshedContact.phone || contact.phone;
      contact.color = contactColors[contactId] || refreshedContact.color || contact.color;
      
      
      const index = contacts.findIndex(c => c.id === contactId);
      if (index !== -1) {
        contacts[index] = contact;
      }
    }
  } catch (error) {
    
    console.warn("Could not refresh contact details:", error);
  }
  
  
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
  
  
  detailsContainer.classList.add('slide-in-right');
}


function updateSelectedContactStyle(contactId) {
  
  const allContacts = document.querySelectorAll('.contact');
  allContacts.forEach(element => {
    element.classList.remove('selected-contact');
  });
  
  
  const selectedElement = document.getElementById(`contact-${contactId}`);
  if (selectedElement) {
    selectedElement.classList.add('selected-contact');
  }
}


function openContactForm() {
  const modal = document.getElementById('contact-form-overlay');
  if (modal) {
    modal.classList.remove('d-none');
    
    
    const panel = document.getElementById('contact-form-panel');
    if (panel) {
      panel.classList.add('slide-in-right');
    }
  }
  
  
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
    
    panel.classList.remove('slide-in-right');
    panel.classList.add('slide-out-right');
    
    
    setTimeout(() => {
      if (modal) modal.classList.add('d-none');
      if (panel) panel.classList.remove('slide-out-right');
    }, 500);
  } else if (modal) {
    modal.classList.add('d-none');
  }
}


function openEditContactForm(contactId) {
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return;
  
  const modal = document.getElementById('edit-contact-overlay');
  if (modal) {
    modal.classList.remove('d-none');
    
    
    const panel = document.getElementById('edit-contact-panel');
    if (panel) {
      panel.classList.add('slide-in-right');
    }
  }
  
  
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
    
    panel.classList.remove('slide-in-right');
    panel.classList.add('slide-out-right');
    
    
    setTimeout(() => {
      if (modal) modal.classList.add('d-none');
      if (panel) panel.classList.remove('slide-out-right');
    }, 500);
  } else if (modal) {
    modal.classList.add('d-none');
  }
}


async function createContact() {
  
  showContactsLoadingIndicator();
  
  
  const name = document.getElementById('contact-name-input').value;
  const email = document.getElementById('contact-email-input').value;
  const phone = document.getElementById('contact-phone-input').value;
  const color = generateRandomColor();
  
  
  if (!name || !email) {
    hideContactsLoadingIndicator();
    showErrorNotification("Name and email are required");
    return;
  }
  
  
  const newContact = {
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  try {
    
    const response = await apiPost(API_CONFIG.ENDPOINTS.CONTACTS, newContact);
    
    
    contactColors[response.id] = color;
    
    
    closeContactForm();
    
    
    await loadContacts();
    renderContactsList();
    
    
    showContactDetails(response.id);
    
    
    showSuccessNotification('Contact successfully created');
  } catch (error) {
    
    const errorInfo = handleApiError(error);
    showErrorNotification(errorInfo.message);
    
    
    if (errorInfo.type === ERROR_TYPES.NETWORK) {
      
      const tempId = Date.now();
      
      
      const tempContact = {
        id: tempId,
        name: name,
        email: email,
        phone: phone,
        color: color,
        isLocalOnly: true 
      };
      
      contacts.push(tempContact);
      contactColors[tempId] = color;
      
      
      renderContactsList();
      showContactDetails(tempId);
      closeContactForm();
      
      showSuccessNotification('Contact saved locally (offline mode)');
    }
  } finally {
    hideContactsLoadingIndicator();
  }
}


async function updateContact() {
  
  showContactsLoadingIndicator();
  
  
  const id = document.getElementById('edit-contact-id').value;
  const name = document.getElementById('edit-contact-name').value;
  const email = document.getElementById('edit-contact-email').value;
  const phone = document.getElementById('edit-contact-phone').value;
  
  
  if (!name || !email) {
    hideContactsLoadingIndicator();
    showErrorNotification("Name and email are required");
    return;
  }
  
  
  const existingContact = contacts.find(c => c.id == id);
  if (!existingContact) {
    hideContactsLoadingIndicator();
    showErrorNotification("Contact not found");
    return;
  }
  
  const color = existingContact.color || generateRandomColor();
  
  
  const updatedContact = {
    name: name,
    email: email,
    phone: phone,
    color: color
  };
  
  
  const oldContact = { ...existingContact };
  
  
  Object.assign(existingContact, updatedContact);
  
  try {
    
    renderContactsList();
    
    
    if (selectedContact && selectedContact.id == id) {
      showContactDetails(parseInt(id));
    }
    
    
    await apiPut(`${API_CONFIG.ENDPOINTS.CONTACTS}${id}/`, updatedContact);
    
    
    closeEditContactForm();
    
    
    showSuccessNotification('Contact successfully updated');
  } catch (error) {
    
    const errorInfo = handleApiError(error);
    
    
    if (errorInfo.type !== ERROR_TYPES.NETWORK) {
      
      Object.assign(existingContact, oldContact);
      
      
      renderContactsList();
      
      
      if (selectedContact && selectedContact.id == id) {
        showContactDetails(parseInt(id));
      }
      
      showErrorNotification(errorInfo.message);
    } else {
      
      showSuccessNotification('Contact updated locally (offline mode)');
      closeEditContactForm();
    }
  } finally {
    hideContactsLoadingIndicator();
  }
}


async function deleteContact(contactId) {
  
  if (!confirm('Are you sure you want to delete this contact?')) {
    return;
  }
  
  
  showContactsLoadingIndicator();
  
  
  const contactIndex = contacts.findIndex(c => c.id == contactId);
  if (contactIndex === -1) {
    hideContactsLoadingIndicator();
    showErrorNotification("Contact not found");
    return;
  }
  
  
  const deletedContact = { ...contacts[contactIndex] };
  
  
  contacts.splice(contactIndex, 1);
  
  
  if (selectedContact && selectedContact.id === contactId) {
    selectedContact = null;
    
    
    const detailsPanel = document.getElementById('contact-details');
    if (detailsPanel) {
      detailsPanel.innerHTML = '';
    }
  }
  
  
  renderContactsList();
  
  try {
    
    await apiDelete(`${API_CONFIG.ENDPOINTS.CONTACTS}${contactId}/`);
    
    
    delete contactColors[contactId];
    
    
    showSuccessNotification('Contact successfully deleted');
  } catch (error) {
    
    const errorInfo = handleApiError(error);
    
    
    if (errorInfo.type !== ERROR_TYPES.NETWORK) {
      
      contacts.splice(contactIndex, 0, deletedContact);
      
      
      renderContactsList();
      
      showErrorNotification(errorInfo.message);
    } else {
      
      showSuccessNotification('Contact deleted locally (offline mode)');
      
      
      if (!window.contactsPendingDeletion) {
        window.contactsPendingDeletion = [];
      }
      window.contactsPendingDeletion.push(contactId);
    }
  } finally {
    hideContactsLoadingIndicator();
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


async function terminateUserSession() {
  try {
    
    if (isAuthenticated()) {
      await apiPost(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
    }
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    
    clearAuthentication();
    
    
    sessionStorage.clear();
    localStorage.removeItem('userEmail');
    localStorage.removeItem('greetingShown');
    
    
    window.location.href = 'index.html';
  }
}


function toggleUserMenu() {
  const menu = document.getElementById('profilePanel');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}