/**
 * AB Test Analytics Manager
 * Handles tracking of analytics events for AB tests
 */

export class ABTestAnalytics {
  constructor(hasActiveABTestCallback, connectionManager) {
    // Callback to check if a gameId has an active AB test
    this.hasActiveABTestCallback = hasActiveABTestCallback;
    // Connection manager for socket communication
    this.connectionManager = connectionManager;
    
    // Track hover start times: video element -> timestamp
    this.hoverStartTimes = new Map();
    // Track which videos have had impressions logged
    this.impressionsLogged = new WeakSet();
    // IntersectionObserver for tracking impressions
    this.impressionObserver = null;
    // Track if analytics listeners are set up
    this.analyticsListenersSetup = false;
    // Track touch interactions: video element -> { startTime, isActive }
    this.touchInteractions = new WeakMap();
    
    // Batching configuration
    this.eventBuffer = [];
    this.batchSize = 10; // Send when buffer reaches 10 events
    this.batchTimeout = 5000; // Or send every 5 seconds
    this.batchTimer = null;
  }

  /**
   * Detect device type using navigator
   * Returns 'mobile' or 'desktop'
   */
  _detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|phone/i.test(ua)) {
      return 'mobile';
    }
    if (/tablet|ipad/i.test(ua)) {
      return 'mobile'; // Treat tablets as mobile
    }
    return 'desktop';
  }

  /**
   * Map variant from 'A'/'B' to 'variantA'/'variantB'
   */
  _mapVariant(variant) {
    if (variant === 'A') return 'variantA';
    if (variant === 'B') return 'variantB';
    return variant; // Return as-is if already formatted
  }

  /**
   * Build standardized data object for analytics events
   */
  _buildDataObject(eventType, additionalData = {}, element = null) {
    const data = {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY,
      userAgent: navigator.userAgent,
      isTouchDevice: ('ontouchstart' in window && navigator.maxTouchPoints > 0) || 
                     (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Tablet'))
    };

    // Add duration for hover_end events
    if (eventType === 'hover_end' && additionalData.duration !== undefined) {
      data.duration = additionalData.duration;
    }

    // Add button-specific data for button_click events
    if (eventType === 'button_click' && element) {
      data.buttonType = element.tagName.toLowerCase();
      if (element.tagName === 'A' && element.href) {
        data.buttonHref = element.href;
      }
    }

    // Add video-specific data for video_click events
    if (eventType === 'video_click' && element && element.tagName === 'VIDEO') {
      data.videoSrc = element.src || element.currentSrc || '';
    }

    return data;
  }

  /**
   * Log analytics event to console
   * Formats event according to controller payload structure
   */
  _logAnalyticsEvent(eventType, gameId, variant, additionalData = {}, element = null) {
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
      data
    };

    console.log('[Mesulo SDK] AB Test Analytics:', event);
    
    // Send via socket (buffered)
    this._sendAnalyticsEvent(event);
  }

  /**
   * Add event to buffer and trigger flush if needed
   */
  _sendAnalyticsEvent(eventPayload) {
    this.eventBuffer.push(eventPayload);

    // Flush immediately if buffer is full
    if (this.eventBuffer.length >= this.batchSize) {
      this._flushBatch();
    } else {
      // Schedule a flush after timeout
      this._scheduleBatchFlush();
    }
  }

  /**
   * Schedule a batch flush after the timeout period
   */
  _scheduleBatchFlush() {
    // Clear existing timer if any
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Schedule new flush
    this.batchTimer = setTimeout(() => {
      this._flushBatch();
    }, this.batchTimeout);
  }

  /**
   * Flush buffered events to server via socket
   */
  _flushBatch() {
    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // If no events, nothing to do
    if (this.eventBuffer.length === 0) {
      return;
    }

    // Get socket from connection manager
    const socket = this.connectionManager?.getSocket();
    if (!socket || !socket.connected) {
      console.warn('[Mesulo SDK] Socket not connected, storing events locally');
      this._storePendingEvents();
      this.eventBuffer = [];
      return;
    }

    // Copy buffer and clear it
    const batch = [...this.eventBuffer];
    this.eventBuffer = [];

    console.log(`[Mesulo SDK] Flushing ${batch.length} AB test analytics events`);

    // Send batch via socket
    socket.emit('abtest-analytics-batch', { events: batch });
  }

  /**
   * Store pending events in localStorage when disconnected
   */
  _storePendingEvents() {
    try {
      const existing = localStorage.getItem('mesulo_abtest_pending_events');
      const existingEvents = existing ? JSON.parse(existing) : [];
      const allEvents = [...existingEvents, ...this.eventBuffer];
      
      // Limit stored events to prevent localStorage overflow (max 1000 events)
      const eventsToStore = allEvents.slice(-1000);
      localStorage.setItem('mesulo_abtest_pending_events', JSON.stringify(eventsToStore));
      
      console.log(`[Mesulo SDK] Stored ${eventsToStore.length} pending AB test analytics events`);
    } catch (error) {
      console.error('[Mesulo SDK] Error storing pending events:', error);
    }
  }

  /**
   * Load and send pending events from localStorage when connection restored
   */
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

      console.log(`[Mesulo SDK] Loading ${pendingEvents.length} pending AB test analytics events`);

      // Add to buffer and flush
      this.eventBuffer.push(...pendingEvents);
      this._flushBatch();

      // Clear localStorage
      localStorage.removeItem('mesulo_abtest_pending_events');
    } catch (error) {
      console.error('[Mesulo SDK] Error loading pending events:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('mesulo_abtest_pending_events');
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Check if a gameId has an active AB test
   */
  _hasActiveABTest(gameId) {
    return this.hasActiveABTestCallback ? this.hasActiveABTestCallback(gameId) : false;
  }

  /**
   * Get variant for a video element
   */
  _getVariantFromVideo(videoElement) {
    if (!videoElement) return null;
    const variant = videoElement.getAttribute('data-mesulo-variant');
    return variant || null;
  }

  /**
   * Get gameId from video element or its parent
   */
  _getGameIdFromVideo(videoElement) {
    if (!videoElement) return null;
    
    // Check video element itself
    let gameId = videoElement.getAttribute('data-mesulo-game-id');
    if (gameId) return gameId;
    
    // Check parent elements
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

  /**
   * Track impression when variant video becomes visible
   */
  _trackImpression(videoElement) {
    if (this.impressionsLogged.has(videoElement)) {
      return; // Already logged
    }

    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const variant = this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    this.impressionsLogged.add(videoElement);
    this._logAnalyticsEvent('impression', gameId, variant, {}, videoElement);
  }

  /**
   * Track hover start (desktop)
   */
  _trackHoverStart(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const variant = this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    // Only track if not already hovering
    if (!this.hoverStartTimes.has(videoElement)) {
      this.hoverStartTimes.set(videoElement, Date.now());
      this._logAnalyticsEvent('hover_start', gameId, variant, {}, videoElement);
    }
  }

  /**
   * Track hover end and duration (desktop)
   */
  _trackHoverEnd(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const variant = this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    const startTime = this.hoverStartTimes.get(videoElement);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.hoverStartTimes.delete(videoElement);
      this._logAnalyticsEvent('hover_end', gameId, variant, { duration }, videoElement);
    }
  }

  /**
   * Track touch interaction start (mobile/tablet)
   */
  _trackTouchStart(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const variant = this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    // Track touch interaction (similar to hover for analytics)
    const touchData = this.touchInteractions.get(videoElement);
    if (!touchData || !touchData.isActive) {
      this.touchInteractions.set(videoElement, {
        startTime: Date.now(),
        isActive: true
      });
      this._logAnalyticsEvent('hover_start', gameId, variant, { device: 'touch' }, videoElement);
    }
  }

  /**
   * Track touch interaction end and duration (mobile/tablet)
   */
  _trackTouchEnd(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const variant = this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    const touchData = this.touchInteractions.get(videoElement);
    if (touchData && touchData.isActive) {
      const duration = Date.now() - touchData.startTime;
      touchData.isActive = false;
      this._logAnalyticsEvent('hover_end', gameId, variant, { duration, device: 'touch' }, videoElement);
    }
  }

  /**
   * Track click on video (both desktop and touch)
   */
  _trackVideoClick(videoElement) {
    const gameId = this._getGameIdFromVideo(videoElement);
    if (!gameId || !this._hasActiveABTest(gameId)) {
      return;
    }

    const variant = this._getVariantFromVideo(videoElement);
    if (!variant) {
      return;
    }

    this._logAnalyticsEvent('video_click', gameId, variant, {}, videoElement);
  }

  /**
   * Track click on button (both desktop and touch)
   */
  _trackButtonClick(buttonElement) {
    if (!buttonElement) return;

    // Find associated gameId by looking for nearby video or game element
    let gameId = null;
    let variant = null;

    // Strategy 1: Check if button is inside a game card
    let gameElement = buttonElement.closest('[data-mesulo-game-id]');
    
    // Strategy 2: Check siblings (button might be sibling of game card)
    if (!gameElement) {
      let parent = buttonElement.parentElement;
      if (parent) {
        // Check parent
        if (parent.hasAttribute('data-mesulo-game-id')) {
          gameElement = parent;
        } else {
          // Check siblings
          const siblings = Array.from(parent.children);
          for (const sibling of siblings) {
            if (sibling.hasAttribute('data-mesulo-game-id')) {
              gameElement = sibling;
              break;
            }
            // Check for game elements within sibling
            const gameInSibling = sibling.querySelector('[data-mesulo-game-id]');
            if (gameInSibling) {
              gameElement = gameInSibling;
              break;
            }
          }
        }
      }
    }

    // Strategy 3: Check parent's parent (for nested structures)
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
      
      // Find video with variant - check multiple locations
      let videoElement = gameElement.querySelector('video[data-mesulo-variant]');
      
      // If not found in game element, check nearby elements
      if (!videoElement) {
        const parent = gameElement.parentElement;
        if (parent) {
          videoElement = parent.querySelector('video[data-mesulo-variant]');
        }
      }
      
      // If still not found, check siblings
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

    // Debug logging
    if (!gameId) {
      console.log('[Mesulo SDK] Button click detected but no gameId found', {
        button: buttonElement,
        buttonClass: buttonElement.className,
        parent: buttonElement.parentElement
      });
    } else if (!this._hasActiveABTest(gameId)) {
      console.log('[Mesulo SDK] Button click detected but no active AB test for gameId', gameId);
    } else if (!variant) {
      console.log('[Mesulo SDK] Button click detected but no variant found', {
        gameId,
        gameElement,
        hasVideo: !!gameElement?.querySelector('video[data-mesulo-variant]')
      });
    }

    if (!gameId || !this._hasActiveABTest(gameId) || !variant) {
      return;
    }

    this._logAnalyticsEvent('button_click', gameId, variant, {}, buttonElement);
  }

  /**
   * Find video element underneath point (handles overlays)
   */
  _findVideoUnderPoint(x, y) {
    const seen = new Set();
    let el = document.elementFromPoint(x, y);
    let underneath = null;

    while (el && !seen.has(el)) {
      seen.add(el);

      // Skip interactive elements to avoid breaking clicks
      if (/^(BUTTON|A|INPUT|LABEL|SELECT|TEXTAREA)$/i.test(el.tagName)) {
        return null; // Not a video
      }

      const prev = el.style.pointerEvents;
      el.style.pointerEvents = 'none';
      underneath = document.elementFromPoint(x, y);
      el.style.pointerEvents = prev;

      // Stop once we reach a <video> with variant attribute
      if (underneath && underneath.tagName === 'VIDEO' && underneath.hasAttribute('data-mesulo-variant')) {
        return underneath;
      }

      el = underneath;
    }

    return null;
  }

  /**
   * Setup analytics tracking listeners
   */
  setup() {
    if (this.analyticsListenersSetup) {
      return;
    }

    // Setup IntersectionObserver for impressions
    this.impressionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.tagName === 'VIDEO') {
          this._trackImpression(entry.target);
        }
      });
    }, {
      threshold: 0.5 // Consider visible when 50% is in viewport
    });

    // Observe all existing videos with variants
    document.querySelectorAll('video[data-mesulo-variant]').forEach(video => {
      this.impressionObserver.observe(video);
    });

    // Track hover events for desktop (using pointermove)
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return; // Skip for touch (handled separately)

      const videoElement = this._findVideoUnderPoint(e.clientX, e.clientY);
      
      // Track hover start for new video
      if (videoElement) {
        this._trackHoverStart(videoElement);
        
        // Track hover end for previously hovered videos
        this.hoverStartTimes.forEach((startTime, video) => {
          if (video !== videoElement) {
            this._trackHoverEnd(video);
          }
        });
      } else {
        // No video under cursor, end all hovers
        this.hoverStartTimes.forEach((startTime, video) => {
          this._trackHoverEnd(video);
        });
      }
    });

    // Track hover end on mouse leave (fallback for desktop)
    document.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      this.hoverStartTimes.forEach((startTime, video) => {
        this._trackHoverEnd(video);
      });
    });

    // Track touch interactions (mobile/tablet)
    let touchStartVideo = null;
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return; // Only handle touch

      const videoElement = this._findVideoUnderPoint(e.clientX, e.clientY);
      
      // If touching a video, track the interaction start
      if (videoElement) {
        touchStartVideo = videoElement;
        this._trackTouchStart(videoElement);
      }
    });

    // Track touch end (for hover duration tracking)
    document.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'touch') return; // Only handle touch

      if (touchStartVideo) {
        this._trackTouchEnd(touchStartVideo);
        touchStartVideo = null;
      }
    });

    // Track touch cancel (when touch is interrupted)
    document.addEventListener('pointercancel', (e) => {
      if (e.pointerType !== 'touch') return;

      if (touchStartVideo) {
        this._trackTouchEnd(touchStartVideo);
        touchStartVideo = null;
      }
    });

    // Track clicks on videos (both desktop and touch)
    document.addEventListener('click', (e) => {
      const videoElement = this._findVideoUnderPoint(e.clientX, e.clientY);
      if (videoElement) {
        this._trackVideoClick(videoElement);
      }
    }, true); // Use capture phase to catch clicks before they're handled

    // Track clicks on buttons (both desktop and touch)
    document.addEventListener('click', (e) => {
      // Use composedPath to handle shadow DOM and get the actual button
      const path = e.composedPath();
      let buttonElement = null;
      
      // Find button in the event path
      for (const element of path) {
        if (element && element.tagName === 'BUTTON') {
          buttonElement = element;
          break;
        }
      }
      
      // Fallback: check target and closest
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

    // Also track touch events on buttons (touchend)
    document.addEventListener('touchend', (e) => {
      // Use composedPath to handle shadow DOM and get the actual button
      const path = e.composedPath();
      let buttonElement = null;
      
      // Find button in the event path
      for (const element of path) {
        if (element && element.tagName === 'BUTTON') {
          buttonElement = element;
          break;
        }
      }
      
      // Fallback: check target and closest
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

    // Observe new videos added to DOM (for dynamically added content)
    const videoObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            // Check if the added node is a video
            if (node.tagName === 'VIDEO' && node.hasAttribute('data-mesulo-variant')) {
              this.impressionObserver.observe(node);
            }
            // Check for videos within the added node
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

    // Load and send any pending events from previous session
    this._loadPendingEvents();
  }

  /**
   * Clean up observers and listeners (if needed in the future)
   */
  cleanup() {
    // Flush any pending events before cleanup
    this._flushBatch();

    // Clear batch timer
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

