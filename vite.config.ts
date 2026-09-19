import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

// Stamp the build so the running version can be read off the menu — the iPad
// home-screen app can hold a stale page and there is otherwise no way to tell.
function gitSha(): string {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'dev'; }
}
const buildDate = new Date().toISOString().slice(0, 16).replace('T', ' ');

// Emit a tiny, always-fresh manifest the app can poll to detect that the HTML
// it is running from is stale. GitHub Pages serves index.html with max-age=600
// and an installed iOS web app can hold it far longer than that.
function versionManifest(sha: string, time: string) {
  return {
    name: 'kickverse-version-manifest',
    generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void }) {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: sha, time }) });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [versionManifest(gitSha(), buildDate)],
  define: {
    __BUILD_ID__: JSON.stringify(gitSha()),
    __BUILD_TIME__: JSON.stringify(buildDate),
  },
});
