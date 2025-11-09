

export class ABTestAnalytics {
  constructor(hasActiveABTestCallback, connectionManager, getABTestAssetsCallback = null) {
    this.hasActiveABTestCallback = hasActiveABTestCallback;
    this.connectionManager = connectionManager;
    this.getABTestAssetsCallback = getABTestAssetsCallback;
    
    this.hoverStartTimes = new Map();
    this.impressionsLogged = new WeakSet();
    this.impressionObserver = null;
    this.analyticsListenersSetup = false;
    this.touchInteractions = new WeakMap();
    
    this.eventBuffer = [];
    this.batchSize = 10;
    this.batchTimeout = 5000;
    this.batchTimer = null;
  }

  
  _detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|phone/i.test(ua)) {
      return 'mobile';
    }
    if (/tablet|ipad/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  
  _mapVariant(variant) {
    if (variant === 'A') return 'variantA';
    if (variant === 'B') return 'variantB';
    return variant;
  }

  
  _buildDataObject(eventType, additionalData = {}, element = null) {
    const data = {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY,
      userAgent: navigator.userAgent,
      isTouchDevice: ('ontouchstart' in window && navigator.maxTouchPoints > 0) || 
                     (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Tablet'))
    };

    if (eventType === 'hover_end' && additionalData.duration !== undefined) {
      data.duration = additionalData.duration;
    }

    if (eventType === 'button_click' && element) {
      data.buttonType = element.tagName.toLowerCase();
      if (element.tagName === 'A' && element.href) {
        data.buttonHref = element.href;
      }
    }

    if (eventType === 'video_click' && element && element.tagName === 'VIDEO') {
      data.videoSrc = element.src || element.currentSrc || '';
    }

    return data;
  }

  
  _logAnalyticsEvent(eventType, gameId, variant, creatorId, additionalData = {}, element = null) {
    const mappedVariant = this._mapVariant(variant);
    const device = this._detectDevice();
    const data = this._buildDataObject(eventType, additionalData, element);

    const event = {
      gameId,
      eventType,
      variant: mappedVariant,
      device,
      distributionWeight: 0.5,
      timestamp: new Date().toISOString(),
      data,
      creatorId: creatorId
    };
    
    this._sendAnalyticsEvent(event);
  }

  
  _sendAnalyticsEvent(eventPayload) {
    this.eventBuffer.push(eventPayload);

    if (this.eventBuffer.length >= this.batchSize) {
      this._flushBatch();
    } else {
      this._scheduleBatchFlush();
    }
  }

  
  _scheduleBatchFlush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this._flushBatch();
    }, this.batchTimeout);
  }

  
  _flushBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.eventBuffer.length === 0) {
      return;
    }

    const socket = this.connectionManager?.getSocket();
    if (!socket || !socket.connected) {
      this._storePendingEvents();
      this.eventBuffer = [];
      return;
    }

    const batch = [...this.eventBuffer];
    this.eventBuffer = [];


    socket.emit('abtest-analytics-batch', { events: batch });
  }

  
  _storePendingEvents() {
    try {
      const existing = localStorage.getItem('mesulo_abtest_pending_events');
      const existingEvents = existing ? JSON.parse(existing) : [];
      const allEvents = [...existingEvents, ...this.eventBuffer];
      
      const eventsToStore = allEvents.slice(-1000);
      localStorage.setItem('mesulo_abtest_pending_events', JSON.stringify(eventsToStore));
      
    } catch (error) {
    }
  }

  
  _loadPendingEvents() {
    try {
      const stored = localStorage.getItem('mesulo_abtest_pending_events');
      if (!stored) {
        return;
      }

      const pendingEvents = JSON.parse(stored);
      if (!Array.isArray(pendingEvents) || pendingEvents.length === 0) {
        return;
      }


      this.eventBuffer.push(...pendingEvents);
      this._flushBatch();

      localStorage.removeItem('mesulo_abtest_pending_events');
    } catch (error) {
      try {
        localStorage.removeItem('mesulo_abtest_pending_events');
      } catch (e) {
      }
    }
  }

  
  _hasActiveABTest(gameId) {
    return this.hasActiveABTestCallback ? this.hasActiveABTestCallback(gameId) : false;
  }

  
  _getCreatorId(gameId) {
    if (!this.getABTestAssetsCallback) {
      return null;
    }
    const assets = this.getABTestAssetsCallback(gameId);
    if (!assets) {
      return null;
    }
    if (!assets.creatorId) {
      return null;
    }
    return assets.creatorId;
  }

  
  _getVariantFromVideo(videoElement) {
    if (!videoElement) return null;
    const variant = videoElement.getAttribute('data-mesulo-variant');
    return variant || null;
  }

  
  _getGameIdFromVideo(videoElement) {
    if (!videoElement) return null;
    
    let gameId = videoElement.getAttribute('data-mesulo-game-id');
    if (gameId) return gameId;
    
    let parent = videoElement.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      gameId = parent.getAttribute('data-mesulo-game-id');
      if (gameId) return gameId;
      parent = parent.parentElement;
      depth++;
    }
    
    return null;
  }

  
  _trackImpression(videoElement) {
    if (this.impressionsLogged.has(videoElement)) {
      return;
    }

    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const assets = this.getABTestAssetsCallback ? this.getABTestAssetsCallback(gameId) : null;
    
    const variant = assets?.variant || this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    const creatorId = assets?.creatorId || this._getCreatorId(gameId);

    this.impressionsLogged.add(videoElement);
    this._logAnalyticsEvent('impression', gameId, variant, creatorId, {}, videoElement);
  }

  
  _trackHoverStart(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const assets = this.getABTestAssetsCallback ? this.getABTestAssetsCallback(gameId) : null;
    
    const variant = assets?.variant || this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    const creatorId = assets?.creatorId || this._getCreatorId(gameId);

    if (!this.hoverStartTimes.has(videoElement)) {
      this.hoverStartTimes.set(videoElement, Date.now());
      this._logAnalyticsEvent('hover_start', gameId, variant, creatorId, {}, videoElement);
    }
  }

  
  _trackHoverEnd(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const assets = this.getABTestAssetsCallback ? this.getABTestAssetsCallback(gameId) : null;
    const variant = assets?.variant || this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    const creatorId = assets?.creatorId || this._getCreatorId(gameId);

    const startTime = this.hoverStartTimes.get(videoElement);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.hoverStartTimes.delete(videoElement);
      this._logAnalyticsEvent('hover_end', gameId, variant, creatorId, { duration }, videoElement);
    }
  }

  
  _trackTouchStart(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const assets = this.getABTestAssetsCallback ? this.getABTestAssetsCallback(gameId) : null;
    const variant = assets?.variant || this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    const creatorId = assets?.creatorId || this._getCreatorId(gameId);

    const touchData = this.touchInteractions.get(videoElement);
    if (!touchData || !touchData.isActive) {
      this.touchInteractions.set(videoElement, {
        startTime: Date.now(),
        isActive: true
      });
      this._logAnalyticsEvent('hover_start', gameId, variant, creatorId, { device: 'touch' }, videoElement);
    }
  }

  
  _trackTouchEnd(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const assets = this.getABTestAssetsCallback ? this.getABTestAssetsCallback(gameId) : null;
    const variant = assets?.variant || this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    const creatorId = assets?.creatorId || this._getCreatorId(gameId);

    const touchData = this.touchInteractions.get(videoElement);
    if (touchData && touchData.isActive) {
      const duration = Date.now() - touchData.startTime;
      touchData.isActive = false;
      this._logAnalyticsEvent('hover_end', gameId, variant, creatorId, { duration, device: 'touch' }, videoElement);
    }
  }

  
  _trackVideoClick(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const assets = this.getABTestAssetsCallback ? this.getABTestAssetsCallback(gameId) : null;
    const variant = assets?.variant || this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    const creatorId = assets?.creatorId || this._getCreatorId(gameId);

    this._logAnalyticsEvent('video_click', gameId, variant, creatorId, {}, videoElement);
  }

  
  _trackButtonClick(buttonElement) {
    if (!buttonElement) return;

    let gameId = null;
    let variant = null;

    let gameElement = buttonElement.closest('[data-mesulo-game-id]');
    
    if (!gameElement) {
      let parent = buttonElement.parentElement;
      if (parent) {
        if (parent.hasAttribute('data-mesulo-game-id')) {
          gameElement = parent;
        } else {
          const siblings = Array.from(parent.children);
          for (const sibling of siblings) {
            if (sibling.hasAttribute('data-mesulo-game-id')) {
              gameElement = sibling;
              break;
            }
            const gameInSibling = sibling.querySelector('[data-mesulo-game-id]');
            if (gameInSibling) {
              gameElement = gameInSibling;
              break;
            }
          }
        }
      }
    }

    if (!gameElement) {
      let current = buttonElement.parentElement;
      let depth = 0;
      while (current && depth < 3) {
        const gameEl = current.querySelector('[data-mesulo-game-id]');
        if (gameEl) {
          gameElement = gameEl;
          break;
        }
        current = current.parentElement;
        depth++;
      }
    }

    if (gameElement) {
      gameId = gameElement.getAttribute('data-mesulo-game-id');
      
      if (gameId && this._hasActiveABTest(gameId)) {
        const assets = this.getABTestAssetsCallback ? this.getABTestAssetsCallback(gameId) : null;
        variant = assets?.variant;
        
        if (!variant) {
          let videoElement = gameElement.querySelector('video[data-mesulo-variant]');
          
          if (!videoElement) {
            const parent = gameElement.parentElement;
            if (parent) {
              videoElement = parent.querySelector('video[data-mesulo-variant]');
            }
          }
          
          if (!videoElement && gameElement.parentElement) {
            const siblings = Array.from(gameElement.parentElement.children);
            for (const sibling of siblings) {
              videoElement = sibling.querySelector('video[data-mesulo-variant]');
              if (videoElement) break;
            }
          }

          if (videoElement) {
            variant = videoElement.getAttribute('data-mesulo-variant');
          }
        }
      }
    }

    if (!gameId || !this._hasActiveABTest(gameId) || !variant) {
      return;
    }

    const assets = this.getABTestAssetsCallback ? this.getABTestAssetsCallback(gameId) : null;
    const creatorId = assets?.creatorId || this._getCreatorId(gameId);

    this._logAnalyticsEvent('button_click', gameId, variant, creatorId, {}, buttonElement);
  }

  
  _findVideoUnderPoint(x, y) {
    const seen = new Set();
    let el = document.elementFromPoint(x, y);
    let underneath = null;

    while (el && !seen.has(el)) {
      seen.add(el);

      if (/^(BUTTON|A|INPUT|LABEL|SELECT|TEXTAREA)$/i.test(el.tagName)) {
        return null;
      }

      const prev = el.style.pointerEvents;
      el.style.pointerEvents = 'none';
      underneath = document.elementFromPoint(x, y);
      el.style.pointerEvents = prev;

      if (underneath && underneath.tagName === 'VIDEO' && underneath.hasAttribute('data-mesulo-variant')) {
        return underneath;
      }

      el = underneath;
    }

    return null;
  }

  
  setup() {
    if (this.analyticsListenersSetup) {
      return;
    }

    this.impressionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.tagName === 'VIDEO') {
          this._trackImpression(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });

    document.querySelectorAll('video[data-mesulo-variant]').forEach(video => {
      this.impressionObserver.observe(video);
    });

    document.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;

      const videoElement = this._findVideoUnderPoint(e.clientX, e.clientY);
      
      if (videoElement) {
        this._trackHoverStart(videoElement);
        
        this.hoverStartTimes.forEach((startTime, video) => {
          if (video !== videoElement) {
            this._trackHoverEnd(video);
          }
        });
      } else {
        this.hoverStartTimes.forEach((startTime, video) => {
          this._trackHoverEnd(video);
        });
      }
    });

    document.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      this.hoverStartTimes.forEach((startTime, video) => {
        this._trackHoverEnd(video);
      });
    });

    let touchStartVideo = null;
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;

      const videoElement = this._findVideoUnderPoint(e.clientX, e.clientY);
      
      if (videoElement) {
        touchStartVideo = videoElement;
        this._trackTouchStart(videoElement);
      }
    });

    document.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'touch') return;

      if (touchStartVideo) {
        this._trackTouchEnd(touchStartVideo);
        touchStartVideo = null;
      }
    });

    document.addEventListener('pointercancel', (e) => {
      if (e.pointerType !== 'touch') return;

      if (touchStartVideo) {
        this._trackTouchEnd(touchStartVideo);
        touchStartVideo = null;
      }
    });

    document.addEventListener('click', (e) => {
      const videoElement = this._findVideoUnderPoint(e.clientX, e.clientY);
      if (videoElement) {
        this._trackVideoClick(videoElement);
      }
    }, true);

    document.addEventListener('click', (e) => {
      const path = e.composedPath();
      let buttonElement = null;
      
      for (const element of path) {
        if (element && element.tagName === 'BUTTON') {
          buttonElement = element;
          break;
        }
      }
      
      if (!buttonElement) {
        const target = e.target;
        if (target.tagName === 'BUTTON') {
          buttonElement = target;
        } else {
          buttonElement = target.closest('button');
        }
      }
      
      if (buttonElement) {
        this._trackButtonClick(buttonElement);
      }
    }, true);

    document.addEventListener('touchend', (e) => {
      const path = e.composedPath();
      let buttonElement = null;
      
      for (const element of path) {
        if (element && element.tagName === 'BUTTON') {
          buttonElement = element;
          break;
        }
      }
      
      if (!buttonElement) {
        const target = e.target;
        if (target.tagName === 'BUTTON') {
          buttonElement = target;
        } else {
          buttonElement = target.closest('button');
        }
      }
      
      if (buttonElement) {
        this._trackButtonClick(buttonElement);
      }
    }, true);

    const videoObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.tagName === 'VIDEO' && node.hasAttribute('data-mesulo-variant')) {
              this.impressionObserver.observe(node);
            }
            const videos = node.querySelectorAll?.('video[data-mesulo-variant]');
            videos?.forEach(video => {
              this.impressionObserver.observe(video);
            });
          }
        });
      });
    });

    videoObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.analyticsListenersSetup = true;

    this._loadPendingEvents();
  }

  
  cleanup() {
    this._flushBatch();

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.impressionObserver) {
      this.impressionObserver.disconnect();
      this.impressionObserver = null;
    }
    this.analyticsListenersSetup = false;
    this.hoverStartTimes.clear();
  }
}

