// This script adds a version parameter to all CSS and JS files to force browser cache refresh
document.addEventListener('DOMContentLoaded', function() {
  console.log('Cache buster script running');
  
  // Current timestamp for cache busting
  const cacheBuster = new Date().getTime();
  
  // Add cache buster to all CSS links
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    if (link.href && !link.href.includes('?v=')) {
      link.href = `${link.href}?v=${cacheBuster}`;
      console.log(`Cache busted CSS: ${link.href}`);
    }
  });
  
  // Add cache buster to all script tags
  document.querySelectorAll('script').forEach(script => {
    if (script.src && !script.src.includes('?v=')) {
      script.src = `${script.src}?v=${cacheBuster}`;
      console.log(`Cache busted JS: ${script.src}`);
    }
  });
  
  console.log('Cache buster complete');
});