/**
 * Game Card Manager
 * Minimal, non-invasive manager that replaces img tags with video elements
 * and adds event handlers while preserving the user's HTML structure
 */

import { isTouchDevice } from '../utils/device-detection.js';

export class GameCardManager {
  constructor(containerElement, gameId) {
    this.container = containerElement;
    this.gameId = gameId;
    this.originalImg = null;
    this.currentVideo = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentImageUrl = '';
    this.currentVideoUrl = '';
    this.isTouchDevice = isTouchDevice();
    this.loadingSpinner = null;
    this.replacementTimer = null;
    this.spinnerFadeTimer = null;
    
    // Ensure container has relative positioning for spinner
    if (window.getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
    
    console.log(`[Game Card Manager] Initialized for ${gameId}`);
    
    // Store reference to original img
    this.originalImg = this.container.querySelector('img');
    
    if (this.originalImg) {
      // Store the image src
      this.currentImageUrl = this.originalImg.src || this.originalImg.getAttribute('src');
      
      // Add event handlers to container
      this.setupEventHandlers();
      
      console.log(`[Game Card Manager] Found img tag for ${gameId}`);
    } else {
      console.warn(`[Game Card Manager] No img tag found for ${gameId}`);
    }
  }
  
  setupEventHandlers() {
    // Desktop: hover to play, leave to reset
    this.container.addEventListener('mouseenter', this.handleMouseEnter);
    this.container.addEventListener('mouseleave', this.handleMouseLeave);
    
    // Mobile: tap to toggle play/pause
    if (this.isTouchDevice) {
      this.container.addEventListener('touchend', this.handleTouchEnd);
    } else {
      this.container.addEventListener('click', this.handleVideoClick);
    }
  }
  
  createLoadingSpinner() {
    if (this.loadingSpinner) return;
    
    const spinner = document.createElement('div');
    spinner.className = 'mesulo-loading-spinner';
    
    // Position at bottom right
    spinner.style.position = 'absolute';
    spinner.style.bottom = '12px';
    spinner.style.right = '12px';
    spinner.style.width = '16px';
    spinner.style.height = '16px';
    spinner.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    spinner.style.borderTopColor = 'rgba(255, 255, 255, 0.9)';
    spinner.style.borderRadius = '50%';
    spinner.style.opacity = '0';
    spinner.style.transition = 'opacity 0.4s ease-in-out';
    spinner.style.pointerEvents = 'none';
    spinner.style.animation = 'spin 0.8s linear infinite';
    
    // Add animation keyframes if not already defined
    if (!document.getElementById('mesulo-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'mesulo-spinner-styles';
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
    
    this.container.appendChild(spinner);
    this.loadingSpinner = spinner;
    
    // Fade in the spinner
    requestAnimationFrame(() => {
      spinner.style.opacity = '1';
    });
  }
  
  removeLoadingSpinner() {
    if (!this.loadingSpinner) return;
    
    const spinner = this.loadingSpinner;
    spinner.style.opacity = '0';
    
    setTimeout(() => {
      if (spinner.parentNode) {
        spinner.remove();
      }
      this.loadingSpinner = null;
    }, 400); // Wait for fade out transition
  }
  
  handleMouseEnter = (e) => {
    if (!this.currentVideo || !this.currentVideoUrl) return;
    
    // If hovering a paused video, reset and play
    if (this.isPaused) {
      this.isPaused = false;
      this.isPlaying = true;
      this.currentVideo.currentTime = 0;
      this.currentVideo.play().catch(err => {
        console.warn(`[Game Card Manager] Play failed on hover for ${this.gameId}:`, err);
        this.isPlaying = false;
      });
      return;
    }
    
    // If hovering an unpaused video, just play
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.currentVideo.play().catch(err => {
        console.warn(`[Game Card Manager] Play failed on hover for ${this.gameId}:`, err);
        this.isPlaying = false;
      });
    }
  };
  
  handleMouseLeave = (e) => {
    if (this.currentVideo && this.isPaused) {
      return; // Keep button visible if paused
    }
    
    // Stop and reset video
    if (this.currentVideo) {
      this.currentVideo.pause();
      this.currentVideo.currentTime = 0;
    }
    this.isPlaying = false;
  };
  
  handleTouchEnd = (e) => {
    if (!this.currentVideo || !this.currentVideoUrl) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (this.isPlaying) {
      // Second tap: pause video where it is
      this.currentVideo.pause();
      this.isPlaying = false;
      this.isPaused = true;
      console.log(`[Game Card Manager] Video paused for ${this.gameId}`);
    } else {
      // First tap: play video
      if (window.mesulo) {
        window.mesulo.deactivateAllVideos(true, true);
        window.mesulo.activeVideoContainer = this;
      }
      this.isPlaying = true;
      this.isPaused = false;
      this.currentVideo.play().catch(err => {
        console.warn(`[Game Card Manager] Play failed on tap for ${this.gameId}:`, err);
        this.isPlaying = false;
      });
      console.log(`[Game Card Manager] Video playing for ${this.gameId}`);
    }
  };
  
  handleVideoClick = (e) => {
    if (!this.currentVideo || !this.currentVideoUrl) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (this.isPlaying) {
      // Pause video, keep button visible
      this.currentVideo.pause();
      this.isPlaying = false;
      this.isPaused = true;
      console.log(`[Game Card Manager] Video clicked to pause for ${this.gameId}`);
    } else if (this.isPaused) {
      // Resume from paused state
      this.isPaused = false;
      this.isPlaying = true;
      this.currentVideo.play().catch(err => {
        console.warn(`[Game Card Manager] Play failed on resume for ${this.gameId}:`, err);
        this.isPlaying = false;
      });
      console.log(`[Game Card Manager] Video resumed for ${this.gameId}`);
    }
  };
  
  updateContent(newImageUrl, newVideoUrl) {
    console.log(`[Game Card Manager] Received update for ${this.gameId}:`, { newImageUrl, newVideoUrl });
    
    // Cancel any pending timers
    if (this.replacementTimer) {
      clearTimeout(this.replacementTimer);
      this.replacementTimer = null;
    }
    
    // Update content URLs (but don't apply to DOM yet)
    if (newImageUrl) this.currentImageUrl = newImageUrl;
    if (newVideoUrl !== undefined) this.currentVideoUrl = newVideoUrl;
    
    // If we have video URL and we're showing image, delay switch by 3 seconds with spinner
    if (this.currentVideoUrl && !this.currentVideo) {
      this.startDelayedVideoSwitch();
    }
    
    // If we have video, update its sources
    if (this.currentVideo) {
      this.currentVideo.poster = this.currentImageUrl;
      if (this.currentVideoUrl) {
        this.currentVideo.src = this.currentVideoUrl;
        this.currentVideo.load();
      }
    }
  }
  
  startDelayedVideoSwitch() {
    // Wait 3 seconds before starting the transition
    this.replacementTimer = setTimeout(() => {
      this.createLoadingSpinner();
      
      // After 2 seconds with spinner visible, switch to video (spinner fades out with video)
      this.spinnerFadeTimer = setTimeout(() => {
        this.switchToVideo();
      }, 2000);
    }, 3000);
  }
  
  switchToVideo() {
    if (!this.originalImg || this.currentVideo) return;
    
    console.log(`[Game Card Manager] Switching to video for ${this.gameId}`);
    
    // Update image src before we replace it with video (preserves poster image)
    if (this.originalImg && this.currentImageUrl) {
      this.originalImg.src = this.currentImageUrl;
    }
    
    // Create video element
    const video = document.createElement('video');
    
    // Copy className from img to video to preserve styles
    if (this.originalImg.className) {
      video.className = this.originalImg.className;
    }
    
    // Copy other attributes to preserve styling
    if (this.originalImg.hasAttribute('style')) {
      video.setAttribute('style', this.originalImg.getAttribute('style'));
    }
    
    // Add transition class for fade effect
    video.style.opacity = '0';
    video.style.transition = 'opacity 0.8s ease-in-out';
    
    // Set video properties
    video.poster = this.currentImageUrl;
    video.src = this.currentVideoUrl;
    video.muted = true;
    video.loop = true;
    video.playsinline = true;
    video.preload = 'metadata';
    video.playsInline = true; // Double check for iOS
    
    // Load video metadata first
    const handleMetadataLoad = () => {
      // Now replace img with video
      this.originalImg.replaceWith(video);
      this.currentVideo = video;
      
      // Fade out spinner while fading in video
      this.removeLoadingSpinner();
      
      // Trigger fade-in after a small delay to ensure rendering
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          video.style.opacity = '1';
        });
      });
      
