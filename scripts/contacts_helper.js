/**
 * Helpers for the contacts functionality
 */

// Function to validate the contact form
function validateForm(formId) {
  console.log('Validating form:', formId);
  const form = document.getElementById(formId);
  if (!form) {
    console.error('Form not found:', formId);
    return false;
  }
  
  const nameInput = form.querySelector('#name');
  const emailInput = form.querySelector('#email');
  const phoneInput = form.querySelector('#phone');
  
  let isValid = true;
  
  // Clear previous error messages
  form.querySelectorAll('.error-msg').forEach(errorMsg => {
    errorMsg.textContent = '';
  });
  
  // Validate name
  if (!nameInput.validity.valid) {
    const errorMsg = nameInput.nextElementSibling.nextElementSibling;
    errorMsg.textContent = 'Please enter a valid name (first and last name)';
    isValid = false;
  }
  
  // Validate email
  if (!emailInput.validity.valid) {
    const errorMsg = emailInput.nextElementSibling.nextElementSibling;
    errorMsg.textContent = 'Please enter a valid email address';
    isValid = false;
  }
  
  // Validate phone
  if (!phoneInput.validity.valid) {
    const errorMsg = phoneInput.nextElementSibling.nextElementSibling;
    errorMsg.textContent = 'Please enter a valid phone number';
    isValid = false;
  }
  
  return isValid;
}

// Function to add a new contact
function addNewContact() {
  console.log('Adding new contact');
  if (!validateForm('add-contact-form')) {
    console.log('Form validation failed');
    return;
  }
  
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  
  const newContact = {
    name: nameInput.value,
    email: emailInput.value,
    phone: phoneInput.value,
    color: generateRandomColor()
  };
  
  console.log('New contact data:', newContact);
  
  // Use the API function if available
  if (typeof apiPost === 'function') {
    apiPost(API_CONFIG.ENDPOINTS.CONTACTS, newContact)
      .then(response => {
        console.log('Contact created successfully:', response);
        
        // Close the modal
        closeContactCreation();
        closeMobileDialogBackground();
        
        // Refresh contacts list
        if (typeof initializeContactsView === 'function') {
          initializeContactsView();
        }
        
        // Show notification
        showSuccessMessage('Contact created successfully');
      })
      .catch(error => {
        console.error('Error creating contact:', error);
        showErrorMessage('Failed to create contact. Please try again.');
      });
  } else if (typeof createContact === 'function') {
    // Fall back to the original function
    createContact();
  } else {
    console.error('No API function available to create contact');
    alert('Contact creation not available at this time');
  }
}

// Function to show a success message
function showSuccessMessage(message) {
  console.log('Success:', message);
  
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

// Function to show an error message
function showErrorMessage(message) {
  console.error('Error:', message);
  
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

// Function to prevent event propagation
function dontClose(event) {
  event.stopPropagation();
}

// Expose functions to the global scope
window.validateForm = validateForm;
window.addNewContact = addNewContact;
window.showSuccessMessage = showSuccessMessage;
window.showErrorMessage = showErrorMessage;
window.dontClose = dontClose;