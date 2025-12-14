// UI update logic for Sedna FM

import { isPlaying, widget, currentTrack } from './player.js';

// Update play/pause icon
export function updatePlayPauseIcon() {
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  if (playIcon) playIcon.style.display = isPlaying ? 'none' : '';
  if (pauseIcon) pauseIcon.style.display = isPlaying ? '' : 'none';
}

/**
 * Update channel button highlighting to show active channel
 * @param {number|null} activeChannel - Active channel ID (1-4) or null for none
 */
export function updateChannelHighlighting(activeChannel) {
  // Remove active class from all channel buttons
  document.querySelectorAll('.channel-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to selected channel button
  if (activeChannel !== null) {
    const activeBtn = document.getElementById(`channel-btn-${activeChannel}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
}

/**
 * Show a toast notification message
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, duration = 3000) {
  // Remove existing toast if present
  const existingToast = document.getElementById('toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: 'VT323', monospace;
    font-size: 1.2rem;
    z-index: 1000;
    animation: toastFadeIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  // Auto-dismiss
  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Update title in overlay (artwork removed)
export function updateArtworkAndTitle() {
  if (widget) {
    widget.getCurrentSound(function(sound) {
      const overlay = document.getElementById('radio-black-overlay');
      if (sound && sound.title) {
        overlay.style.display = 'flex';
      } else {
        overlay.style.display = 'none';
      }
      // Title with clickable link
      const titleSpan = document.getElementById('radio-title');
      const titleLink = document.getElementById('radio-title-link');
      let title = sound && sound.title ? sound.title : '';
      titleSpan.textContent = title;
      // Make title clickable to current track on SoundCloud
      if (titleLink) {
        titleLink.href = currentTrack || "#";
        titleLink.style.pointerEvents = currentTrack ? "auto" : "none";
      }
      // Scrolling effect if too long
      setTimeout(() => {
        const container = document.getElementById('radio-title-container');
        titleSpan.style.animation = '';
        titleSpan.style.removeProperty('--scroll-distance');
        titleSpan.style.paddingRight = "";
        if (titleSpan.scrollWidth > container.offsetWidth) {
          const scrollDistance = titleSpan.scrollWidth - container.offsetWidth + 40;
          titleSpan.style.setProperty('--scroll-distance', scrollDistance + 'px');
          titleSpan.style.animation = `scroll-title 8s linear infinite`;
          titleSpan.style.paddingRight = "40px";
        }
      }, 100);
    });
  }
}

// Setup artwork listener on widget events
export function setupArtworkListener() {
  if (widget) {
    widget.bind(SC.Widget.Events.READY, updateArtworkAndTitle);
    widget.bind(SC.Widget.Events.PLAY, updateArtworkAndTitle);
    widget.bind(SC.Widget.Events.LOAD_PROGRESS, updateArtworkAndTitle);
  }
}