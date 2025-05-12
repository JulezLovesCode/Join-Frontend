

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
    
    const guestResponse = await apiPost(API_CONFIG.ENDPOINTS.AUTH.GUEST_LOGIN, {}, false);
    
    if (guestResponse && guestResponse.token) {
      
      handleAuthentication({
        token: guestResponse.token,
        username: 'Guest'
      });
    } else {
      
      sessionStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, 'Guest');
    }
    
    
    localStorage.removeItem('greetingShown');
    
    
    window.location.href = 'summary.html';
  } catch (error) {
    console.warn('Guest login API failed, using local guest session:', error);
    sessionStorage.setItem(API_CONFIG.USERNAME_STORAGE_KEY, 'Guest');
    localStorage.removeItem('greetingShown');
    window.location.href = 'summary.html';
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
      
      handleAuthentication(responseData);
      return { success: true, username: responseData.username };
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
  
  localStorage.setItem('userEmail', userIdentifier);
  localStorage.removeItem('greetingShown');
  
  
  window.location.href = 'summary.html';
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
    localStorage.removeItem('saveCredentials');
    
    
    const formElements = [
      document.getElementById('loginEmail'),
      document.getElementById('loginPassword'),
    ];
    formElements.forEach(element => {
      if (element) element.value = '';
    });
    
    
    window.location.href = 'index.html';
  }
}


window.authenticateUser = authenticateUser;
