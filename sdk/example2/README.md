# Mesulo Game Components SDK

A modern **SDK** built with **Lit** and **Haunted** that automatically upgrades existing HTML elements into interactive web components. This SDK is designed to be injected into any website via a simple script tag.

## Features

- 🎮 Automatic detection and upgrade of game card elements
- 🔥 Built with Lit and Haunted for modern reactive UI
- ⚡ Fast development with Vite
- 📦 Single bundle output for CDN deployment
- 🎨 Shadow DOM styling with encapsulation
- 🔍 MutationObserver for dynamic content support
- 🔌 Zero configuration - just add a script tag
- 🚀 Hot module replacement for development

## Installation

### Prerequisites

- Node.js 16+ and npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (creates single minified bundle)
npm run build

# Preview production build
npm run preview
```

## Development Workflow

### Development Server

Run the development server with hot module replacement:

```bash
npm run dev
```

The server will start at `http://localhost:3000` and automatically open the demo page.

### Building for Production

Create an optimized, minified bundle for CDN deployment:

```bash
npm run build
```

Output files will be in the `dist/` directory:
- `dist/game-components.js` - Single bundled JavaScript file (ES module)
- `dist/game-components.umd.cjs` - UMD bundle for legacy support

## Usage

### SDK Injection (Recommended)

The SDK automatically detects and upgrades existing HTML elements. No changes to your HTML structure required!

**Step 1:** Add the SDK script tag to your HTML:

```html
<!-- Add this script tag anywhere in your HTML -->
<script type="module" src="https://your-cdn.com/game-components.js"></script>
```

**Step 2:** Use standard HTML with `data-masulo-*` attributes:

```html
<div data-masulo-game-id="your-game-id" data-masulo-tag="true" class="game-card">
    <img src="./images/game.jpg" alt="Game Name" class="game-image">
    <button class="button">See More</button>
</div>
<div class="game-name">Game Name</div>
```

The SDK will automatically:
- Detect all elements with `data-masulo-game-id`
- Extract game information (ID, image, name, theme, version)
- Replace them with interactive `<game-card>` web components
- Watch for dynamically added content

### Required HTML Structure

Your existing HTML should follow this pattern:

```html
<div data-masulo-game-id="GAME_ID" 
     data-masulo-tag="true" 
     data-masulo-theme="optional-theme"
     data-masulo-version="1.0.0"
     class="game-card">
    <img src="./path/to/image.jpg" alt="Game Name" class="game-image">
    <button class="button">See More</button>
</div>
<div class="game-name">Game Name</div>
```

### Data Attributes

- `data-masulo-game-id` (required): Unique identifier for the game
- `data-masulo-tag` (required): Set to "true" to enable SDK detection
- `data-masulo-theme` (optional): Theme variant (e.g., "halloween")
- `data-masulo-version` (optional): Game version string

### CDN Deployment

After building, upload the `dist/game-components.js` file to your CDN:

```html
<!-- Production usage -->
<script type="module" src="https://your-cdn.com/game-components.js"></script>

<!-- Your existing HTML remains unchanged -->
<div data-masulo-game-id="example-id" data-masulo-tag="true" class="game-card">
    <img src="./images/game.jpg" alt="Example Game" class="game-image">
    <button class="button">See More</button>
</div>
```

### Development Usage

For local development, reference the source directly:

```html
<script type="module" src="./src/index.js"></script>
```

## Project Structure

```
.
├── src/
│   ├── index.js              # SDK entry point with auto-upgrade logic
│   └── components/
│       └── game-card.js      # Game card web component
├── images/                   # Game images
├── dist/                     # Build output (generated)
├── index.html                # Demo page
├── package.json
├── vite.config.js
└── README.md
```

## Technologies

- **[Lit](https://lit.dev/)** - A simple library for building fast, lightweight web components
- **[Haunted](https://hauntedhooks.netlify.app/)** - React's Hooks API implemented with web standards
- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling

## Build Configuration

The build is configured to output a single minified bundle optimized for CDN deployment:

- All code is bundled into one file
- Dependencies are included (no externals)
- Minification and tree-shaking enabled
- Console logs removed in production
- Modern ES2015+ output

## Components

### GameCard

A reusable web component that displays a game card with hover effects and a "See More" button.

**Features:**
- Shadow DOM isolation
- Hover animations
- Custom event dispatching on button click
- Support for Mesulo SDK attributes
- Lazy-loaded images

**Events:**
- `game-card-click`: Dispatched when the "See More" button is clicked
  - Event detail: `{ gameId, name, theme, version }`

## How It Works

1. **Script Loads**: The SDK script is loaded via `<script type="module">`
2. **DOM Scan**: On load, the SDK scans for all `[data-masulo-game-id]` elements
3. **Element Upgrade**: Each matching element is replaced with a `<game-card>` web component
4. **Dynamic Watching**: A MutationObserver watches for new elements added to the DOM
5. **Auto-Upgrade**: Any new matching elements are automatically upgraded

## API

### Exported Functions

```javascript
import { upgradeElement, upgradeAllElements, init } from './dist/game-components.js';

// Manually upgrade a specific element
upgradeElement(document.querySelector('[data-masulo-game-id]'));

// Manually scan and upgrade all elements
upgradeAllElements();

// Manually initialize the SDK (called automatically on load)
init();
```

## Browser Support

- Modern browsers with ES2015+ support
- Custom Elements v1
- Shadow DOM v1
- ES Modules

## License

MIT

## Contributing

This is a demonstration project showcasing modern web component development with Lit and Haunted as an injectable SDK.