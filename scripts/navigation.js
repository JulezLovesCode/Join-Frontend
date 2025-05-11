


function goToSummary() {
  window.location.href = "summary.html";
}


function goToTask() {
  window.location.href = "add_task.html";
}


function goToBoard() {
  window.location.href = "board.html";
}


function goToContacts() {
  window.location.href = "contacts.html";
}


function goToHelp() {
  window.location.href = "help.html";
}


function goToLegalNotice() {
  window.location.href = "legal_notice.html";
}


function goToPrivacyPolicy() {
  window.location.href = "privacy_policy.html";
}


function toggleMenu() {
  const userContent = document.getElementById('user-content');
  
  if (userContent) {
    if (userContent.style.display === 'block') {
      userContent.style.display = 'none';
    } else {
      userContent.style.display = 'block';
    }
  }
}


function logOut() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "index.html";
}


function mobileBackToContactsList() {
  const contactsLibrary = document.getElementById('contacts-panel');
  const contactDetails = document.querySelector('.contact-details-container');
  
  if (contactsLibrary && contactDetails) {
    contactsLibrary.style.display = 'flex';
    contactDetails.style.display = 'none';
  }
}