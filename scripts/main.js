// Main entry point for Sedna FM (modularized)

import {
  playTrack,
  playRandomEpisode,
  togglePlayPause,
  playNextTrack,
  playPreviousTrack,
  embedSoundCloud,
  handleChannelClick,
  widget
} from './modules/player.js';
import { updatePlayPauseIcon, setupArtworkListener, updateChannelHighlighting } from './modules/ui.js';
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
  document.getElementById('radio-prev-btn').addEventListener('click', playPreviousTrack);
  document.getElementById('radio-next-btn').addEventListener('click', playNextTrack);

  // Channel button click handlers
  document.querySelectorAll('.channel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const channelId = parseInt(btn.dataset.channel, 10);
      handleChannelClick(channelId);
    });
  });

  // Initialize play/pause icon on load
  updatePlayPauseIcon();
  
  // Initialize channel highlighting (no channel selected initially)
  updateChannelHighlighting(null);

  // Patch embedSoundCloud globally
  window.embedSoundCloud = patchedEmbedSoundCloud;

  // Initialize modal logic
  initModal();
});