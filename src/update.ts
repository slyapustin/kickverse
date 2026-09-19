// Self-healing update check.
//
// An iOS home-screen web app keeps its cached index.html for a long time, so a
// deploy can go unnoticed indefinitely — there is no way to send it a header
// and no service worker here. Instead we fetch a tiny manifest with caching
// defeated, and if it names a different build than the one we are running, we
// reload through a URL that has never been cached.

const PARAM = 'v';

export async function checkForUpdate() {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const remote = (await res.json())?.build as string | undefined;
    if (!remote || remote === __BUILD_ID__) return;

    // Already reloaded for this build: the HTML really is the newest available,
    // so stop rather than loop.
    const url = new URL(window.location.href);
    if (url.searchParams.get(PARAM) === remote) return;

    url.searchParams.set(PARAM, remote);
    window.location.replace(url.toString());
  } catch {
    /* offline or blocked — keep playing the version we have */
  }
}
