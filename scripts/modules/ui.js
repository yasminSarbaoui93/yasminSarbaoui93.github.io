// UI update logic for Sedna FM

import { isPlaying, widget, currentTrack } from './player.js';

// Update play/pause icon
export function updatePlayPauseIcon() {
  document.getElementById('play-icon').style.display = isPlaying ? 'none' : '';
  document.getElementById('pause-icon').style.display = isPlaying ? '' : 'none';
}

// Update artwork and title in overlay
export function updateArtworkAndTitle() {
  if (widget) {
    widget.getCurrentSound(function(sound) {
      const overlay = document.getElementById('radio-black-overlay');
      if (sound && (sound.artwork_url || sound.title)) {
        overlay.style.display = 'flex';
      } else {
        overlay.style.display = 'none';
      }
      // Artwork
      const artImg = document.getElementById('radio-artwork');
      const artLink = document.getElementById('radio-artwork-link');
      if (sound && sound.artwork_url) {
        let url = sound.artwork_url.replace('-large', '-t500x500');
        artImg.src = url;
        artImg.style.display = '';
      } else {
        artImg.src = 'assets/images/ale1.jpeg';
        artImg.style.display = '';
      }
      // Make artwork clickable to current track
      if (artLink) {
        artLink.href = currentTrack || "#";
        artLink.style.pointerEvents = currentTrack ? "auto" : "none";
      }
      // Title
      const titleSpan = document.getElementById('radio-title');
      let title = sound && sound.title ? sound.title : '';
      titleSpan.textContent = title;
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