# Mesulo Front-End SDK (`mesulo-sdk-preact`)

This SDK is a high-performance, embedded JavaScript widget library designed explicitly to turn static game thumbnails on external publisher websites into dynamic, reactive, and auto-playing video game cards via WebSockets.

## Architecture & Rendering Engine

This SDK uses **Preact** + **@preact/signals** combined with a **Single-Root Web Component Portal Architecture**, specifically engineered to gracefully handle injection into DOM structures housing thousands of elements without blocking the browser's main thread.

### The Single-Root Portal Pattern

The SDK operates fundamentally different than traditional widget setups:
Instead of bootstrapping $N$ separate Preact applications whenever it finds a target game element, it bootstraps exactly **1 global, hidden Preact root** immediately upon script initialization.

Publishers drop an HTML Custom Element `<mesulo-game>` directly onto their page. As the browser parses the DOM natively, it connects the Custom Element lifecycle instantly to a global state store (`activeGamesStore`):

```mermaid
graph TD
    subgraph Publisher DOM (Light DOM)
        Body[document.body]
        G1["<mesulo-game game-id='A1'>" ]
        G2["<mesulo-game game-id='B2'>" ]
        Body --> G1
        Body --> G2
    end
    
    subgraph SDK Internal State
        SDKInit[SDK Init Script]
        Store[(activeGamesStore Signals Map)]
        PreactRoot["<SdkRoot> (Single Engine)"]
        
        SDKInit -->|Mounts 1x| PreactRoot
        G1 -->|connectedCallback| Store
        G2 -->|connectedCallback| Store
        PreactRoot -->|Reacts to| Store
        PreactRoot -->|createPortal| G1
        PreactRoot -->|createPortal| G2
    end
```

### Why we use this architecture:
1. **Zero Layout Thrashing or Mutation Observers**: We no longer actively poll the DOM via JavaScript (`MutationObserver`) searching for `divs` to wrap. The browser's native Custom Elements C++ engine signals us exactly when it mounts or unmounts.
2. **Context Propagation**: With a single Preact Root, WebSocket payloads (e.g. A/B Tests, Global Analytics updates, Promotion streams) are processed exactly once and reactively passed down to thousands of components concurrently.
3. **No Zombie Roots**: When a host Single Page Application (like Next.js or React) unmounts a section of their page, the `<mesulo-game>` is natively disconnected, and it automatically strips itself out of the SDK's internal store.

## Installation / Usage for Publishers

To integrate Mesulo, add the SDK script to your `<head>` or before the closing `</body>` tag:

```html
<script src="https://cdn.mesulo.com/sdk/mesulo-ai-sdk.js" data-mesulo-app-key="YOUR_APP_KEY_HERE" async></script>
```

Wrap every single game thumbnail that you wish to make interactive using the newly registered `<mesulo-game>` custom element, providing the targeting identifier via the `data-mesulo-game-id` or `game-id` attribute:

```html
<!-- Example of a Publisher Integration -->
<div class="casino-grid">
  <mesulo-game game-id="d5352f25-9718-44a6-a95d-1ddd47ea63ce">
     <div class="publisher-thumbnail">
       <img src="/path/to/cleocatra.jpg" alt="Cleocatra Slot" />
     </div>
  </mesulo-game>
</div>
```

The SDK will automatically detect the injection, connect to the Socket, fetch the appropriate interactive `/video.mp4` stream, and gracefully inject it (via `preact/compat` portal) directly into the Light DOM, seamlessly tracking impressions and hover interactions.

## Local Development Flow

To develop modifications to the SDK:

1. `npm install`
2. `npm run dev` (Boots a Vite dev server locally)
3. Visit `http://localhost:5173/` which serves `index.html`. This file mocks a full publisher website with thousands of generated `<mesulo-game>` Custom Elements for load testing.

### Production Builds
`npm run build`
Compiles, Minifies, and outputs to `/dist/mesulo-ai-sdk.js`.
The build process utilizes `javascript-obfuscator` during the post-build phase to protect the SDK source on public clients.
