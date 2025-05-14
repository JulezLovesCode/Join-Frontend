


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
      
      console.log('Loaded contacts from API:', contacts);
      return contacts;
    } else {
      throw new Error('Error in API response');
    }
  } catch (error) {
    console.error('Error loading contacts from API:', error);
    
    // Show error message to user
    showErrorMessage('Could not load contacts from the server. Please try again later.');
    
    // Return empty array as fallback
    return [];
  }
}


// This function is no longer needed as we use the API exclusively
function createDefaultContacts() {
  contacts = [];
  console.log("Default contacts not created - using API instead");
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


function showContactDetails(contactId) {
  
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
  console.log("Contact form function called");
  const modal = document.getElementById('contact-form-overlay');
  if (modal) {
    console.log("Contact modal found, setting display to block");
    // Use direct style manipulation instead of classList
    modal.style.display = "flex";
    
    const panel = document.getElementById('contact-form-panel');
    if (panel) {
      panel.classList.add('slide-in-right');
    }
  } else {
    console.error("Could not find contact-form-overlay element in openContactForm");
  }
  
  
  const nameInput = document.getElementById('contact-name-input');
  const emailInput = document.getElementById('contact-email-input');
  const phoneInput = document.getElementById('contact-phone-input');
  
  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  if (phoneInput) phoneInput.value = '';
}


function closeContactForm() {
  console.log("Close contact form called");
  const modal = document.getElementById('contact-form-overlay');
  const panel = document.getElementById('contact-form-panel');
  
  if (panel) {
    console.log("Panel found, adding slide-out animation");
    panel.classList.remove('slide-in-right');
    panel.classList.add('slide-out-right');
    
    setTimeout(() => {
      console.log("Animation timeout completed, hiding modal");
      if (modal) modal.style.display = "none";
      if (panel) panel.classList.remove('slide-out-right');
    }, 500);
  } else if (modal) {
    console.log("No panel found, directly hiding modal");
    modal.style.display = "none";
  } else {
    console.error("Could not find modal or panel in closeContactForm");
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
    console.error('Error creating contact:', error);
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
    console.error('Error updating contact:', error);
    showErrorMessage('Error updating contact. Please try again later.');
  }
}


async function deleteContact(contactId) {
  
  if (!confirm('Are you sure you want to delete this contact?')) {
    return;
  }
  
  try {
    
    const response = await makeApiRequest(`${CONTACTS_API_ENDPOINT}${contactId}/`, 'DELETE');
    
    
    delete contactColors[contactId];
    
    
    if (selectedContact && selectedContact.id === contactId) {
      selectedContact = null;
      
      
      const detailsPanel = document.getElementById('contact-details');
      if (detailsPanel) {
        detailsPanel.innerHTML = '';
      }
    }
    
    
    await loadContacts();
    renderContactsList();
    
    
    showSuccessMessage('Contact successfully deleted');
    
  } catch (error) {
    console.error('Error deleting contact:', error);
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
  console.log('Success:', message);
  
}


function showErrorMessage(message) {
  console.error('Error:', message);
  
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


function toggleUserMenu() {
  const menu = document.getElementById('profilePanel');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
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
window.toggleUserMenu = toggleUserMenu;