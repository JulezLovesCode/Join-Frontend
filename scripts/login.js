

window.addEventListener('load', function () {
  initializeLoginSystem();
});


function initializeLoginSystem() {
  const saveCredentials = localStorage.getItem('saveCredentials');
  const checkboxElement = document.getElementById('checkbox');
  const userIdentifier = document.getElementById('loginEmail');
  const userSecret = document.getElementById('loginPassword');


  if (saveCredentials === 'true') {
    checkboxElement.src = '../assets/images/Rectangle2.png';
    // Only prefill email, not password
    userIdentifier.value = localStorage.getItem('userEmail') || '';
    // Password is never stored or retrieved from localStorage
  } else {
    checkboxElement.src = '../assets/images/Rectangle1.png';
  }

  
  if (isAuthenticated()) {
    updateInterfaceForLoggedInUser();
  }

  setupEventHandlers();
}


function setupEventHandlers() {
  const authForm = document.getElementById('signinForm');
  if (authForm) {
    authForm.addEventListener('submit', processAuthRequest);
  }

  document
    .getElementById('checkbox')
    .addEventListener('click', toggleRememberOption);
  document
    .getElementById('signupButton')
    .addEventListener('click', navigateToRegistration);
  document
    .getElementById('guestLoginButton')
    .addEventListener('click', initiateGuestSession);
}


function navigateToRegistration() {
  window.location.href = 'signup.html';
}


async function initiateGuestSession() {
  try {
    // Call the guest login endpoint
    const guestResponse = await apiPost(API_CONFIG.ENDPOINTS.AUTH.GUEST_LOGIN, {}, false);
    
    if (guestResponse && guestResponse.guest_id) {
      // Store guest ID in sessionStorage for guest access
      sessionStorage.setItem(API_CONFIG.GUEST_ID_KEY, guestResponse.guest_id);
      sessionStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, 'Guest');
      
      // Redirect to summary page
      window.location.href = 'summary.html';
    } else {
      throw new Error("Invalid guest login response");
    }
  } catch (error) {
    console.error('Guest login failed:', error);
    showErrorNotification("Could not connect to the server. Please try again later.");
  }
}


function toggleRememberOption() {
  const checkboxElement = document.getElementById('checkbox');
  const saveCredentials = localStorage.getItem('saveCredentials');
  const userIdentifier = document.getElementById('loginEmail').value;
  const userSecret = document.getElementById('loginPassword').value;

  if (saveCredentials === 'true') {
    clearSavedCredentials(checkboxElement);
  } else {
    saveUserCredentials(checkboxElement, userIdentifier, userSecret);
  }
}


function clearSavedCredentials(checkboxElement) {
  checkboxElement.src = '../assets/images/Rectangle1.png';
  localStorage.setItem('saveCredentials', 'false');
  // No longer storing raw credentials
  localStorage.removeItem('userEmail');
}


function saveUserCredentials(checkboxElement, userIdentifier, userSecret) {
  checkboxElement.src = '../assets/images/Rectangle2.png';
  localStorage.setItem('saveCredentials', 'true');
  // Only store email for login form prefill, not password
  localStorage.setItem('userEmail', userIdentifier);
  // We don't store passwords anymore
}


function updateInterfaceForLoggedInUser() {
  document.getElementById('signinForm').style.display = 'none';

  const registrationButton = document.getElementById('signupButton');
  registrationButton.innerText = 'Logout';
  registrationButton.removeEventListener('click', navigateToRegistration);
  registrationButton.addEventListener('click', terminateUserSession);
}


async function processAuthRequest(event) {
  event.preventDefault();

  const userIdentifier = document.getElementById('loginEmail').value;
  const userSecret = document.getElementById('loginPassword').value;

  try {
    const authResult = await authenticateUser(userIdentifier, userSecret);
    if (authResult.success) {
      completeSuccessfulLogin(userIdentifier, authResult.username);
    } else {
      displayAuthError();
    }
  } catch (error) {
    handleLoginFailure(error);
  }
}


async function authenticateUser(userIdentifier, userSecret) {
  try {
    const data = {
      email: userIdentifier,
      password: userSecret,
    };
    
    const responseData = await apiPost(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data, false);

    if (responseData && responseData.token) {
      // Process the response data
      handleAuthentication(responseData);
      
      // Extract user display name - try first_name + last_name first, then username, then email
      let displayName = null;
      
      if (responseData.user) {
        // If user object is available, check for name fields
        if (responseData.user.first_name && responseData.user.last_name) {
          displayName = `${responseData.user.first_name} ${responseData.user.last_name}`;
        } else if (responseData.user.username) {
          displayName = responseData.user.username;
        } else if (responseData.user.email) {
          displayName = responseData.user.email.split('@')[0];
        }
      }
      
      // If no user object or no name was found, try direct properties
      if (!displayName) {
        if (responseData.first_name && responseData.last_name) {
          displayName = `${responseData.first_name} ${responseData.last_name}`;
        } else if (responseData.username) {
          displayName = responseData.username;
        } else if (responseData.name) {
          displayName = responseData.name;
        } else if (responseData.email) {
          displayName = responseData.email.split('@')[0];
        }
      }
      
      // If still no display name, use the login email
      if (!displayName) {
        displayName = userIdentifier.split('@')[0];
      }
      
      // Store the full name
      localStorage.setItem('userFullName', displayName);
      
      return { success: true, username: displayName };
    } else {
      console.error('Authentication failed:', responseData);
      return { success: false };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error };
  }
}


function displayAuthError() {
  document.getElementById('wrongPasswordConteiner').innerHTML =
    'Incorrect email or password. Try again.';
  document.getElementById('pasowrdConteiner').classList.add('login-red');
}


function handleLoginFailure(error) {
  console.error('Login failed:', error);
  
  
  if (error.status === 401) {
    displayAuthError();
  } else if (error.status === 0 || error.name === 'TypeError') {
    
    document.getElementById('wrongPasswordConteiner').innerHTML =
      'Could not connect to server. Please try again later.';
  } else {
    displayAuthError();
  }
}


function completeSuccessfulLogin(userIdentifier, displayName) {
  // Store email only if remember me is checked
  if (localStorage.getItem('saveCredentials') === 'true') {
    localStorage.setItem('userEmail', userIdentifier);
  }
  
  // Store the display name if available
  if (displayName) {
    localStorage.setItem('userFullName', displayName);
  }
  
  // Navigate to the dashboard
  window.location.href = 'summary.html';
}


async function terminateUserSession() {
  try {
    // If user is authenticated, call the logout endpoint
    if (isAuthenticated()) {
      await apiPost(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
    }
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // Clear authentication tokens
    clearAuthentication();
    
    // Clear session data
    sessionStorage.clear();
    
    // Clear form fields if they exist
    const formElements = [
      document.getElementById('loginEmail'),
      document.getElementById('loginPassword'),
    ];
    formElements.forEach(element => {
      if (element) element.value = '';
    });
    
    // Redirect to login page
    window.location.href = 'index.html';
  }
}


window.authenticateUser = authenticateUser;
