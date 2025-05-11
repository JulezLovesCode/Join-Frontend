document.addEventListener('DOMContentLoaded', function () {
  initializeAuthState();
  loadActiveNavigationState();
  setupGlobalClickHandler();
});


function setupGlobalClickHandler() {
  
  const profileAvatar = document.getElementById('profileAvatar');
  if (profileAvatar) {
    console.log('Setting up profile avatar click handler');
    profileAvatar.addEventListener('click', function(event) {
      event.stopPropagation(); 
      toggleMenu();
      toggleUserPanel();
    });
  }

  
  document.addEventListener('click', function(event) {
    
    const profilePanel = document.getElementById('profilePanel');
    const userContent = document.getElementById('user-content');
    
    
    const clickedOnAvatar = profileAvatar && profileAvatar.contains(event.target);
    const clickedOnProfilePanel = profilePanel && profilePanel.contains(event.target);
    const clickedOnUserContent = userContent && userContent.contains(event.target);
    
    if (!clickedOnAvatar && !clickedOnProfilePanel && !clickedOnUserContent) {
      
      if (profilePanel) {
        profilePanel.style.display = 'none';
      }
      
      if (userContent) {
        userContent.style.display = 'none';
      }
    }
  });
}

function initializeAuthState() {
  const authToken = localStorage.getItem('token');

  if (!authToken) {
    hideElementIfExists('logoutButton');
  }
}

function hideElementIfExists(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
  }
}


function loadActiveNavigationState() {
  const activeItemId = sessionStorage.getItem('activeLink');
  const activeIconSrc = sessionStorage.getItem('activeLinkImgSrc');
  const activeBgColor =
    sessionStorage.getItem('activeLinkBgColor') || '#091931';
  const activeTextColor =
    sessionStorage.getItem('activeLinkColor') || '#FFFFFF';

  if (activeItemId) {
    clearAllNavigationStates();
    applyActiveState(
      activeItemId,
      activeIconSrc,
      activeBgColor,
      activeTextColor
    );
  }
}

function applyActiveState(itemId, iconSrc, bgColor, textColor) {
  const navItem = document.getElementById(itemId);

  if (navItem) {
    navItem.classList.add('active');

    if (iconSrc) {
      updateItemIcon(navItem, iconSrc);
    }

    applyItemStyles(navItem, bgColor, textColor);
  }
}

function updateItemIcon(navItem, iconSrc) {
  const iconElement = navItem.querySelector('img');
  if (iconElement) {
    iconElement.src = iconSrc;
  }
}

function applyItemStyles(element, bgColor, textColor) {
  if (element) {
    element.style.backgroundColor = bgColor;
    element.style.color = textColor;
  }
}

function clearAllNavigationStates() {
  resetMainNavigation();
  resetSecondaryNavigation();
}

function resetMainNavigation() {
  const defaultNavigationItems = [
    { itemId: 'link-summary', iconPath: '../img/sidebar_summary.svg' },
    { itemId: 'link-task', iconPath: '../img/edit_square.svg' },
    { itemId: 'link-board', iconPath: '../img/sidebar_board.svg' },
    { itemId: 'link-contacts', iconPath: '../img/sidebar_contacts.svg' },
  ];

  defaultNavigationItems.forEach((item) => {
    resetNavigationItem(item.itemId, item.iconPath);
  });
}

function resetNavigationItem(itemId, iconPath) {
  const navItem = document.getElementById(itemId);

  if (navItem) {
    navItem.style.backgroundColor = '';
    navItem.style.color = '';

    if (iconPath) {
      updateItemIcon(navItem, iconPath);
    }
  }
}

function resetSecondaryNavigation() {
  const secondaryItems = document.querySelectorAll('.sidebar-menu-bottom a');

  secondaryItems.forEach((item) => {
    item.classList.remove('active');
  });
}


function routeTo(itemId, iconSrc, destination) {
  if (destination) {
    saveNavigationState(itemId, iconSrc);
    redirectToPage(destination);
  } else {
    performLocalNavigation(itemId);
  }
}

function saveNavigationState(itemId, iconSrc) {
  sessionStorage.setItem('activeLink', itemId);
  sessionStorage.setItem('activeLinkImgSrc', iconSrc);
  sessionStorage.setItem('activeLinkBgColor', '#091931');
  sessionStorage.setItem('activeLinkColor', '#FFFFFF');
}

function redirectToPage(url) {
  window.location.href = url;
}

function performLocalNavigation(itemId) {
  clearAllNavigationStates();

  const primaryItem = document.getElementById(itemId);
  const secondaryItem = document.getElementById(itemId + '2');

  if (primaryItem) {
    primaryItem.classList.add('active');
  }

  if (secondaryItem) {
    secondaryItem.classList.add('active');
  }
}


