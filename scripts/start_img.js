
function adjustInterfaceElements() {
  const displayElement = document.getElementById('responsive-image');
  const introContainer = document.getElementById('startingScreen');

  if (isCompactViewport()) {
    applyMobileLayout(displayElement, introContainer);
  } else {
    applyDesktopLayout(displayElement, introContainer);
  }
}


function isCompactViewport() {
  return window.innerWidth <= 720;
}


function applyMobileLayout(visualElement, animationContainer) {
  visualElement.src = './img/Capa.png';
  document.body.style.backgroundColor = '#2A3647';

  configureElementPosition(animationContainer, {
    left: '38px',
    top: '37px',
  });
}


function applyDesktopLayout(visualElement, animationContainer) {
  visualElement.src = './img/Capa 2.png';
  document.body.style.backgroundColor = '#F6F7F8';

  configureElementPosition(animationContainer, {
    left: '583px',
    top: '345px',
  });
}


function configureElementPosition(targetElement, coordinates) {
  targetElement.style.left = coordinates.left;
  targetElement.style.top = coordinates.top;
}


function handleAnimationComplete() {
  const visualElement = document.getElementById('responsive-image');

  if (isCompactViewport()) {
    transitionToMainView(visualElement);
  }
}


function transitionToMainView(visualElement) {
  visualElement.src = './img/Capa 2.png';
  document.body.style.backgroundColor = '#F6F7F8';
}


const introContainer = document.getElementById('startingScreen');
const visualElement = document.getElementById('responsive-image');


window.addEventListener('resize', adjustInterfaceElements);
window.addEventListener('load', adjustInterfaceElements);
introContainer.addEventListener('animationend', handleAnimationComplete);
