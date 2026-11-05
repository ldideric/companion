// Updates from the fixed login-latest release of the public repo. The repo's own latest release is Companion's,
// so the GitHub provider would look in the wrong place; the generic provider reads latest.yml from a fixed URL.
// Only the Windows installer and the AppImage update themselves (lib.updatesItself): the portable exe can't, and
// rpm or deb would ask for an admin password out of nowhere. Those update by downloading again.

const { app } = require('electron')
const { updatesItself } = require('./lib')

const FEED = 'https://github.com/ldideric/companion/releases/download/login-latest'
const SETTLE_MS = 60 * 1000

let pending = null

function start(debug) {
  if (!app.isPackaged || !updatesItself()) return
  const { autoUpdater } = require('electron-updater')
  autoUpdater.setFeedURL({ provider: 'generic', url: FEED })
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = null
  autoUpdater.on('error', (e) => debug('update failed', e.message))
  autoUpdater.on('update-available', (info) => {
    debug('update available', info.version)
    pending = new Promise((resolve) => {
      autoUpdater.once('update-downloaded', resolve)
      autoUpdater.once('error', resolve)
    })
  })
  autoUpdater.checkForUpdates().catch((e) => debug('update check failed', e.message))
}

// Waits for a download in progress, at most SETTLE_MS. Nothing to wait for resolves at once.
function settle() {
  if (!pending) return Promise.resolve()
  return Promise.race([pending, new Promise((r) => setTimeout(r, SETTLE_MS))])
}

module.exports = { start, settle }
