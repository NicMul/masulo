import { scheduleChunkedTask } from './scheduler.js';

export function upgradeLegacyGameElements() {
    console.log('[DOM Upgrader] Running upgradeLegacyGameElements()');
    const legacyElements = document.querySelectorAll('[data-mesulo-game-id]:not(mesulo-game)');
    console.log('[DOM Upgrader] Found legacy elements count:', legacyElements.length);

    if (legacyElements.length === 0) return;

    console.log('[DOM Upgrader] Scheduling chunked task for', legacyElements.length, 'elements');

    // Use scheduleChunkedTask to avoid blocking the main thread if there are many elements
    scheduleChunkedTask(Array.from(legacyElements), (oldEl) => {
        // Double check it hasn't been upgraded yet
        if (oldEl.tagName.toLowerCase() === 'mesulo-game') return;

        const newEl = document.createElement('mesulo-game');

        // Copy all attributes
        Array.from(oldEl.attributes).forEach(attr => {
            newEl.setAttribute(attr.name, attr.value);
        });

        // Move all children
        while (oldEl.firstChild) {
            newEl.appendChild(oldEl.firstChild);
        }

        // Replace in DOM
        if (oldEl.parentNode) {
            oldEl.parentNode.replaceChild(newEl, oldEl);
        }
    }, { timeout: 1000 });
}

export function observeAndUpgradeDOM() {
    // Initial upgrade
    upgradeLegacyGameElements();

    // Set up observer for dynamically added elements
    const observer = new MutationObserver((mutations) => {
        let shouldUpgrade = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // ELEMENT_NODE
                        if (node.hasAttribute('data-mesulo-game-id') && node.tagName.toLowerCase() !== 'mesulo-game') {
                            shouldUpgrade = true;
                            break;
                        }
                        if (node.querySelector && node.querySelector('[data-mesulo-game-id]:not(mesulo-game)')) {
                            shouldUpgrade = true;
                            break;
                        }
                    }
                }
            }
            if (shouldUpgrade) break;
        }

        if (shouldUpgrade) {
            upgradeLegacyGameElements();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    return observer;
}
