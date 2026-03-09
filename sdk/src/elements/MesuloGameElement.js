import { signal } from '@preact/signals';

// Global store to map gameId -> HTMLElement representing the Light DOM mount points
export const activeGamesStore = signal(new Map());

export function registerMesuloGameElement() {
    if (customElements.get('mesulo-game')) return;

    class MesuloGameElement extends HTMLElement {
        constructor() {
            super();
            this.gameId = null;
        }

        connectedCallback() {
            this.gameId = this.getAttribute('game-id') || this.getAttribute('data-mesulo-game-id');
            if (!this.gameId) return;

            // Ensure the component has block display so lazy loaders/observers work properly
            if (window.getComputedStyle(this).display === 'inline') {
                this.style.display = 'block';
            }

            // We explicitly make it position relative if it isn't already,
            // ensuring child overlays position properly.
            if (window.getComputedStyle(this).position === 'static') {
                this.style.position = 'relative';
            }

            // Add to store instantly upon DOM insertion
            const currentMap = new Map(activeGamesStore.value);
            currentMap.set(this.gameId, this);
            activeGamesStore.value = currentMap;
        }

        disconnectedCallback() {
            if (!this.gameId) return;

            // Cleanup happens instantly when removed from Light DOM
            const currentMap = new Map(activeGamesStore.value);
            currentMap.delete(this.gameId);
            activeGamesStore.value = currentMap;
        }
    }

    customElements.define('mesulo-game', MesuloGameElement);
}
