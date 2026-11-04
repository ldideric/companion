// The parts of the helper that don't need Electron, so they can be tested with node --test.

const CANVAS = 'https://canvas.hu.nl'
const LAUNCH_URL = `${CANVAS}/accounts/1/external_tools/1134` // same as LAUNCH_URL in portflow/client.py
const PORTFLOW_HOST = 'portfolio.drieam.app'
const SCHEME = 'portflow-companion'
const DEFAULT_PORT = 8000

/** What to do from the command line: the port, and whether a link (not the student) started us. */
function parseArgs(argv) {
  let port = DEFAULT_PORT
  let fromLink = false
  for (const arg of argv) {
    if (arg.startsWith(`${SCHEME}:`)) {
      fromLink = true
      let url
      try {
        url = new URL(arg)
      } catch {
        continue
      }
      const p = validPort(url.searchParams.get('port'))
      if (p) port = p
    } else if (arg.startsWith('--port=')) {
      const p = validPort(arg.slice('--port='.length))
      if (p) port = p
    }
  }
  return { port, fromLink }
}

function validPort(value) {
  if (!value || !/^\d{1,5}$/.test(value)) return null
  const n = Number(value)
  return n >= 1 && n <= 65535 ? n : null
}

/** Cookies as Electron returns them, as one Cookie header. */
function cookieHeader(cookies) {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
}

const KEEP_DAYS = 30 // an upper bound only: Canvas decides how long a session really lives

/**
 * Canvas sets its cookies without an expiry date, so Electron drops them when the helper quits and the next run
 * starts at the SURFconext login again. These are the same cookies with an expiry date, as cookies.set details.
 */
function keepDetails(cookies, nowSeconds) {
  return cookies
    .filter((c) => c.session)
    .map((c) => ({
      url: `${CANVAS}${c.path || '/'}`,
      name: c.name,
      value: c.value,
      ...(c.hostOnly ? {} : { domain: c.domain }),
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      expirationDate: nowSeconds + KEEP_DAYS * 24 * 3600,
    }))
}

/** The launch is done once any frame reaches Portflow: Canvas only sends you there when you are logged in. */
function reachedPortflow(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === PORTFLOW_HOST
  } catch {
    return false
  }
}

/** Pages where the student has to do something (a login form), so the window has to show. */
function needsStudent(url) {
  try {
    const u = new URL(url)
    if (u.hostname === PORTFLOW_HOST) return false
    if (u.hostname === 'canvas.hu.nl') return u.pathname.startsWith('/login')
    return true // Microsoft or another identity page
  } catch {
    return false
  }
}

/** What a portflow-companion:// link should start: the portable exe's real file, the installed exe, or electron with this folder. */
function protocolTarget({ env, execPath, defaultApp, argv }) {
  if (env.PORTABLE_EXECUTABLE_FILE) return [env.PORTABLE_EXECUTABLE_FILE, []]
  if (defaultApp) return [execPath, [require('node:path').resolve(argv[1])]]
  return [execPath, []]
}

module.exports = { CANVAS, LAUNCH_URL, SCHEME, DEFAULT_PORT, parseArgs, cookieHeader, keepDetails, reachedPortflow, needsStudent, protocolTarget }
