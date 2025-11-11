

export class GameCardAnalytics {
  constructor(gameId, containerElement) {
    this.gameId = gameId;
    this.container = containerElement;
    this.trackingData = {};
    this.imageObserver = null;
    this.videoObserver = null;
    this.hoverStartTimes = new Map();
    this.clickListenersSetup = false;
  }
  
  setupImageTracking(imageElement, getCurrentImageUrl) {
    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && window.mesulo?.analyticsEnabled) {
          const imageUrl = getCurrentImageUrl();
          if (imageUrl && this.trackingData.lastImageUrl !== imageUrl) {
            window.mesulo.trackAssetEvent('image_impression', this.gameId, 'image', imageUrl, {
              visibility_ratio: entry.intersectionRatio,
              viewport: window.mesulo.getViewportInfo()
            });
            this.trackingData.lastImageUrl = imageUrl;
          }
        }
      });
    }, { threshold: [0.5] });
    
    this.imageObserver.observe(this.container);
  }
  
  setupVideoTracking(videoElement, videoUrl) {
    if (!videoElement) {
      return;
    }
    
    // Store videoUrl and gameId on the element for later access
    videoElement.setAttribute('data-mesulo-video-url', videoUrl);
    videoElement.setAttribute('data-mesulo-game-id', this.gameId);
    
    // Create a new observer for this video (each video needs its own)
    // Track last intersection state to allow multiple impressions when element re-enters viewport
    const lastIntersectionState = new WeakMap();
    
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        const wasIntersecting = lastIntersectionState.get(video) || false;
        lastIntersectionState.set(video, entry.isIntersecting);
        
        // Track impression when element enters viewport (transitions from not intersecting to intersecting)
        if (entry.isIntersecting && !wasIntersecting && window.mesulo?.analyticsEnabled) {
          const trackedVideoUrl = video.src || video.getAttribute('data-mesulo-video-url') || video.getAttribute('src');
          const trackedGameId = video.getAttribute('data-mesulo-game-id') || this.gameId;
          if (trackedVideoUrl) {
            window.mesulo.trackAssetEvent('impression', trackedGameId, 'video', trackedVideoUrl, {
              visibility_ratio: entry.intersectionRatio,
              viewport: window.mesulo.getViewportInfo()
            });
          }
        }
      });
    }, { threshold: [0.5] });
    
    videoObserver.observe(videoElement);
    
    // Store observer reference for cleanup
    if (!this.videoObservers) {
      this.videoObservers = new WeakMap();
    }
    this.videoObservers.set(videoElement, videoObserver);
    
    // Track video play/pause/end events
    videoElement.addEventListener('play', () => {
      this.trackVideoEvent('video_play', videoUrl, videoElement);
    });
    
    videoElement.addEventListener('pause', () => {
      if (!videoElement.ended) {
        this.trackVideoEvent('video_pause', videoUrl, videoElement, {
          currentTime: videoElement.currentTime,
          watchedPercentage: (videoElement.currentTime / videoElement.duration) * 100
        });
      }
    });
    
    videoElement.addEventListener('ended', () => {
      this.trackVideoEvent('video_complete', videoUrl, videoElement);
    });
    
    // Track video clicks - use capture phase to catch before other handlers
    videoElement.addEventListener('click', (e) => {
      if (window.mesulo?.analyticsEnabled) {
        const trackedVideoUrl = videoElement.src || videoElement.getAttribute('data-mesulo-video-url') || videoUrl;
        const trackedGameId = videoElement.getAttribute('data-mesulo-game-id') || this.gameId;
        window.mesulo.trackAssetEvent('video_click', trackedGameId, 'video', trackedVideoUrl, {
          viewport: window.mesulo.getViewportInfo()
        });
      }
    }, true); // Use capture phase
    
    // Track hover start/end
    videoElement.addEventListener('mouseenter', () => {
      if (!this.hoverStartTimes.has(videoElement)) {
        this.hoverStartTimes.set(videoElement, Date.now());
        if (window.mesulo?.analyticsEnabled) {
          window.mesulo.trackAssetEvent('hover_start', this.gameId, 'video', videoUrl, {
            viewport: window.mesulo.getViewportInfo()
          });
        }
      }
    });
    
    videoElement.addEventListener('mouseleave', () => {
      const startTime = this.hoverStartTimes.get(videoElement);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.hoverStartTimes.delete(videoElement);
        if (window.mesulo?.analyticsEnabled) {
          window.mesulo.trackAssetEvent('hover_end', this.gameId, 'video', videoUrl, {
            duration,
            viewport: window.mesulo.getViewportInfo()
          });
        }
      }
    });
  }
  
  trackVideoEvent(eventType, videoUrl, videoElement, extraMetadata = {}) {
    if (!window.mesulo?.analyticsEnabled) {
      return;
    }
    
    window.mesulo.trackAssetEvent(eventType, this.gameId, 'video', videoUrl, {
      duration: videoElement.duration,
      currentTime: videoElement.currentTime,
      ...extraMetadata
    });
  }
  
  trackInteraction(interactionType, assetUrl, metadata = {}) {
    if (!window.mesulo?.analyticsEnabled) return;
    
    window.mesulo.trackAssetEvent(interactionType, this.gameId, 'video', assetUrl, {
      trigger: 'user_interaction',
      ...metadata
    });
  }
  
  setupButtonClickTracking() {
    if (this.clickListenersSetup) {
      return;
    }
    
    // Track button clicks within the container - use capture phase
    this.container.addEventListener('click', (e) => {
      const button = e.target.closest('button, a[href]');
      if (button && window.mesulo?.analyticsEnabled) {
        const buttonType = button.tagName.toLowerCase();
        const buttonHref = button.href || null;
        
        window.mesulo.trackAssetEvent('button_click', this.gameId, 'button', buttonHref || '', {
          buttonType,
          viewport: window.mesulo.getViewportInfo()
        });
      }
    }, true); // Use capture phase
    
    this.clickListenersSetup = true;
  }
  
  cleanup() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.imageObserver = null;
    }
    
    // Disconnect all video observers
    if (this.videoObservers) {
      // WeakMap doesn't support iteration, so we can't clean them up individually
      // They'll be garbage collected when videos are removed
    }
    
    this.hoverStartTimes.clear();
  }
}
