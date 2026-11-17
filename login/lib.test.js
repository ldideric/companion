const test = require('node:test')
const assert = require('node:assert')
const { parseArgs, findCompanion, cookieHeader, keepDetails, reachedPortflow, needsStudent, protocolTarget, isCompanion, updatesItself } = require('./lib')

test('isCompanion only accepts the answer Companion gives on /api/version', () => {
  assert.strictEqual(isCompanion({ current: '0.7.0', latest: null, check: true, reachable: true, update: false, feedback: true, demo: null }), true)
  assert.strictEqual(isCompanion({ ok: true }), false)
  assert.strictEqual(isCompanion(null), false)
  assert.strictEqual(isCompanion('<html>'), false)
})

test('parseArgs tries 8000 and then 8080 when started by the student', () => {
  assert.deepStrictEqual(parseArgs(['/usr/bin/electron', '.']), { ports: [8000, 8080], fromLink: false })
})

test('parseArgs reads the port from a link and remembers the link started it', () => {
  assert.deepStrictEqual(parseArgs(['app', 'portflow-companion://login?port=8080']), { ports: [8080], fromLink: true })
})

test('parseArgs reads --port and ignores ports that make no sense', () => {
  assert.deepStrictEqual(parseArgs(['app', '--port=8081']).ports, [8081])
  assert.deepStrictEqual(parseArgs(['app', '--port=99999']).ports, [8000, 8080])
  assert.deepStrictEqual(parseArgs(['app', 'portflow-companion://login?port=evil.example']).ports, [8000, 8080])
})

test('cookieHeader joins cookies the way the backend reads them', () => {
  assert.strictEqual(cookieHeader([{ name: 'canvas_session', value: 'a' }, { name: '_csrf_token', value: 'b%3D' }]), 'canvas_session=a; _csrf_token=b%3D')
})

test('reachedPortflow only counts Portflow over https', () => {
  assert.ok(reachedPortflow('https://portfolio.drieam.app/lti/launch'))
  assert.ok(!reachedPortflow('http://portfolio.drieam.app/'))
  assert.ok(!reachedPortflow('https://portfolio.drieam.app.evil.example/'))
  assert.ok(!reachedPortflow('https://canvas.hu.nl/accounts/1/external_tools/1134'))
})

test('needsStudent shows the window for login pages only', () => {
  assert.ok(needsStudent('https://canvas.hu.nl/login/saml'))
  assert.ok(needsStudent('https://login.microsoftonline.com/common/oauth2'))
  assert.ok(!needsStudent('https://canvas.hu.nl/accounts/1/external_tools/1134'))
  assert.ok(!needsStudent('https://portfolio.drieam.app/'))
})

test('keepDetails gives session cookies an expiry date and leaves the rest alone', () => {
  const cookies = [
    { name: 'canvas_session', value: 'a', domain: 'canvas.hu.nl', hostOnly: true, path: '/', secure: true, httpOnly: true, sameSite: 'no_restriction', session: true },
    { name: 'log_session_id', value: 'b', domain: '.canvas.hu.nl', hostOnly: false, path: '/', secure: true, httpOnly: false, sameSite: 'unspecified', session: true },
    { name: 'already_kept', value: 'c', domain: 'canvas.hu.nl', hostOnly: true, path: '/', session: false, expirationDate: 1 },
  ]
  const kept = keepDetails(cookies, 1000)
  assert.strictEqual(kept.length, 2)
  assert.deepStrictEqual(kept[0], {
    url: 'https://canvas.hu.nl/', name: 'canvas_session', value: 'a', path: '/', secure: true, httpOnly: true,
    sameSite: 'no_restriction', expirationDate: 1000 + 30 * 24 * 3600,
  })
  assert.strictEqual(kept[1].domain, '.canvas.hu.nl') // a domain cookie stays a domain cookie
})

test('parseArgs reads a link the way Windows passes it', () => {
  const argv = ['C:\\Users\\s\\AppData\\Local\\Programs\\Companion Login\\Companion Login.exe', '--allow-file-access-from-files', 'portflow-companion://login/?port=8080']
  assert.deepStrictEqual(parseArgs(argv), { ports: [8080], fromLink: true })
})

test('protocolTarget registers the portable exe, the installed exe, or electron with this folder', () => {
  const portable = { env: { PORTABLE_EXECUTABLE_FILE: 'D:\\Companion-Login.exe' }, execPath: 'C:\\Temp\\x.exe', defaultApp: false, argv: [] }
  assert.deepStrictEqual(protocolTarget(portable), ['D:\\Companion-Login.exe', []])
  const installed = { env: {}, execPath: 'C:\\App\\Companion Login.exe', defaultApp: false, argv: ['C:\\App\\Companion Login.exe'] }
  assert.deepStrictEqual(protocolTarget(installed), ['C:\\App\\Companion Login.exe', []])
  const [exe, args] = protocolTarget({ env: {}, execPath: '/usr/bin/electron', defaultApp: true, argv: ['/usr/bin/electron', '.'] })
  assert.strictEqual(exe, '/usr/bin/electron')
  assert.strictEqual(args.length, 1)
})

test('updatesItself: the Windows installer and the AppImage, not the portable exe, rpm, deb or macOS', () => {
  assert.ok(updatesItself({}, 'win32'))
  assert.ok(!updatesItself({ PORTABLE_EXECUTABLE_FILE: 'D:\\Companion-Login.exe' }, 'win32'))
  assert.ok(updatesItself({ APPIMAGE: '/home/s/Companion-Login.AppImage' }, 'linux'))
  assert.ok(!updatesItself({}, 'linux'))
  assert.ok(!updatesItself({}, 'darwin'))
})

test('findCompanion takes the first port where Companion answers', async () => {
  const on = (map) => async (port) => map[port] ?? 'offline'
  assert.deepStrictEqual(await findCompanion([8000, 8080], on({ 8080: 'companion' })), { port: 8080 })
  assert.deepStrictEqual(await findCompanion([8000, 8080], on({ 8000: 'companion', 8080: 'companion' })), { port: 8000 })
})

test('findCompanion never picks another program, and says what it found', async () => {
  const on = (map) => async (port) => map[port] ?? 'offline'
  assert.deepStrictEqual(await findCompanion([8000, 8080], on({ 8000: 'other' })), { error: 'notCompanion', ports: [8000] })
  assert.deepStrictEqual(await findCompanion([8000, 8080], on({})), { error: 'offline', ports: [8000, 8080] })
})
