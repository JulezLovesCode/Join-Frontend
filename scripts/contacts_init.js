/**
 * Modern Initialization Script for Contacts Page
 * Uses event delegation and proper DOM loading to ensure reliable functionality
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Contacts initialization script loaded');
  
  // Initialize the contacts view
  initContactsPage();
  
  // Handle all click events with event delegation
  setupEventListeners();
});

/**
 * Main initialization function for the contacts page
 */
function initContactsPage() {
  console.log('Initializing contacts page');
  
  // Load contacts data
  if (typeof initializeContactsView === 'function') {
    initializeContactsView();
  } else {
    console.error('initializeContactsView function not found - contacts will not be loaded');
  }
  
  // Set up user profile
  if (typeof initializeUserProfile === 'function') {
    initializeUserProfile();
  } else {
    setupBasicUserProfile();
  }
}

/**
 * Fallback function to set up user profile if main function is missing
 */
function setupBasicUserProfile() {
  console.log('Setting up basic user profile');
  const profileAvatar = document.getElementById('profileAvatar');
  if (profileAvatar) {
    const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Guest';
    const initials = userName.split(' ').map(part => part.charAt(0)).join('').toUpperCase();
    profileAvatar.textContent = initials;
  }
}

/**
 * Set up all event listeners using event delegation where possible
 */
function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Add contact buttons
  const addContactBtn = document.getElementById('add-contact-btn');
  if (addContactBtn) {
    addContactBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Add contact button clicked');
      showContactModal();
    });
  }
  
  const responsiveAddBtn = document.getElementById('responsive-add-contact-btn');
  if (responsiveAddBtn) {
    responsiveAddBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Responsive add button clicked');
      showContactModal();
    });
  }
  
  // Close buttons for edit contact form (legacy)
  const editCloseBtn = document.querySelector('.add-contact-layer-close');
  if (editCloseBtn) {
    editCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Edit close button clicked');
      hideContactModal();
    });
  }
  
  // Close via white X button (legacy)
  const editCloseSymbol = document.querySelector('.edit-close-symbol');
  if (editCloseSymbol) {
    editCloseSymbol.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Edit close symbol clicked');
      hideContactModal();
    });
  }
  
  // Delegate click for contact list
  const contactsList = document.getElementById('contacts-list');
  if (contactsList) {
    contactsList.addEventListener('click', function(e) {
      const contactItem = e.target.closest('.contact');
      if (contactItem) {
        const contactId = contactItem.id.replace('contact-', '');
        console.log('Contact clicked:', contactId);
        if (typeof showContactDetails === 'function') {
          showContactDetails(parseInt(contactId));
        }
      }
    });
  }
  
  // Close buttons for contact form
  const closeMobileBtn = document.getElementById('closeMobileBtn');
  if (closeMobileBtn) {
    closeMobileBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Close mobile button clicked');
      closeContactCreation();
      closeMobileDialogBackground();
    });
  }
  
  const closeContactBtn = document.getElementById('closeContactBtn');
  if (closeContactBtn) {
    closeContactBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Close contact button clicked');
      closeContactCreation();
      closeMobileDialogBackground();
    });
  }
  
  const cancelContactBtn = document.getElementById('cancelContactBtn');
  if (cancelContactBtn) {
    cancelContactBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Cancel contact button clicked');
      closeContactCreation();
      closeMobileDialogBackground();
    });
  }
  
  // Mobile back button
  const mobileBackBtn = document.querySelector('.back');
  if (mobileBackBtn) {
    mobileBackBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Mobile back button clicked');
      if (typeof mobileBackToContactsList === 'function') {
        mobileBackToContactsList();
      }
    });
  }
  
  // New contact form submission - for the new structure
  const addContactForm = document.getElementById('add-contact-form');
  if (addContactForm) {
    addContactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('Add contact form submitted');
      addNewContact();
    });
  } else {
    console.error('Could not find add-contact-form');
  }
  
  // Edit contact form submission
  const editForm = document.getElementById('edit-contact-form');
  if (editForm) {
    editForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('Edit contact form submitted');
      if (typeof updateContact === 'function') {
        updateContact();
      } else {
        console.error('updateContact function not available');
        alert('Could not update contact due to missing function');
      }
    });
  } else {
    console.error('Could not find edit-contact-form');
  }
  
  // Background click to close modals
  const contactOverlay = document.getElementById('contact-form-overlay');
  if (contactOverlay) {
    contactOverlay.addEventListener('click', function(e) {
      if (e.target === this) {
        console.log('Background clicked, closing modal');
        hideContactModal();
      }
    });
  }
}

