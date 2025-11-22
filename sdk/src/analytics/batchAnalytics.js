
export class BatchAnalytics {
  constructor(connectionManager, analyticsEnabled = true) {
    this.connectionManager = connectionManager;
    this.analyticsEnabled = analyticsEnabled;
    this.sessionId = this.generateSessionId();
    this.eventBuffer = [];
    this.batchSize = 50; // Flush when buffer reaches this size
    this.batchTimeout = 5000; // Flush every 5 seconds
    this.batchTimer = null;
    this.gamesMap = new Map(); // Store game data for analytics checks
    this.clickListenersSetup = false;

    // Bind methods
    this._flushBatch = this._flushBatch.bind(this);
  }

  setupGlobalClickTracking() {
    if (this.clickListenersSetup) {
      return;
    }

    // Track video clicks - find video under click point
    document.addEventListener('click', (e) => {
      const videoElement = this._findVideoUnderPoint(e.clientX, e.clientY);
      if (videoElement && videoElement.hasAttribute('data-mesulo-game-id')) {
        const gameId = videoElement.getAttribute('data-mesulo-game-id');
        const videoUrl = videoElement.src || videoElement.getAttribute('data-mesulo-video-url');

        if (videoUrl && this.analyticsEnabled) {
          const game = this.gamesMap.get(gameId);
          if (game) { // Relaxed check
            this.trackEvent('video_click', gameId, 'video', videoUrl, {
              viewport: this.getViewportInfo()
            }, false);
          }
        }
      }
    }, true);

    // Track button clicks
    document.addEventListener('click', (e) => {
      const path = e.composedPath();
      let buttonElement = null;

      for (const element of path) {
        if (element && (element.tagName === 'BUTTON' || (element.tagName === 'A' && element.href))) {
          buttonElement = element;
          break;
        }
      }

      if (!buttonElement) {
        const target = e.target;
        if (target.tagName === 'BUTTON' || (target.tagName === 'A' && target.href)) {
          buttonElement = target;
        } else {
          buttonElement = target.closest('button, a[href]');
        }
      }

      if (buttonElement) {
        // Find the game ID from the button's context
        let gameId = null;
        let gameElement = buttonElement.closest('[data-mesulo-game-id]');

        if (!gameElement) {
          let parent = buttonElement.parentElement;
          let depth = 0;
          while (parent && depth < 5) {
            gameElement = parent.querySelector('[data-mesulo-game-id]');
            if (gameElement) break;
            parent = parent.parentElement;
            depth++;
          }
        }

        if (gameElement) {
          gameId = gameElement.getAttribute('data-mesulo-game-id');
        }

        if (gameId && this.analyticsEnabled) {
          const game = this.gamesMap.get(gameId);
          if (game) { // Relaxed check
            const buttonType = buttonElement.tagName.toLowerCase();
            const buttonHref = buttonElement.href || '';

            this.trackEvent('button_click', gameId, 'button', buttonHref, {
              buttonType,
              viewport: this.getViewportInfo()
            }, false);
          }
        }
      }
    }, true);

    this.clickListenersSetup = true;
  }

  _findVideoUnderPoint(x, y) {
    const seen = new Set();
    let el = document.elementFromPoint(x, y);
    let underneath = null;

    while (el && !seen.has(el)) {
      seen.add(el);

      if (el.tagName === 'VIDEO' && el.hasAttribute('data-mesulo-game-id')) {
        return el;
      }

      const prev = el.style.pointerEvents;
      el.style.pointerEvents = 'none';
      underneath = document.elementFromPoint(x, y);
      el.style.pointerEvents = prev;

      if (underneath && underneath.tagName === 'VIDEO' && underneath.hasAttribute('data-mesulo-game-id')) {
        return underneath;
      }

      el = underneath;
    }

    return null;
  }

  generateSessionId() {
    try {
      const existing = sessionStorage.getItem('mesulo_session_id');
      if (existing) return existing;

      const sessionId = 'mesulo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('mesulo_session_id', sessionId);
      return sessionId;
    } catch (e) {
      // Fallback if sessionStorage is not available
      return 'mesulo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  getDeviceType() {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|phone/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  getViewportInfo() {
    if (typeof window === 'undefined') return {};
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      device_type: this.getDeviceType(),
      timestamp: new Date().toISOString()
    };
  }

  updateGamesMap(gamesData) {
    if (!gamesData || !Array.isArray(gamesData)) {
      return;
    }

    gamesData.forEach(game => {
      this.gamesMap.set(game.id, game);
    });
  }

  trackEvent(eventType, gameId, assetType, assetUrl, metadata = {}, ignorePerGameSetting = false) {
    if (!this.analyticsEnabled) {
      return;
    }

    if (!ignorePerGameSetting) {
      const game = this.gamesMap.get(gameId);
      if (!game) {
        return; // Don't track if game doesn't exist
      }
      // Relaxed check: We track even if game.analytics is false, 
      // as long as the global analyticsEnabled is true (checked above)
    }

    const event = {
      id: this._generateEventId(),
      eventType,
      gameId,
      assetType,
      assetUrl,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metadata: {
        ...this.getViewportInfo(),
        ...metadata
      }
    };

    this.eventBuffer.push(event);

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.batchSize) {
      this._flushBatch();
    } else {
      this._scheduleBatchFlush();
    }
  }

  _generateEventId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  _scheduleBatchFlush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(this._flushBatch, this.batchTimeout);
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

    socket.emit('analytics-event-batch', { events: batch });
  }

  _storePendingEvents() {
    try {
      const existing = localStorage.getItem('mesulo_analytics_pending_events');
      const existingEvents = existing ? JSON.parse(existing) : [];
      const allEvents = [...existingEvents, ...this.eventBuffer];

      // Keep only last 1000 events
      const eventsToStore = allEvents.slice(-1000);
      localStorage.setItem('mesulo_analytics_pending_events', JSON.stringify(eventsToStore));

    } catch (error) {
      // Ignore localStorage errors
    }
  }

  _loadPendingEvents() {
    try {
      const stored = localStorage.getItem('mesulo_analytics_pending_events');
      if (!stored) {
        return;
      }

      const pendingEvents = JSON.parse(stored);
      if (!Array.isArray(pendingEvents) || pendingEvents.length === 0) {
        return;
      }

      // Add pending events to buffer
      this.eventBuffer.push(...pendingEvents);

      this._flushBatch();

      localStorage.removeItem('mesulo_analytics_pending_events');
    } catch (error) {
      try {
        localStorage.removeItem('mesulo_analytics_pending_events');
      } catch (e) {
        // Ignore
      }
    }
  }

  // Called when connection is established to flush any buffered events
  onConnectionEstablished() {
    // Load any pending events from localStorage first
    this._loadPendingEvents();

    // Then flush any events currently in buffer
    if (this.eventBuffer.length > 0) {
      this._flushBatch();
    }
  }
}
