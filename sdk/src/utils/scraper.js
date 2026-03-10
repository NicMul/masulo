/**
 * Scrapes the DOM for any instances of mesulo games.
 * Looks for both `<mesulo-game>` custom elements and legacy `[data-mesulo-game-id]` elements.
 * Returns an array of objects containing the game id, name, and thumbnail.
 */
export function scrapeGamesFromDOM() {
  const games = new Map();
  
  // 1. Find all custom elements
  const customElements = document.querySelectorAll('mesulo-game');
  customElements.forEach(el => {
    const id = el.getAttribute('game-id');
    if (!id) return;
    
    // Attempt to extract metadata
    let name = el.getAttribute('game-name') || '';
    let thumbnail = el.getAttribute('thumbnail') || el.getAttribute('poster') || '';
    
    // If name/thumbnail not on element attributes, try looking inside the element structure
    if (!name) {
      // Find heading or generic text that might represent a title
      const titleEl = el.querySelector('h1, h2, h3, h4, h5, h6, .game-title, .title');
      if (titleEl && titleEl.textContent) {
        name = titleEl.textContent.trim();
      } else {
        name = `Scraped Game ${id.substring(0, 8)}`; // fallback
      }
    }
    
    if (!thumbnail) {
      // Look for an image
      const imgEl = el.querySelector('img');
      if (imgEl && imgEl.src) {
        thumbnail = imgEl.src;
      }
    }

    if (!games.has(id)) {
      games.set(id, { id, name, thumbnail });
    }
  });

  // 2. Find all legacy elements
  const legacyElements = document.querySelectorAll('[data-mesulo-game-id]');
  legacyElements.forEach(el => {
    const id = el.getAttribute('data-mesulo-game-id');
    if (!id) return;
    
    // Extract metadata
    let name = el.getAttribute('data-name') || '';
    let thumbnail = el.getAttribute('data-thumbnail') || el.getAttribute('data-poster') || '';
    
    // If not in attributes, look inside the standard structure
    if (!name) {
      const titleEl = el.querySelector('h1, h2, h3, h4, h5, h6, .game-title, .title, [data-title]');
      if (titleEl && titleEl.textContent) {
        name = titleEl.textContent.trim();
      } else {
        name = `Scraped Game ${id.substring(0, 8)}`; // fallback
      }
    }
    
    if (!thumbnail) {
      const imgEl = el.querySelector('img');
      if (imgEl && imgEl.src) {
        thumbnail = imgEl.src;
      }
    }
    
    if (!games.has(id)) {
      games.set(id, { id, name, thumbnail });
    }
  });

  return Array.from(games.values());
}
