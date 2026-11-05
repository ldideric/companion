# Companion Login

A small desktop app that logs in to Canvas in its own window and hands the session to Portflow Companion on this computer, so nobody has to copy cookies from the developer tools.

1. It opens the Canvas launch of Portflow in a window that keeps its own login between runs.
2. If Canvas still knows you, the launch reaches Portflow and the window never shows. Otherwise it shows the login (SURFconext, then Microsoft) and you log in as usual.
3. Once Portflow is reached, it posts the Canvas cookies to `http://127.0.0.1:<port>/api/session`, starts a fetch and closes.

The session only goes to Companion on this computer. Started from a `portflow-companion://login?port=8000` link, it asks first, since any web page can open such a link.

## Run

```sh
npm install
npm start                      # Companion on port 8000
npm start -- --port=8080       # another port
npm test                       # the parts that don't need Electron
```

`COMPANION_LOGIN_DEBUG=1` prints each page the window visits (origin and path only). Electron runs as plain Node when `ELECTRON_RUN_AS_NODE` is set, which VS Code's extension host does; unset it there.

The window's login lives in the app's user data dir (`~/.config/Companion Login` on Linux, `%APPDATA%\Companion Login` on Windows, named after `productName`). Delete it to log out.

## Releases

Bump `version` in `package.json`, commit, and push a tag `login-v<version>`. The workflow in `.github/workflows/login.yml` builds the Windows installer and portable exe and the Linux rpm, deb and AppImage, attaches them to the release of that tag, and copies them to the fixed `login-latest` release. File names carry no version, so links to `login-latest` keep working.

The Windows installer and the AppImage update themselves from `login-latest` (`updater.js`): a new version downloads in the background and installs when the helper quits. The portable exe, rpm and deb update by downloading again.

## Building locally

Same as CI, in electron-builder's Wine image (after `npm install`):

```sh
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp/home -v "$PWD":/project -w /project \
  electronuserland/builder:wine sh -c 'npx electron-builder --publish never --linux rpm deb AppImage --x64 && npx electron-builder --publish never --win nsis portable --x64'
```

- `Companion-Login-Setup.exe`: installs for the current user only (no admin), adds a Start menu entry and registers `portflow-companion://` links.
- `Companion-Login-portable.exe`: runs without installing. It registers the link itself on every start, pointing at the file you started.
- `companion-login.x86_64.rpm`, `companion-login_amd64.deb`: the package's desktop entry registers the link. On Fedora, `npm run dist:linux` outside Docker needs `libxcrypt-compat`.
- `Companion-Login-x86_64.AppImage`: runs without installing.

## Installing on Windows

1. Run `Companion-Login-Setup.exe`. The app isn't signed, so Windows SmartScreen says "Windows protected your PC". Click "More info", then "Run anyway". This happens once per downloaded file.
2. The installer finishes on its own and starts Companion Login. With Companion running on port 8000, it opens the Canvas login, or closes by itself when Canvas still knows you.
3. Later, start it from the Start menu, or from a `portflow-companion://login?port=8000` link (it asks before it logs in).

Uninstall it from Settings, Apps. That leaves the login in `%APPDATA%\Companion Login`; delete that folder too to log out.