      console.log(`[Game Card Manager] Switched to video for ${this.gameId}`);
    };
    
    video.addEventListener('loadedmetadata', handleMetadataLoad, { once: true });
    
    // Fallback: if metadata takes too long, proceed anyway after a timeout
    setTimeout(() => {
      if (video.parentNode === null && !this.currentVideo) {
        console.warn(`[Game Card Manager] Video metadata timeout for ${this.gameId}, proceeding with replacement`);
        this.originalImg.replaceWith(video);
        this.currentVideo = video;
        this.removeLoadingSpinner();
        requestAnimationFrame(() => {
          video.style.opacity = '1';
        });
      }
    }, 3000);
  }
  
  revert() {
    if (!this.currentVideo || !this.originalImg) return;
    
    console.log(`[Game Card Manager] Reverting to image for ${this.gameId}`);
    
    // Replace video with image
    this.currentVideo.replaceWith(this.originalImg);
    this.currentVideo = null;
    this.isPlaying = false;
    this.isPaused = false;
  }
  
  deactivate(hideButton = false) {
    if (!this.currentVideo) return;
    
    console.log(`[Game Card Manager] Deactivating ${this.gameId}, hideButton=${hideButton}`);
    
    // Stop video and reset
    this.currentVideo.pause();
    this.currentVideo.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = hideButton ? false : this.isPaused; // Keep paused state if not hiding button
  }
  
  destroy() {
    // Clear any pending timers
    if (this.replacementTimer) {
      clearTimeout(this.replacementTimer);
      this.replacementTimer = null;
    }
    if (this.spinnerFadeTimer) {
      clearTimeout(this.spinnerFadeTimer);
      this.spinnerFadeTimer = null;
    }
    
    // Remove spinner if present
    if (this.loadingSpinner) {
      this.removeLoadingSpinner();
    }
    
    // Clean up event listeners
    this.container.removeEventListener('mouseenter', this.handleMouseEnter);
    this.container.removeEventListener('mouseleave', this.handleMouseLeave);
    
    if (this.isTouchDevice) {
      this.container.removeEventListener('touchend', this.handleTouchEnd);
    } else {
      this.container.removeEventListener('click', this.handleVideoClick);
    }
    
    // Revert to image if showing video
    if (this.currentVideo) {
      this.revert();
    }
    
    console.log(`[Game Card Manager] Destroyed for ${this.gameId}`);
  }
}

