export function injectDebugStyles() {
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
      background-color: #141423;
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

    #mesulo-debug-reopen {
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
    }

    #mesulo-debug-reopen:hover {
      background: linear-gradient(145deg, rgba(30, 30, 45, 0.98), rgba(25, 25, 35, 0.98));
      border-color: rgba(218, 165, 32, 0.6);
      transform: scale(1.1);
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
