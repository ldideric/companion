const test = require('node:test')
const assert = require('node:assert')
const { parseArgs, cookieHeader, reachedPortflow, needsStudent } = require('./lib')

test('parseArgs defaults to port 8000, started by the student', () => {
  assert.deepStrictEqual(parseArgs(['/usr/bin/electron', '.']), { port: 8000, fromLink: false })
})

test('parseArgs reads the port from a link and remembers the link started it', () => {
  assert.deepStrictEqual(parseArgs(['app', 'portflow-companion://login?port=8080']), { port: 8080, fromLink: true })
})

test('parseArgs reads --port and ignores ports that make no sense', () => {
  assert.strictEqual(parseArgs(['app', '--port=8081']).port, 8081)
  assert.strictEqual(parseArgs(['app', '--port=99999']).port, 8000)
  assert.strictEqual(parseArgs(['app', 'portflow-companion://login?port=evil.example']).port, 8000)
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
