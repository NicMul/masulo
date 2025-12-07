import { watch } from 'chokidar';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distFile = join(__dirname, 'dist', 'mesulo-ai-sdk.js');
const targetFile = join(__dirname, 'dist', 'mesulo-ai-sdk.js');

function notifyFileReady() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ✓ Build file ready: dist/mesulo-ai-sdk.js`);
}

console.log('📦 Watching for changes in dist/mesulo-ai-sdk.js...');
console.log('📋 File ready: dist/mesulo-ai-sdk.js\n');

// Watch the dist file
const watcher = watch(distFile, {
  persistent: true,
  ignoreInitial: false
});

watcher.on('change', () => {
  notifyFileReady();
});

watcher.on('add', () => {
  notifyFileReady();
});

// Initial notification
notifyFileReady();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Stopping file watcher...');
  watcher.close();
  process.exit(0);
});

