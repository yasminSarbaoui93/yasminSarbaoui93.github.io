// Modal logic for subscribe modal

export function initModal() {
  const subscribeLink = document.querySelector('.nav-left a[href="#"]');
  const modalOverlay = document.getElementById('subscribe-modal-overlay');
  const modalClose = document.getElementById('subscribe-modal-close');

  if (subscribeLink && modalOverlay && modalClose) {
    // Open modal
    subscribeLink.addEventListener('click', function(e) {
      e.preventDefault();
      modalOverlay.classList.add('active');
      modalOverlay.setAttribute('aria-hidden', 'false');
    });

    // Close modal
    function closeModal() {
      modalOverlay.classList.remove('active');
      modalOverlay.setAttribute('aria-hidden', 'true');
    }
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', function(e) {
      if (modalOverlay.classList.contains('active') && e.key === 'Escape') closeModal();
    });
  }
}