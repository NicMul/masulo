# Changelog

## [1.0.0] - 2025-10-26

### Initial Release

#### Features
- **SDK Auto-Injection**: Automatically detects and upgrades HTML elements with `data-masulo-game-id` attribute
- **Web Components**: Built with Lit for fast, lightweight components
- **Reactive Hooks**: Uses Haunted for React-like hooks API
- **Dynamic Content Support**: MutationObserver watches for dynamically added elements
- **Single Bundle Output**: Optimized for CDN deployment
- **Shadow DOM**: Encapsulated styling prevents CSS conflicts
- **Event System**: Custom `game-card-click` events for integration

#### Components
- `<game-card>`: Interactive game card with hover effects and click handling

#### Build System
- Vite for fast development and optimized production builds
- ES module and UMD bundle formats
- Minification with Terser
- Tree-shaking for optimal bundle size

#### Documentation
- Complete README with usage examples
- Quick Start guide
- Production example HTML

#### Developer Experience
- Hot Module Replacement (HMR)
- Development server on port 3000
- Console logging for SDK feedback
- TypeScript-ready structure
