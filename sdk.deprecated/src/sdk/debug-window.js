export class DebugWindow {
  constructor(sdk) {
    this.sdk = sdk;
    this.gameRooms = new Map();
    this.eventIndex = 0;
    this.socket = null;
    this.isVisible = true;
    this.currentTab = 'connection';
    
    this.createFloatingWindow();
    this.createReopenButton();
    this.setupEventListeners();
    this.waitForSocket();
  }
  
  createFloatingWindow() {
    // Create container
    const container = document.createElement('div');
    container.id = 'mesulo-debug-window';
    container.innerHTML = `
      <div class="mesulo-debug-header">
        <div class="mesulo-debug-tabs">
          <button class="mesulo-debug-tab active" data-tab="connection">Connection</button>
          <button class="mesulo-debug-tab" data-tab="rooms">Games & Rooms</button>
          <button class="mesulo-debug-tab" data-tab="events">Events</button>
          <button class="mesulo-debug-tab" data-tab="analytics">Analytics</button>
        </div>
        <div class="mesulo-debug-controls">
          <button class="mesulo-debug-minimize" title="Minimize">−</button>
          <button class="mesulo-debug-close" title="Close">×</button>
        </div>
      </div>
      
      <div class="mesulo-debug-body">
        <!-- Tab 1: Connection Info -->
        <div class="mesulo-debug-tab-content active" data-tab="connection">
          <div class="mesulo-debug-section">
            <div class="mesulo-info-grid">
              <div class="mesulo-info-item">
                <span class="mesulo-info-label">Application ID:</span>
                <span class="mesulo-info-value" id="mesulo-debug-app-id">-</span>
              </div>
              <div class="mesulo-info-item">
                <span class="mesulo-info-label">Session ID:</span>
                <span class="mesulo-info-value" id="mesulo-debug-session-id">-</span>
              </div>
              <div class="mesulo-info-item">
                <span class="mesulo-info-label">Socket ID:</span>
                <span class="mesulo-info-value" id="mesulo-debug-socket-id">-</span>
              </div>
              <div class="mesulo-info-item">
                <span class="mesulo-info-label">Connection Status:</span>
                <span class="mesulo-info-value mesulo-status-badge" id="mesulo-debug-status">Disconnected</span>
              </div>
              <div class="mesulo-info-item">
                <span class="mesulo-info-label">Event Index:</span>
                <span class="mesulo-info-value" id="mesulo-debug-index">0</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tab 2: Games, Groups & Rooms -->
        <div class="mesulo-debug-tab-content" data-tab="rooms">
          <div class="mesulo-debug-section">
            <h4>Game Rooms <span class="mesulo-room-badge" id="mesulo-room-count">0</span></h4>
            <div class="mesulo-rooms-container" id="mesulo-rooms-container">
              <div class="mesulo-no-rooms">No game rooms joined yet</div>
            </div>
          </div>
        </div>
        
        <!-- Tab 3: Event Logs -->
        <div class="mesulo-debug-tab-content" data-tab="events">
          <div class="mesulo-debug-section">
            <div class="mesulo-events-header">
              <h4>Socket Events</h4>
              <button class="mesulo-clear-log-btn" id="mesulo-clear-log">Clear Log</button>
            </div>
            <div class="mesulo-events-log" id="mesulo-events-log">
              <div class="mesulo-log-entry mesulo-log-info">
                <span class="mesulo-log-time">--:--:--</span>
                <span class="mesulo-log-type">INFO</span>
                <span class="mesulo-log-message">Debug window initialized</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tab 4: Analytics Logs -->
        <div class="mesulo-debug-tab-content" data-tab="analytics">
          <div class="mesulo-debug-section">
            <div class="mesulo-events-header">
              <h4>Analytics Events</h4>
              <button class="mesulo-clear-log-btn" id="mesulo-clear-analytics-log">Clear Log</button>
            </div>
            <div class="mesulo-events-log" id="mesulo-analytics-log">
              <div class="mesulo-log-entry mesulo-log-info">
                <span class="mesulo-log-time">--:--:--</span>
                <span class="mesulo-log-type">INFO</span>
                <span class="mesulo-log-message">Analytics logging initialized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mesulo-debug-resize-handle"></div>
    `;
    
    // Add styles
    this.injectStyles();
    
    // Add to document
    document.body.appendChild(container);
    
    this.container = container;
    this.setupDragAndResize();
  }
  
  injectStyles() {
    if (document.getElementById('mesulo-debug-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mesulo-debug-styles';
    style.textContent = `
      #mesulo-debug-window {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 550px;
        max-width: 90vw;
        height: 600px;
        max-height: 80vh;
        background: linear-gradient(145deg, rgba(20, 20, 35, 0.98), rgba(15, 15, 25, 0.98));
        border: 2px solid rgba(218, 165, 32, 0.3);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        overflow: hidden;
      }
      
      #mesulo-debug-window.minimized {
        height: 50px;
      }
      
      .mesulo-debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(218, 165, 32, 0.1);
        border-bottom: 1px solid rgba(218, 165, 32, 0.3);
        cursor: move;
        user-select: none;
      }
      
      .mesulo-debug-tabs {
        display: flex;
        gap: 8px;
      }
      
      .mesulo-debug-tab {
        background: transparent;
        border: 1px solid rgba(218, 165, 32, 0.3);
        color: rgba(255, 255, 255, 0.7);
        padding: 8px 6px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      
      .mesulo-debug-tab:hover {
        background: rgba(218, 165, 32, 0.1);
        color: #FFD700;
      }
      
      .mesulo-debug-tab.active {
        background: rgba(218, 165, 32, 0.2);
        color: #FFD700;
        border-color: #FFD700;
      }
      
      .mesulo-debug-controls {
        display: flex;
        gap: 8px;
      }
      
      .mesulo-debug-minimize,
      .mesulo-debug-close {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .mesulo-debug-minimize:hover {
        background: rgba(251, 191, 36, 0.2);
        border-color: #fbbf24;
      }
      
      .mesulo-debug-close:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: #ef4444;
      }
      
      .mesulo-debug-body {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      #mesulo-debug-window.minimized .mesulo-debug-body {
        display: none;
      }
      
      #mesulo-debug-window.minimized .mesulo-debug-resize-handle {
        display: none;
      }
      
      .mesulo-debug-tab-content {
        display: none;
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      
      .mesulo-debug-tab-content.active {
        display: flex;
        flex-direction: column;
      }
      
      .mesulo-debug-section {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .mesulo-debug-section h4 {
        margin: 0 0 12px 0;
        font-size: 1.1rem;
        color: #FFD700;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .mesulo-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      
      .mesulo-info-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .mesulo-info-label {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .mesulo-info-value {
        color: #ffffff;
        font-size: 0.9rem;
        font-weight: 600;
        font-family: 'Courier New', monospace;
        word-break: break-all;
      }
      
      .mesulo-status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.8rem;
        text-transform: uppercase;
      }
      
      .mesulo-status-badge.connected {
        background: rgba(74, 222, 128, 0.2);
        color: #4ade80;
        border: 1px solid rgba(74, 222, 128, 0.4);
      }
      
      .mesulo-status-badge.disconnected {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }
      
      .mesulo-status-badge.connecting {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.4);
      }
      
      .mesulo-room-badge {
        background: rgba(218, 165, 32, 0.2);
        color: #FFD700;
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      
      .mesulo-rooms-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
        overflow-y: auto;
      }
      
      .mesulo-room-item {
        background: rgba(10, 10, 20, 0.5);
        padding: 12px 16px;
        border-radius: 8px;
        border-left: 3px solid rgba(218, 165, 32, 0.5);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mesulo-room-name {
        color: #ffffff;
        font-weight: 600;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
      }
      
      .mesulo-room-count {
        background: rgba(218, 165, 32, 0.2);
        color: #FFD700;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        min-width: 30px;
        text-align: center;
      }
      
      .mesulo-no-rooms {
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        padding: 30px;
        font-style: italic;
      }
      
      .mesulo-events-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .mesulo-clear-log-btn {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.4);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .mesulo-clear-log-btn:hover {
        background: rgba(239, 68, 68, 0.3);
      }
      
      .mesulo-events-log {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 8px;
        padding: 12px;
        flex: 1;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.75rem;
        line-height: 1.5;
      }
      
      .mesulo-log-entry {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 10px;
        margin-bottom: 6px;
        border-radius: 6px;
        border-left: 3px solid transparent;
      }
      
      .mesulo-log-entry-header {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .mesulo-log-entry.mesulo-log-info {
        border-left-color: rgba(59, 130, 246, 0.6);
        background: rgba(59, 130, 246, 0.1);
      }
      
      .mesulo-log-entry.mesulo-log-success {
        border-left-color: rgba(74, 222, 128, 0.6);
        background: rgba(74, 222, 128, 0.1);
      }
      
      .mesulo-log-entry.mesulo-log-warning {
        border-left-color: rgba(251, 191, 36, 0.6);
        background: rgba(251, 191, 36, 0.1);
      }
      
      .mesulo-log-entry.mesulo-log-error {
        border-left-color: rgba(239, 68, 68, 0.6);
        background: rgba(239, 68, 68, 0.1);
      }
      
      .mesulo-log-entry.mesulo-log-event {
        border-left-color: rgba(218, 165, 32, 0.6);
        background: rgba(218, 165, 32, 0.1);
      }
      
      .mesulo-log-time {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.7rem;
        min-width: 70px;
      }
      
      .mesulo-log-type {
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.5px;
        min-width: 70px;
      }
      
      .mesulo-log-entry.mesulo-log-info .mesulo-log-type {
        color: #3b82f6;
      }
      
      .mesulo-log-entry.mesulo-log-success .mesulo-log-type {
        color: #4ade80;
      }
      
      .mesulo-log-entry.mesulo-log-warning .mesulo-log-type {
        color: #fbbf24;
      }
      
      .mesulo-log-entry.mesulo-log-error .mesulo-log-type {
        color: #ef4444;
      }
      
      .mesulo-log-entry.mesulo-log-event .mesulo-log-type {
        color: #FFD700;
      }
      
      .mesulo-log-message {
        color: rgba(255, 255, 255, 0.9);
        word-break: break-word;
        flex: 1;
      }
      
      .mesulo-log-payload-toggle {
        margin-top: 6px;
        padding: 5px 10px;
        background: rgba(218, 165, 32, 0.1);
        border: 1px solid rgba(218, 165, 32, 0.3);
        border-radius: 4px;
        color: #FFD700;
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
        width: fit-content;
      }
      
      .mesulo-log-payload-toggle:hover {
        background: rgba(218, 165, 32, 0.2);
      }
      
      .mesulo-log-payload-icon {
        display: inline-block;
        transition: transform 0.2s ease;
        font-size: 0.65rem;
      }
      
      .mesulo-log-payload-toggle.collapsed .mesulo-log-payload-icon {
        transform: rotate(-90deg);
      }
      
      .mesulo-log-payload {
        margin-top: 6px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.7rem;
        white-space: pre-wrap;
        overflow-x: auto;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .mesulo-log-payload.collapsed {
        display: none;
      }
      
      .mesulo-debug-resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 50%, rgba(218, 165, 32, 0.3) 50%);
      }
      
      @media (max-width: 768px) {
        #mesulo-debug-window {
          width: 100vw;
          height: 100vh;
          max-width: 100vw;
          max-height: 100vh;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  createReopenButton() {
    const reopenButton = document.createElement('div');
    reopenButton.id = 'mesulo-debug-reopen';
    reopenButton.innerHTML = '🔧';
    reopenButton.title = 'Open Debug Window';
    reopenButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(145deg, rgba(20, 20, 35, 0.98), rgba(15, 15, 25, 0.98));
      border: 2px solid rgba(218, 165, 32, 0.3);
      border-radius: 50%;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999998;
      font-size: 24px;
      transition: all 0.2s ease;
      user-select: none;
    `;
    
    reopenButton.addEventListener('mouseenter', () => {
      reopenButton.style.background = 'linear-gradient(145deg, rgba(30, 30, 45, 0.98), rgba(25, 25, 35, 0.98))';
      reopenButton.style.borderColor = 'rgba(218, 165, 32, 0.6)';
      reopenButton.style.transform = 'scale(1.1)';
    });
    
    reopenButton.addEventListener('mouseleave', () => {
      reopenButton.style.background = 'linear-gradient(145deg, rgba(20, 20, 35, 0.98), rgba(15, 15, 25, 0.98))';
      reopenButton.style.borderColor = 'rgba(218, 165, 32, 0.3)';
      reopenButton.style.transform = 'scale(1)';
    });
    
    reopenButton.addEventListener('click', () => {
      this.show();
    });
    
    document.body.appendChild(reopenButton);
    this.reopenButton = reopenButton;
  }
  
  setupEventListeners() {
    // Tab switching
    this.container.querySelectorAll('.mesulo-debug-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });
    
    // Minimize button
    this.container.querySelector('.mesulo-debug-minimize').addEventListener('click', () => {
      this.container.classList.toggle('minimized');
    });
    
    // Close button
    this.container.querySelector('.mesulo-debug-close').addEventListener('click', () => {
      this.hide();
    });
    
    // Clear log button
    document.getElementById('mesulo-clear-log').addEventListener('click', () => {
      const logContainer = document.getElementById('mesulo-events-log');
      if (logContainer) {
        logContainer.innerHTML = '';
        this.logEvent('info', 'Log cleared');
      }
    });
    
    // Clear analytics log button
    document.getElementById('mesulo-clear-analytics-log').addEventListener('click', () => {
      const logContainer = document.getElementById('mesulo-analytics-log');
      if (logContainer) {
        logContainer.innerHTML = '';
        this.logAnalytics('info', 'Analytics log cleared');
      }
    });
  }
  
  switchTab(tabName) {
    // Update tab buttons
    this.container.querySelectorAll('.mesulo-debug-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    this.container.querySelectorAll('.mesulo-debug-tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tabName);
    });
    
    this.currentTab = tabName;
  }
  
  setupDragAndResize() {
    const header = this.container.querySelector('.mesulo-debug-header');
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.mesulo-debug-tab, .mesulo-debug-minimize, .mesulo-debug-close')) {
        return;
      }
      
      isDragging = true;
      initialX = e.clientX - this.container.offsetLeft;
      initialY = e.clientY - this.container.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      this.container.style.left = currentX + 'px';
      this.container.style.top = currentY + 'px';
      this.container.style.bottom = 'auto';
      this.container.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  waitForSocket() {
    if (this.sdk.connectionManager && this.sdk.socket) {
      this.socket = this.sdk.socket;
      this.setupSocketListeners();
      this.logEvent('success', 'Socket connected to debug window');
    } else {
      setTimeout(() => this.waitForSocket(), 100);
    }
  }
  
  setupSocketListeners() {
    if (!this.socket) return;
    
    // Update connection info
    this.updateConnectionInfo();
    setInterval(() => this.updateConnectionInfo(), 2000);
    
    // Detect games on page
    this.detectPageGames();
    
    // Request room counts after detecting games
    if (this.gameRooms.size > 0) {
      setTimeout(() => {
        this.requestRoomCounts();
      }, 1000);
    }
    
    // Request room counts periodically
    setInterval(() => {
      this.requestRoomCounts();
    }, 3000);
    
    // Listen to socket events
    const events = [
      'connect',
      'disconnect',
      'connect_error',
      'games-updated',
      'games-response',
      'promotions-response',
      'promotions-updated',
      'abtests-response',
      'abtests-updated',
      'sdk-event',
      'analytics-event',
      'abtest-analytics-batch',
      'join-game-rooms',
      'leave-game-rooms',
      'error'
    ];
    
    events.forEach(eventName => {
      this.socket.on(eventName, (data) => {
        this.handleSocketEvent(eventName, data);
      });
    });
    
    // Hook into SDK events
    const sdkEvents = ['connected', 'disconnected', 'error', 'game-updated', 'gameLaunched'];
    sdkEvents.forEach(eventName => {
      this.sdk.on(eventName, (data) => {
        this.logEvent('event', `SDK Event: ${eventName}`, data);
      });
    });
    
    // Intercept join-game-rooms emit to capture callback with room counts
    const originalEmit = this.socket.emit.bind(this.socket);
    const self = this;
    this.socket.emit = function(event, data, callback) {
      if (event === 'join-game-rooms' && data && data.gameIds && callback) {
        const wrappedCallback = function(response) {
          if (response && response.success && response.roomCounts) {
            // Update room counts from the response
            Object.keys(response.roomCounts).forEach(roomName => {
              const count = response.roomCounts[roomName];
              if (self.gameRooms.has(roomName)) {
                self.gameRooms.get(roomName).count = count;
              } else {
                const gameId = roomName.replace('game:', '');
                self.gameRooms.set(roomName, {
                  name: roomName,
                  gameId: gameId,
                  gameName: 'Unknown Game',
                  count: count
                });
              }
            });
            self.updateRoomsDisplay();
          }
          // Call original callback
          if (callback && typeof callback === 'function') {
            callback(response);
          }
        };
        return originalEmit(event, data, wrappedCallback);
      }
      return originalEmit(event, data, callback);
    };
  }
  
  handleSocketEvent(eventName, data) {
    this.eventIndex++;
    
    let logType = 'event';
    let message = `Socket: ${eventName}`;
    
    if (eventName === 'connect') {
      logType = 'success';
      message = 'Socket connected';
      this.updateConnectionInfo();
      // Request room counts when socket connects
      setTimeout(() => {
        this.requestRoomCounts();
      }, 500);
    } else if (eventName === 'disconnect') {
      logType = 'warning';
      message = `Socket disconnected: ${data || 'Unknown reason'}`;
      this.updateConnectionInfo();
    } else if (eventName === 'connect_error') {
      logType = 'error';
      message = `Connection error: ${data?.message || data}`;
    } else if (eventName === 'join-game-rooms') {
      logType = 'success';
      message = 'Joined game rooms';
      this.updateRoomsFromEvent(data);
    } else if (eventName === 'games-updated' || eventName === 'games-response') {
      logType = 'success';
      message = `Games ${eventName === 'games-updated' ? 'updated' : 'received'}`;
      if (data?.games) {
        message += ` (${data.games.length} game(s))`;
      }
    }
    
    this.logEvent(logType, message, data);
  }
  
  detectPageGames() {
    const gameImages = document.querySelectorAll('img[data-mesulo-game-id]');
    const gameIds = new Set();
    
    gameImages.forEach(img => {
      const gameId = img.getAttribute('data-mesulo-game-id');
      if (gameId) {
        gameIds.add(gameId);
        const roomName = `game:${gameId}`;
        const gameName = img.alt || img.closest('article')?.getAttribute('aria-label') || 'Unknown Game';
        
        if (!this.gameRooms.has(roomName)) {
          this.gameRooms.set(roomName, {
            name: roomName,
            gameId: gameId,
            gameName: gameName,
            count: 0
          });
        }
      }
    });
    
    if (gameIds.size > 0) {
      this.logEvent('info', `Detected ${gameIds.size} game(s) on page`);
      this.updateRoomsDisplay();
      
      // Request room counts after a short delay to allow socket to be ready
      if (this.socket && this.socket.connected) {
        setTimeout(() => {
          this.requestRoomCounts();
        }, 500);
      }
    }
  }
  
  requestRoomCounts() {
    if (!this.socket || !this.socket.connected) return;
    
    const gameIds = Array.from(this.gameRooms.values()).map(room => room.gameId);
    if (gameIds.length === 0) return;
    
    this.socket.emit('get-room-counts', { gameIds }, (response) => {
      if (response && response.success && response.roomCounts) {
        Object.keys(response.roomCounts).forEach(roomName => {
          const count = response.roomCounts[roomName];
          if (this.gameRooms.has(roomName)) {
            this.gameRooms.get(roomName).count = count;
          } else {
            const gameId = roomName.replace('game:', '');
            this.gameRooms.set(roomName, {
              name: roomName,
              gameId: gameId,
              gameName: 'Unknown Game',
              count: count
            });
          }
        });
        this.updateRoomsDisplay();
      }
    });
  }
  
  updateRoomsFromEvent(data) {
    // Handle roomCounts from join-game-rooms callback
    if (data?.roomCounts && typeof data.roomCounts === 'object') {
      Object.keys(data.roomCounts).forEach(roomName => {
        const count = data.roomCounts[roomName];
        if (this.gameRooms.has(roomName)) {
          this.gameRooms.get(roomName).count = count;
        } else {
          const gameId = roomName.replace('game:', '');
          this.gameRooms.set(roomName, {
            name: roomName,
            gameId: gameId,
            gameName: 'Unknown Game',
            count: count
          });
        }
      });
      this.updateRoomsDisplay();
    }
    
    // Handle gameIds array (fallback)
    if (data?.gameIds && Array.isArray(data.gameIds)) {
      data.gameIds.forEach(gameId => {
        const roomName = `game:${gameId}`;
        const roomCount = data.roomCounts?.[roomName] || 0;
        
        if (this.gameRooms.has(roomName)) {
          this.gameRooms.get(roomName).count = roomCount;
        } else {
          this.gameRooms.set(roomName, {
            name: roomName,
            gameId: gameId,
            gameName: 'Unknown Game',
            count: roomCount
          });
        }
      });
      this.updateRoomsDisplay();
    }
  }
  
  updateConnectionInfo() {
    const appIdEl = document.getElementById('mesulo-debug-app-id');
    const sessionIdEl = document.getElementById('mesulo-debug-session-id');
    const socketIdEl = document.getElementById('mesulo-debug-socket-id');
    const statusEl = document.getElementById('mesulo-debug-status');
    const indexEl = document.getElementById('mesulo-debug-index');
    
    if (appIdEl) appIdEl.textContent = this.sdk.applicationKey || '-';
    if (sessionIdEl) sessionIdEl.textContent = this.sdk.sessionId || '-';
    if (socketIdEl) socketIdEl.textContent = this.socket?.id || '-';
    if (indexEl) indexEl.textContent = this.eventIndex.toString();
    
    if (statusEl) {
      if (this.socket?.connected) {
        statusEl.textContent = 'Connected';
        statusEl.className = 'mesulo-info-value mesulo-status-badge connected';
      } else if (this.socket) {
        statusEl.textContent = 'Disconnected';
        statusEl.className = 'mesulo-info-value mesulo-status-badge disconnected';
      } else {
        statusEl.textContent = 'Connecting...';
        statusEl.className = 'mesulo-info-value mesulo-status-badge connecting';
      }
    }
  }
  
  updateRoomsDisplay() {
    const container = document.getElementById('mesulo-rooms-container');
    const badge = document.getElementById('mesulo-room-count');
    
    if (!container) return;
    
    if (this.gameRooms.size === 0) {
      container.innerHTML = '<div class="mesulo-no-rooms">No game rooms joined yet</div>';
      if (badge) badge.textContent = '0';
      return;
    }
    
    let html = '';
    this.gameRooms.forEach((room) => {
      html += `
        <div class="mesulo-room-item">
          <div>
            <div class="mesulo-room-name">${room.name}</div>
            ${room.gameName ? `<div style="color: #FFD700; font-size: 0.75rem; margin-top: 4px;">${room.gameName}</div>` : ''}
            ${room.gameId ? `<div style="color: rgba(255,255,255,0.4); font-size: 0.65rem; margin-top: 2px;">ID: ${room.gameId.substring(0, 8)}...</div>` : ''}
          </div>
          <span class="mesulo-room-count">${room.count || 0}</span>
        </div>
      `;
    });
    
    container.innerHTML = html;
    if (badge) badge.textContent = this.gameRooms.size.toString();
  }
  
  logEvent(type, message, data = null) {
    const logContainer = document.getElementById('mesulo-events-log');
    if (!logContainer) return;
    
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `mesulo-log-entry mesulo-log-${type}`;
    
    let html = `
      <div class="mesulo-log-entry-header">
        <span class="mesulo-log-time">${time}</span>
        <span class="mesulo-log-type">${type.toUpperCase()}</span>
        <span class="mesulo-log-message">${message}</span>
      </div>
    `;
    
    let dataId = null;
    let toggleId = null;
    
    if (data) {
      dataId = `payload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      toggleId = `toggle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      html += `
        <div class="mesulo-log-payload-toggle collapsed" id="${toggleId}" data-target="${dataId}">
          <span class="mesulo-log-payload-icon">▼</span>
          <span>Show Payload</span>
        </div>
        <div class="mesulo-log-payload collapsed" id="${dataId}">${JSON.stringify(data, null, 2)}</div>
      `;
    }
    
    entry.innerHTML = html;
    logContainer.appendChild(entry);
    
    // Add toggle handler
    if (data && toggleId && dataId) {
      const toggle = entry.querySelector(`#${toggleId}`);
      const payload = entry.querySelector(`#${dataId}`);
      
      if (toggle && payload) {
        toggle.addEventListener('click', () => {
          const isCollapsed = toggle.classList.contains('collapsed');
          toggle.classList.toggle('collapsed');
          payload.classList.toggle('collapsed');
          toggle.querySelector('span:last-child').textContent = isCollapsed ? 'Hide Payload' : 'Show Payload';
        });
      }
    }
    
    // Auto-scroll
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Limit entries
    const entries = logContainer.querySelectorAll('.mesulo-log-entry');
    if (entries.length > 500) {
      entries[0].remove();
    }
  }
  
  logAnalytics(type, message, data = null) {
    const logContainer = document.getElementById('mesulo-analytics-log');
    if (!logContainer) {
      console.log('[DebugWindow] logAnalytics: Container not found', { type, message });
      return;
    }
    
    console.log('[DebugWindow] logAnalytics called', { type, message, hasContainer: !!logContainer, containerId: logContainer.id });
    
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `mesulo-log-entry mesulo-log-${type}`;
    
    let html = `
      <div class="mesulo-log-entry-header">
        <span class="mesulo-log-time">${time}</span>
        <span class="mesulo-log-type">${type.toUpperCase()}</span>
        <span class="mesulo-log-message">${message}</span>
      </div>
    `;
    
    let dataId = null;
    let toggleId = null;
    
    if (data) {
      dataId = `analytics-payload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      toggleId = `analytics-toggle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      html += `
        <div class="mesulo-log-payload-toggle collapsed" id="${toggleId}" data-target="${dataId}">
          <span class="mesulo-log-payload-icon">▼</span>
          <span>Show Payload</span>
        </div>
        <div class="mesulo-log-payload collapsed" id="${dataId}">${JSON.stringify(data, null, 2)}</div>
      `;
    }
    
    entry.innerHTML = html;
    logContainer.appendChild(entry);
    console.log('[DebugWindow] Entry appended to analytics log', { type, message, entryCount: logContainer.children.length });
    
    // Add toggle handler
    if (data && toggleId && dataId) {
      const toggle = entry.querySelector(`#${toggleId}`);
      const payload = entry.querySelector(`#${dataId}`);
      
      if (toggle && payload) {
        toggle.addEventListener('click', () => {
          const isCollapsed = toggle.classList.contains('collapsed');
          toggle.classList.toggle('collapsed');
          payload.classList.toggle('collapsed');
          toggle.querySelector('span:last-child').textContent = isCollapsed ? 'Hide Payload' : 'Show Payload';
        });
      }
    }
    
    // Auto-scroll
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Limit entries
    const entries = logContainer.querySelectorAll('.mesulo-log-entry');
    if (entries.length > 500) {
      entries[0].remove();
    }
  }
  
  show() {
    this.container.style.display = 'flex';
    this.isVisible = true;
    if (this.reopenButton) {
      this.reopenButton.style.display = 'none';
    }
  }
  
  hide() {
    this.container.style.display = 'none';
    this.isVisible = false;
    if (this.reopenButton) {
      this.reopenButton.style.display = 'flex';
    }
  }
  
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

