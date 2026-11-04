// Companion Login: logs in to Canvas in its own window and hands the session to Companion on this computer.
// The window keeps its own login between runs, so when Canvas and Microsoft still know the student it never shows.

const { app, BrowserWindow, Notification, dialog, session } = require('electron')
const lib = require('./lib')

const GIVE_UP_MS = 20 * 60 * 1000
const SHOW_AFTER_MS = 8000 // show the window anyway when nothing happens for this long
const LOGIN_PAGE_MS = 2000 // a login page that redirects on its own (SSO) is gone within this

const STRINGS = {
  nl: {
    confirm: 'Inloggen bij Canvas voor Companion?',
    confirmDetail: 'Je Canvas-sessie gaat naar Companion op deze computer (poort {port}) en nergens anders heen.',
    login: 'Inloggen',
    cancel: 'Annuleren',
    title: 'Inloggen bij Canvas voor Companion',
    done: 'Ingelogd als {name}. Companion haalt je portfolio op.',
    offline: 'Companion is niet bereikbaar op poort {port}. Draait de app?',
    refused: 'Companion accepteerde de sessie niet: {detail}',
    timeout: 'Het inloggen duurde te lang. Probeer het opnieuw.',
  },
  en: {
    confirm: 'Log in to Canvas for Companion?',
    confirmDetail: 'Your Canvas session goes to Companion on this computer (port {port}) and nowhere else.',
    login: 'Log in',
    cancel: 'Cancel',
    title: 'Log in to Canvas for Companion',
    done: 'Logged in as {name}. Companion is fetching your portfolio.',
    offline: 'Companion is not reachable on port {port}. Is the app running?',
    refused: 'Companion did not accept the session: {detail}',
    timeout: 'Logging in took too long. Try again.',
  },
}
let s = STRINGS.en
const t = (key, vars = {}) => s[key].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

let win = null
const debug = process.env.COMPANION_LOGIN_DEBUG ? (...a) => console.log('[login]', ...a) : () => {}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      win.show()
      win.focus()
    }
  })
  app.on('window-all-closed', () => app.quit())
  app.whenReady().then(run)
}

async function run() {
  s = app.getLocale().startsWith('nl') ? STRINGS.nl : STRINGS.en
  const { port, fromLink } = lib.parseArgs(process.argv)

  // Any web page can open a portflow-companion:// link, so a link never logs in without the student saying so.
  if (fromLink) {
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: [t('login'), t('cancel')],
      defaultId: 0,
      cancelId: 1,
      message: t('confirm'),
      detail: t('confirmDetail', { port }),
    })
    if (response !== 0) return app.quit()
  }

  const ses = session.fromPartition('persist:canvas')
  win = new BrowserWindow({
    show: false,
    width: 560,
    height: 760,
    title: t('title'),
    webPreferences: { session: ses, sandbox: true, contextIsolation: true, nodeIntegration: false },
  })
  win.removeMenu()
  win.on('page-title-updated', (e) => e.preventDefault())

  const show = () => {
    if (!win || win.isDestroyed() || win.isVisible()) return
    debug('showing the window')
    win.show()
  }
  const showTimer = setTimeout(show, SHOW_AFTER_MS)
  const giveUp = setTimeout(() => fail(t('timeout')), GIVE_UP_MS)
  let loginTimer = null
  let handing = false

  // Top-level pages: a login page that stays put needs the student; one that redirects on its own does not.
  win.webContents.on('did-navigate', (_e, url) => {
    debug('page', new URL(url).origin + new URL(url).pathname) // never the query: it can carry tokens
    clearTimeout(loginTimer)
    if (lib.needsStudent(url)) loginTimer = setTimeout(show, LOGIN_PAGE_MS)
  })

  // Canvas runs the launch in a frame, so watch the session's requests rather than the window's address.
  ses.webRequest.onCompleted({ urls: ['https://portfolio.drieam.app/*'] }, (details) => {
    if (handing || details.statusCode >= 400 || !lib.reachedPortflow(details.url)) return
    if (details.resourceType !== 'mainFrame' && details.resourceType !== 'subFrame') return
    handing = true
    debug('reached Portflow, handing over to port', port)
    clearTimeout(showTimer)
    clearTimeout(loginTimer)
    clearTimeout(giveUp)
    handOver(ses, port, fromLink).catch((e) => fail(e.message))
  })

  win.loadURL(lib.LAUNCH_URL)
}

async function handOver(ses, port, fromLink) {
  const cookies = await ses.cookies.get({ url: `${lib.CANVAS}/` })
  // Keep the Canvas session for the next run, so it can skip the SURFconext and Microsoft pages.
  const now = Math.floor(Date.now() / 1000)
  for (const details of lib.keepDetails(cookies, now)) await ses.cookies.set(details).catch((e) => debug('could not keep', details.name, e.message))
  await ses.cookies.flushStore()
  // The main process posts without an Origin header, which Companion's guard allows for local tools.
  const base = `http://127.0.0.1:${port}`
  let res
  try {
    res = await fetch(`${base}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Companion-Login': app.getVersion() }, // so Companion offers the helper next time
      body: JSON.stringify({ cookies: lib.cookieHeader(cookies) }),
    })
  } catch {
    return fail(t('offline', { port }))
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return fail(t('refused', { detail: body.detail ?? res.status }))

  // From a link, Companion's page is waiting and starts the fetch itself; started by hand, the helper does it.
  if (!fromLink) await fetch(`${base}/api/fetch`, { method: 'POST' }).catch(() => {}) // already running is fine
  if (win && !win.isDestroyed()) win.hide()
  if (Notification.isSupported()) new Notification({ title: 'Companion', body: t('done', { name: body.user?.name ?? '' }) }).show()
  setTimeout(() => app.quit(), 1500)
}

async function fail(message) {
  if (win && !win.isDestroyed()) win.hide()
  await dialog.showMessageBox({ type: 'error', message })
  app.quit()
}
