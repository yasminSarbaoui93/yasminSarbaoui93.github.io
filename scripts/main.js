// Main entry point for Sedna FM (modularized)

import {
  playTrack,
  playRandomEpisode,
  togglePlayPause,
  playNextTrack,
  embedSoundCloud,
  widget
} from './modules/player.js';
import { updatePlayPauseIcon, setupArtworkListener } from './modules/ui.js';
import { initModal } from './modules/modal.js';

// Patch embedSoundCloud to call setupArtworkListener after widget is created
const _origEmbedSoundCloud = embedSoundCloud;
function patchedEmbedSoundCloud(trackUrl) {
  _origEmbedSoundCloud(trackUrl);
  setTimeout(setupArtworkListener, 400);
}

// Attach click handlers and initialize UI
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('radio-play-btn').addEventListener('click', togglePlayPause);
  document.getElementById('radio-next-btn').addEventListener('click', playNextTrack);

  // Initialize play/pause icon on load
  updatePlayPauseIcon();

  // Patch embedSoundCloud globally
  window.embedSoundCloud = patchedEmbedSoundCloud;

  // Initialize modal logic
  initModal();
});