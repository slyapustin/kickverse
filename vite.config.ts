import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

// Stamp the build so the running version can be read off the menu — the iPad
// home-screen app can hold a stale page and there is otherwise no way to tell.
function gitSha(): string {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'dev'; }
}
const buildDate = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig({
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify(gitSha()),
    __BUILD_TIME__: JSON.stringify(buildDate),
  },
});