function openSummaryView() {
  routeTo('link-summary', 'img/sidebar_summary_white.svg', 'summary.html');
}

function openTaskCreation() {
  routeTo('link-task', 'img/edit_square_white.svg', 'add_task.html');
}

function openBoardView() {
  routeTo('link-board', 'img/sidebar_board_white.svg', 'board.html');
}

function openContactsList() {
  routeTo('link-contacts', 'img/sidebar_contacts_white.svg', 'contacts.html');
}

function openPrivacyPolicy() {
  routeTo('link-privacy-policy', null, 'privacy_policy.html');
}

function openLegalNotice() {
  routeTo('link-legal-notice', null, 'legal_notice.html');
}

function openHelpCenter() {
  routeTo('link-help', null, 'help.html');
}

function openRegistration() {
  redirectToPage('signup.html');
}


function toggleUserMenu() {
  const userPanel = document.getElementById('profilePanel');
  if (userPanel) {
    userPanel.style.display = userPanel.style.display === 'block' ? 'none' : 'block';
  }
}


function toggleUserPanel() {
  console.log('toggleUserPanel called');
  const profilePanel = document.getElementById('profilePanel');
  
  if (profilePanel) {
    console.log('Toggling profile panel visibility');
    if (profilePanel.style.display === 'block') {
      profilePanel.style.display = 'none';
    } else {
      profilePanel.style.display = 'block';
    }
  } else {
    console.error('Profile panel element not found with ID: profilePanel');
  }
}


function toggleMenu() {
  console.log('toggleMenu called');
  const userContent = document.getElementById('user-content');
  const profilePanel = document.getElementById('profilePanel');
  
  
  if (userContent) {
    console.log('Legacy dropdown found');
    userContent.style.display = userContent.style.display === 'block' ? 'none' : 'block';
  }
  
  if (profilePanel) {
    console.log('New dropdown found');
    profilePanel.style.display = profilePanel.style.display === 'block' ? 'none' : 'block';
  }
  
  
  if (!userContent && !profilePanel) {
    console.error('No dropdown menu elements found with IDs: user-content or profilePanel');
  }
}


function initializeUserProfile() {
  
  const profileAvatar = document.getElementById('profileAvatar');
  
  
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Guest User';
  
  
  const initials = userName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
      
  
  if (profileAvatar) {
      profileAvatar.textContent = initials;
      
      
      if (!profileAvatar.style.backgroundColor) {
          profileAvatar.style.backgroundColor = getRandomAvatarColor();
      }
  }
}


function getRandomAvatarColor() {
  const colors = [
      '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', 
      '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
      '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B',
      '#FFE62B', '#FF4646', '#FFBB2B', '#9747FF'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

function togglePersistenceOption() {
  const checkboxElement = document.getElementById('checkbox');
  const isChecked = !checkboxElement.src.endsWith('Rectangle1.png');

  updateCheckboxState(checkboxElement, isChecked);
  savePersistencePreference(!isChecked);
}

function updateCheckboxState(element, isCurrentlyChecked) {
  element.src = isCurrentlyChecked
    ? 'img/Rectangle1.png'
    : 'img/Rectangle2.png';
}

function savePersistencePreference(shouldPersist) {
  localStorage.setItem('rememberMe', shouldPersist.toString());
}


function terminateSession() {
  clearStoredUserData();
  redirectToPage('index.html');
}


function logOut() {
  localStorage.removeItem('token');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userName');
  sessionStorage.removeItem('userName');
  
}

function clearStoredUserData() {
  localStorage.removeItem('token');
  localStorage.removeItem('userProfile');
  sessionStorage.removeItem('userName');
  localStorage.removeItem('greetingShown');
}


function createUserProfileInitials() {
  const profileDisplay = document.getElementById('user-logo');
  const userIdentifier = retrieveUserName();

  clearElementContent(profileDisplay);
  displayUserInitials(profileDisplay, userIdentifier);
}

function retrieveUserName() {
  return sessionStorage.getItem('userName') || localStorage.getItem('userName');
}

function clearElementContent(element) {
  if (element) {
    element.innerHTML = '';
  }
}

function displayUserInitials(targetElement, userName) {
  if (!userName) {
    targetElement.innerHTML = 'G';
    return;
  }

  const nameParts = userName.split(' ');
  let initials = 'G';

  if (nameParts.length >= 2) {
    initials = extractInitials(nameParts, 2);
  } else if (nameParts.length === 1) {
    initials = extractInitials(nameParts, 1);
  }

  targetElement.innerHTML = initials;
}

function extractInitials(nameParts, count) {
  let result = '';

  for (let i = 0; i < Math.min(count, nameParts.length); i++) {
    if (nameParts[i].length > 0) {
      result += nameParts[i][0];
    }
  }

  return result;
}
