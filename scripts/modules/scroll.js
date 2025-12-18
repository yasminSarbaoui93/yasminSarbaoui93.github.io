// Scroll indicator functionality

/**
 * Scrolls smoothly to the next section when a scroll indicator is clicked
 * @param {HTMLElement} indicator - The scroll indicator element that was clicked
 */
export function scrollToNextSection(indicator) {
  // Find the current section by traversing up from the indicator
  let currentSection = indicator.closest('section') || indicator.closest('#radio-hero');
  
  if (!currentSection) {
    console.warn('Could not find current section for scroll indicator');
    return;
  }

  // Find the next section
  let nextSection = currentSection.nextElementSibling;
  
  // Skip non-section elements (like script tags)
  while (nextSection && nextSection.tagName !== 'SECTION') {
    nextSection = nextSection.nextElementSibling;
  }

  // If we're in the radio-hero and next element is formats-section, scroll to it
  if (currentSection.id === 'radio-hero' && nextSection && nextSection.id === 'formats-section') {
    nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // If we're in formats-section and next element is about-sedna-section, scroll to it
  else if (currentSection.id === 'formats-section' && nextSection && nextSection.id === 'about-sedna-section') {
    nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  else if (nextSection) {
    nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    console.log('Already at the last section');
  }
}

/**
 * Initialize scroll indicators by adding click handlers
 */
export function initScrollIndicators() {
  const scrollIndicators = document.querySelectorAll('.scroll-indicator');
  
  scrollIndicators.forEach(indicator => {
    indicator.addEventListener('click', () => {
      scrollToNextSection(indicator);
    });
    
    // Add keyboard accessibility
    indicator.setAttribute('role', 'button');
    indicator.setAttribute('tabindex', '0');
    indicator.setAttribute('aria-label', 'Scroll to next section');
    
    indicator.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToNextSection(indicator);
      }
    });
  });
}
