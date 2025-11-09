

export class GameCardAnalytics {
  constructor(gameId, containerElement) {
    this.gameId = gameId;
    this.container = containerElement;
    this.trackingData = {};
    this.imageObserver = null;
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
  }
  
  trackVideoEvent(eventType, videoUrl, videoElement, extraMetadata = {}) {
    if (!window.mesulo?.analyticsEnabled) return;
    
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
  
  cleanup() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.imageObserver = null;
    }
  }
}
