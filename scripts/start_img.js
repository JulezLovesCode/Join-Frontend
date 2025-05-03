/**
 * Manages responsive interface elements based on viewport dimensions
 */
function adjustInterfaceElements() {
  const displayElement = document.getElementById('responsive-image');
  const introContainer = document.getElementById('startingScreen');

  if (isCompactViewport()) {
    applyMobileLayout(displayElement, introContainer);
  } else {
    applyDesktopLayout(displayElement, introContainer);
  }
}

/**
 * Determines if viewport is in mobile/compact mode
 * @returns {boolean} True if viewport is compact
 */
function isCompactViewport() {
  return window.innerWidth <= 720;
}

/**
 * Applies styling for mobile layout
 * @param {HTMLElement} visualElement - The responsive image element
 * @param {HTMLElement} animationContainer - The intro animation container
 */
function applyMobileLayout(visualElement, animationContainer) {
  visualElement.src = './img/Capa.png';
  document.body.style.backgroundColor = '#2A3647';

  configureElementPosition(animationContainer, {
    left: '38px',
    top: '37px',
  });
}

/**
 * Applies styling for desktop layout
 * @param {HTMLElement} visualElement - The responsive image element
 * @param {HTMLElement} animationContainer - The intro animation container
 */
function applyDesktopLayout(visualElement, animationContainer) {
  visualElement.src = './img/Capa 2.png';
  document.body.style.backgroundColor = '#F6F7F8';

  configureElementPosition(animationContainer, {
    left: '583px',
    top: '345px',
  });
}

/**
 * Sets position properties for an element
 * @param {HTMLElement} targetElement - Element to position
 * @param {Object} coordinates - Position coordinates
 */
function configureElementPosition(targetElement, coordinates) {
  targetElement.style.left = coordinates.left;
  targetElement.style.top = coordinates.top;
}

/**
 * Handles intro animation completion
 */
function handleAnimationComplete() {
  const visualElement = document.getElementById('responsive-image');

  if (isCompactViewport()) {
    transitionToMainView(visualElement);
  }
}

/**
 * Changes visual state after animation for mobile views
 * @param {HTMLElement} visualElement - The responsive image element
 */
function transitionToMainView(visualElement) {
  visualElement.src = './img/Capa 2.png';
  document.body.style.backgroundColor = '#F6F7F8';
}

// Initialize interface elements
const introContainer = document.getElementById('startingScreen');
const visualElement = document.getElementById('responsive-image');

// Set up event listeners
window.addEventListener('resize', adjustInterfaceElements);
window.addEventListener('load', adjustInterfaceElements);
introContainer.addEventListener('animationend', handleAnimationComplete);