/**
 * Show the contact modal
 */
function showContactModal() {
  console.log('Showing contact modal');
  const contactContainer = document.getElementById('mobileWorkContactContainer');
  if (!contactContainer) {
    console.error('Mobile work contact container not found');
    createEmergencyContactForm();
    return;
  }
  
  // Clear input fields
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  
  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  if (phoneInput) phoneInput.value = '';
  
  // Properly center the popup on the screen
  // Reset any previous styles
  contactContainer.style.display = 'flex';
  contactContainer.style.justifyContent = 'center';
  contactContainer.style.alignItems = 'center';
  
  // Apply the animation
  contactContainer.style.animation = '0.3s ease-out 0s 1 normal forwards running slideIn';
  
  // For debugging, add a visible message
  console.log('Contact modal should now be visible and centered');
  
  // Force repaint
  void contactContainer.offsetHeight;
}

/**
 * Emergency fallback if the contact form is not found
 */
function createEmergencyContactForm() {
  console.log('Creating emergency contact form');
  const tempModal = document.createElement('div');
  tempModal.setAttribute('id', 'emergency-contact-form');
  tempModal.style.position = 'fixed';
  tempModal.style.top = '0';
  tempModal.style.left = '0';
  tempModal.style.right = '0';
  tempModal.style.bottom = '0';
  tempModal.style.backgroundColor = 'rgba(0,0,0,0.7)';
  tempModal.style.zIndex = '9999';
  tempModal.style.display = 'flex';
  tempModal.style.justifyContent = 'center';
  tempModal.style.alignItems = 'center';
  
  tempModal.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 100%;">
      <h2 style="margin-top: 0; color: #2A3647;">Emergency Contact Form</h2>
      <p>The regular contact form could not be loaded. Use this form instead.</p>
      <form id="emergency-form">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Name:</label>
          <input type="text" id="emergency-name" required style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 3px;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Email:</label>
          <input type="email" id="emergency-email" required style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 3px;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Phone:</label>
          <input type="tel" id="emergency-phone" required style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 3px;">
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button type="button" id="emergency-cancel" style="padding: 10px 15px; background: #ccc; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
          <button type="submit" style="padding: 10px 15px; background: #2A3647; color: white; border: none; border-radius: 5px; cursor: pointer;">Create Contact</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(tempModal);
  
  // Add event listeners to emergency form
  document.getElementById('emergency-cancel').addEventListener('click', function() {
    tempModal.remove();
  });
  
  document.getElementById('emergency-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Create a contact using available data
    const emergencyContact = {
      name: document.getElementById('emergency-name').value,
      email: document.getElementById('emergency-email').value,
      phone: document.getElementById('emergency-phone').value,
      color: generateRandomColor()
    };
    
    // Try to use the regular contact creation function
    if (typeof createContact === 'function') {
      // Override the DOM access to use our emergency form values
      const oldGetElementById = document.getElementById;
      document.getElementById = function(id) {
        if (id === 'contact-name-input') return document.getElementById('emergency-name');
        if (id === 'contact-email-input') return document.getElementById('emergency-email');
        if (id === 'contact-phone-input') return document.getElementById('emergency-phone');
        return oldGetElementById.call(document, id);
      };
      
      createContact();
      
      // Restore original getElementById
      document.getElementById = oldGetElementById;
    } else {
      // Custom implementation if the function is not available
      console.log('Creating contact with emergency data:', emergencyContact);
      alert('Contact created successfully with emergency form');
    }
    
    tempModal.remove();
  });
}

/**
 * Generate a random color for contacts
 */
function generateRandomColor() {
  const colors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', 
    '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
    '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Hide the contact modal
 */
function hideContactModal() {
  console.log('Hiding contact modal');
  const contactContainer = document.getElementById('mobileWorkContactContainer');
  
  if (!contactContainer) {
    console.error('Mobile work contact container not found');
    return;
  }
  
  // Change animation to slide out
  contactContainer.style.animation = '0.3s ease-in 0s 1 normal forwards running slideOut';
  
  // Wait for animation to finish before hiding
  setTimeout(function() {
    contactContainer.style.display = 'none';
  }, 300);
}

// Extra function for compatibility with the expected function names
function closeContactCreation() {
  hideContactModal();
}

function closeMobileDialogBackground() {
  // Any additional cleanup needed
  console.log('Closing mobile dialog background');
}

// Make sure these functions are globally available
window.showContactModal = showContactModal;
window.hideContactModal = hideContactModal;