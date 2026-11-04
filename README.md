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

The window's login lives in the app's user data dir (`~/.config/Companion Login` on Linux, named after `productName`). Delete it to log out.
