import { watch } from 'chokidar';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distFile = join(__dirname, 'dist', 'mesulo-preact-sdk.js');
const targetFile = join(__dirname, '..', 'sdk', 'dist', 'mesulo-preact-sdk.js');

function copyFile() {
  exec(`cp "${distFile}" "${targetFile}"`, (error) => {
    if (error) {
      console.error('Error copying file:', error);
    } else {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ✓ Copied to SDK dist`);
    }
  });
}

console.log('📦 Watching for changes in dist/mesulo-preact-sdk.js...');
console.log('📋 Copying to ../sdk/dist/mesulo-preact-sdk.js on changes\n');

// Watch the dist file
const watcher = watch(distFile, {
  persistent: true,
  ignoreInitial: false
});

watcher.on('change', () => {
  copyFile();
});

watcher.on('add', () => {
  copyFile();
});

// Initial copy
copyFile();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Stopping file watcher...');
  watcher.close();
  process.exit(0);
});

