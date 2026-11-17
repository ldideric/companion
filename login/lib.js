// The parts of the helper that don't need Electron, so they can be tested with node --test.

const CANVAS = 'https://canvas.hu.nl'
const LAUNCH_URL = `${CANVAS}/accounts/1/external_tools/1134` // same as LAUNCH_URL in portflow/client.py
const PORTFLOW_HOST = 'portfolio.drieam.app'
const SCHEME = 'portflow-companion'
const DEFAULT_PORT = 8000
// Started by hand, the helper doesn't know the port. The guide moves Companion to 8080 when 8000 is taken.
const DEFAULT_PORTS = [DEFAULT_PORT, 8080]

/** What to do from the command line: the ports to try, and whether a link (not the student) started us. */
function parseArgs(argv) {
  let port = null
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
  return { ports: port ? [port] : DEFAULT_PORTS, fromLink }
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

/**
 * Whether /api/version answered the way Companion does. A link can name any port, so the helper checks this before
 * the Canvas session goes there: another program on that port must never receive it.
 */
function isCompanion(body) {
  return !!body && typeof body === 'object' && typeof body.current === 'string' && 'check' in body && 'feedback' in body
}

/**
 * The first port where Companion answers. probe(port) says 'companion', 'other' (something else listens there) or
 * 'offline'. Without a match, the error names what was found, so the student knows whether Companion is running.
 */
async function findCompanion(ports, probe) {
  const results = []
  for (const port of ports) {
    const result = await probe(port)
    if (result === 'companion') return { port }
    results.push([port, result])
  }
  const other = results.find(([, r]) => r === 'other')
  return other ? { error: 'notCompanion', ports: [other[0]] } : { error: 'offline', ports }
}

// Only the Windows installer and the AppImage update themselves (see updater.js).
function updatesItself(env = process.env, platform = process.platform) {
  if (platform === 'win32') return !env.PORTABLE_EXECUTABLE_FILE
  if (platform === 'linux') return Boolean(env.APPIMAGE)
  return false
}

module.exports = { CANVAS, LAUNCH_URL, SCHEME, DEFAULT_PORT, DEFAULT_PORTS, parseArgs, findCompanion, cookieHeader, keepDetails, reachedPortflow, needsStudent, protocolTarget, isCompanion, updatesItself }
