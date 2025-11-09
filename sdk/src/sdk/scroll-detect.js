

export class ScrollDetector {
  constructor(videoManager) {
    this.videoManager = videoManager;
    this.isScrolling = false;
    this.scrollStartY = 0;
    this.SCROLL_THRESHOLD = 30;
  }
  
  setupScrollDetection() {
    let scrollTimeout;
    
    const handleTouchStart = (e) => {
      this.scrollStartY = e.touches[0].clientY;
      this.isScrolling = false;
    };
    
    const handleTouchMove = (e) => {
      if (!this.scrollStartY) return;
      
      const deltaY = Math.abs(e.touches[0].clientY - this.scrollStartY);
      
      if (deltaY > this.SCROLL_THRESHOLD && !this.isScrolling) {
        this.isScrolling = true;
        this.videoManager.deactivateAllVideos(true);
      }
    };
    
    const handleTouchEnd = () => {
      this.scrollStartY = 0;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
      }, 100);
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }
}

