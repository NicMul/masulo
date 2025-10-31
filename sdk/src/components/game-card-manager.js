/**
 * Game Card Manager
 * Minimal, non-invasive manager that replaces img tags with video elements
 * and adds event handlers while preserving the user's HTML structure
 */

import { isTouchDevice } from '../utils/device-detection.js';
import { GameCardAnalytics } from '../utils/analytics.js';

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
    
    // Initialize analytics
    this.analytics = new GameCardAnalytics(gameId, containerElement);
    
    // Ensure container has relative positioning for spinner
    if (window.getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
    
    // Store reference to original img
    this.originalImg = this.container.querySelector('img');
    
    if (this.originalImg) {
      // Store the image src
      this.currentImageUrl = this.originalImg.src || this.originalImg.getAttribute('src');
      
      // Add event handlers to container
      this.setupEventHandlers();
      
      // Setup analytics for image tracking
      this.analytics.setupImageTracking(
        this.originalImg,
        () => this.originalImg?.src || this.currentImageUrl
      );
    } else {
      console.warn(`[Game Card Manager] No img tag found for ${gameId}`);
    }
  }
  
  getContainer() {
    return this.container;
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
      
      // Track interaction
      this.analytics.trackInteraction('video_play', this.currentVideoUrl, {
        interaction: 'hover_reset'
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
      
      // Track interaction
      this.analytics.trackInteraction('video_play', this.currentVideoUrl, {
        interaction: 'hover'
      });
    }
  };
  
  handleMouseLeave = (e) => {
    if (this.currentVideo && this.isPaused) {
      return; // Keep button visible if paused
    }
    
    // Track stop event if video was playing
    if (this.currentVideo && this.isPlaying) {
      this.analytics.trackInteraction('video_stop', this.currentVideoUrl, {
        interaction: 'hover_end'
      });
    }
    
    // Stop and reset video
    if (this.currentVideo) {
      this.currentVideo.pause();
      this.currentVideo.currentTime = 0;
    }
    this.isPlaying = false;
  };
  
  handleTouchEnd = (e) => {
    // Always prevent default to avoid fullscreen on images
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.currentVideo || !this.currentVideoUrl) {
      // No video yet, just prevent default behavior
      return;
    }
    
    if (this.isPlaying) {
      // Second tap: pause video where it is
      this.currentVideo.pause();
      this.isPlaying = false;
      this.isPaused = true;
      
      // Track pause
      this.analytics.trackInteraction('video_pause', this.currentVideoUrl, {
        interaction: 'tap'
      });
    } else {
      // First tap: play video
      if (window.mesulo) {
        window.mesulo.deactivateAllVideos(false); // Don't reset, just pause
        window.mesulo.activeVideoContainer = this;
      }
      this.isPlaying = true;
      this.isPaused = false;
      this.currentVideo.play().catch(err => {
        console.warn(`[Game Card Manager] Play failed on tap for ${this.gameId}:`, err);
        this.isPlaying = false;
      });
      
      // Track play
      this.analytics.trackInteraction('video_play', this.currentVideoUrl, {
        interaction: 'tap'
      });
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
      
      // Track pause
      this.analytics.trackInteraction('video_pause', this.currentVideoUrl, {
        interaction: 'click'
      });
    } else if (this.isPaused) {
      // Resume from paused state
      this.isPaused = false;
      this.isPlaying = true;
      this.currentVideo.play().catch(err => {
        console.warn(`[Game Card Manager] Play failed on resume for ${this.gameId}:`, err);
        this.isPlaying = false;
      });
      
      // Track resume
      this.analytics.trackInteraction('video_play', this.currentVideoUrl, {
        interaction: 'click_resume'
      });
    }
  };
  
  updateContent(newImageUrl, newVideoUrl, published = true) {
    // Cancel any pending timers
    if (this.replacementTimer) {
      clearTimeout(this.replacementTimer);
      this.replacementTimer = null;
    }
    if (this.spinnerFadeTimer) {
      clearTimeout(this.spinnerFadeTimer);
      this.spinnerFadeTimer = null;
    }
    
    // Update content URLs (but don't apply to DOM yet)
    if (newImageUrl) this.currentImageUrl = newImageUrl;
    if (newVideoUrl !== undefined) this.currentVideoUrl = newVideoUrl;

    if (published === false && this.currentVideo) {
      // Update image src to the new default image before reverting
      if (this.originalImg && newImageUrl) {
        this.originalImg.src = newImageUrl;
      }
      // Revert video element back to image (handles all playback states)
      this.revert();
      // Also remove any spinner if present
      this.removeLoadingSpinner();
      return; // Exit early since we've handled the unpublish case
    }
    
    // If we have video URL and we're showing image, delay switch by 3 seconds with spinner
    if (this.currentVideoUrl && !this.currentVideo) {
      this.startDelayedVideoSwitch();
    }
    
    // If we have video, update it with the same loading sequence
    if (this.currentVideo && this.currentVideoUrl) {
      this.startDelayedVideoUpdate();
    }
    
    // If we're showing an image and only got a new image URL (no video), update it directly
    if (!this.currentVideo && this.originalImg && newImageUrl && !this.currentVideoUrl) {
      this.originalImg.src = newImageUrl;
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
  
  startDelayedVideoUpdate() {
    // Wait 3 seconds before starting the transition
    this.replacementTimer = setTimeout(() => {
      this.createLoadingSpinner();
      
      // After 2 seconds with spinner visible, replace video
      this.spinnerFadeTimer = setTimeout(() => {
        this.replaceCurrentVideo();
      }, 2000);
    }, 3000);
  }
  
  replaceCurrentVideo() {
    if (!this.currentVideo || !this.currentVideoUrl) return;
    
    // Store current playback state
    const wasPlaying = this.isPlaying;
    const wasPaused = this.isPaused;
    const currentTime = this.currentVideo.currentTime;
    
    // Store reference to old video
    const oldVideo = this.currentVideo;
    
    // Create new video element with updated sources
    const video = document.createElement('video');
    
    // Copy className from old video to preserve styles
    if (oldVideo.className) {
      video.className = oldVideo.className;
    }
    
    // Copy other attributes to preserve styling
    if (oldVideo.hasAttribute('style')) {
      const existingStyle = oldVideo.getAttribute('style');
      video.setAttribute('style', existingStyle);
    }
    
    // Set opacity and transition for fade effect
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
    
    // Copy version from container if it exists
    const version = this.container.getAttribute('data-mesulo-version');
    if (version) {
      video.setAttribute('data-mesulo-version', version);
    }
    
    // Setup analytics for new video
    this.analytics.setupVideoTracking(video, this.currentVideoUrl);
    
    // Load video metadata first
    const handleMetadataLoad = () => {
      // Replace old video with new one
      oldVideo.replaceWith(video);
      this.currentVideo = video;
      
      // Remove spinner
      this.removeLoadingSpinner();
      
      // Restore playback state
      if (wasPlaying && !wasPaused) {
        this.isPlaying = true;
        this.isPaused = false;
        video.currentTime = currentTime;
        video.play().catch(err => {
          console.warn(`[Game Card Manager] Auto-play failed for ${this.gameId}:`, err);
          this.isPlaying = false;
        });
      } else if (wasPaused) {
        this.isPlaying = false;
        this.isPaused = true;
        video.currentTime = currentTime;
      }
      
      // Fade in the new video
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          video.style.opacity = '1';
        });
      });
    };
    
    video.addEventListener('loadedmetadata', handleMetadataLoad, { once: true });
    
    // Fallback: if metadata takes too long, proceed anyway
    setTimeout(() => {
      if (oldVideo.parentNode) {
        console.warn(`[Game Card Manager] Video metadata timeout for ${this.gameId}, proceeding with replacement`);
        oldVideo.replaceWith(video);
        this.currentVideo = video;
        this.removeLoadingSpinner();
        requestAnimationFrame(() => {
          video.style.opacity = '1';
        });
      }
    }, 3000);
  }
  
  switchToVideo() {
    if (!this.originalImg || this.currentVideo) return;
    
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
    
    // Copy version from container if it exists
    const version = this.container.getAttribute('data-mesulo-version');
    if (version) {
      video.setAttribute('data-mesulo-version', version);
    }
    
    // Setup analytics for video events
    this.analytics.setupVideoTracking(video, this.currentVideoUrl);
    
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
    
    // Replace video with image
    this.currentVideo.replaceWith(this.originalImg);
    this.currentVideo = null;
    this.isPlaying = false;
    this.isPaused = false;
  }
  
  deactivate(resetToStart = true) {
    if (!this.currentVideo) return;
    
    // Stop video
    this.currentVideo.pause();
    
    // Only reset to beginning if requested (desktop behavior)
    if (resetToStart) {
      this.currentVideo.currentTime = 0;
    }
    
    this.isPlaying = false;
    this.isPaused = !resetToStart; // Mark as paused if not resetting
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
    
    // Cleanup analytics
    if (this.analytics) {
      this.analytics.cleanup();
    }
    
    // Revert to image if showing video
    if (this.currentVideo) {
      this.revert();
    }
  }
}

