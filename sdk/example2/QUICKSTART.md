# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

This will open `http://localhost:3000` with the demo page. The SDK will automatically detect and upgrade all game card elements.

### 3. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory:
- `dist/game-components.js` - ES module (recommended)
- `dist/game-components.umd.cjs` - UMD bundle (legacy support)

## 📝 Usage Example

### Development (index.html)

```html
<!-- Your existing HTML structure -->
<div data-masulo-game-id="your-game-id" data-masulo-tag="true" class="game-card">
    <img src="./images/game.jpg" alt="Game Name" class="game-image">
    <button class="button">See More</button>
</div>
<div class="game-name">Game Name</div>

<!-- Add the SDK script -->
<script type="module" src="./src/index.js"></script>
```

### Production (index.production.html)

```html
<!-- Your existing HTML structure (same as above) -->
<div data-masulo-game-id="your-game-id" data-masulo-tag="true" class="game-card">
    <img src="./images/game.jpg" alt="Game Name" class="game-image">
    <button class="button">See More</button>
</div>
<div class="game-name">Game Name</div>

<!-- Add the built SDK from CDN -->
<script type="module" src="https://your-cdn.com/game-components.js"></script>
```

## 🎯 What Happens?

1. SDK loads and scans the DOM
2. Finds all elements with `data-masulo-game-id`
3. Extracts game info (ID, image, name, theme, version)
4. Replaces them with `<game-card>` web components
5. Watches for dynamically added content

## 🔍 Console Output

When the SDK runs, you'll see:

```
[Mesulo SDK] Initializing...
[Mesulo SDK] Found 5 elements to upgrade
[Mesulo SDK] Upgraded game card: Cleocatra (d5352f25-9718-44a6-a95d-1ddd47ea63ce)
[Mesulo SDK] Upgraded game card: Hot as Hades (b4a40dc5-e950-4e6b-bca9-1ae51589b2b5)
...
[Mesulo SDK] MutationObserver initialized
[Mesulo SDK] Ready
```

## 📦 Files

- `index.html` - Development demo (uses `./src/index.js`)
- `index.production.html` - Production example (uses `./dist/game-components.js`)
- `src/index.js` - SDK entry point with auto-upgrade logic
- `src/components/game-card.js` - Web component definition

## 🛠️ Commands

```bash
npm run dev      # Development server with HMR
npm run build    # Production build
npm run preview  # Preview production build
```

## 📚 More Info

See [README.md](./README.md) for complete documentation.
