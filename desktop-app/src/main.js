const { app, BrowserWindow, shell, Menu, nativeTheme, session, ipcMain, Notification } = require('electron');
const path = require('path');

const SITE_URL = 'https://zlote-miody.pl';
const APP_NAME = 'Złote Miody';

const ALLOWED_ORIGINS = new Set([
  SITE_URL,
  'https://www.zlote-miody.pl',
  'https://zpi-wsiz.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:']);

function parseUrl(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isSiteUrl(url) {
  const parsed = parseUrl(url);
  return parsed !== null && ALLOWED_ORIGINS.has(parsed.origin);
}

function isAuthUrl(url) {
  const parsed = parseUrl(url);
  if (!parsed || parsed.protocol !== 'https:') return false;
  const host = parsed.hostname;
  return (
    host.endsWith('.supabase.co') ||
    host === 'accounts.google.com' ||
    (host === 'github.com' && parsed.pathname.startsWith('/login'))
  );
}

function openExternal(url) {
  const parsed = parseUrl(url);
  if (parsed && EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
    shell.openExternal(parsed.href);
  }
}

let mainWindow = null;
let splashWindow = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createMainWindow() {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 20, y: 18 } : undefined,
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
    },
  });

  mainWindow.loadURL(SITE_URL, {
    userAgent: mainWindow.webContents.getUserAgent() + ` ZloteMiodyApp/1.0`,
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`Błąd ładowania: ${code} — ${desc}`);
    mainWindow.loadFile(path.join(__dirname, 'splash.html'));
    mainWindow.show();
    setTimeout(() => {
      mainWindow.loadURL(SITE_URL);
    }, 5000);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAuthUrl(url)) {
      const authWindow = new BrowserWindow({
        width: 600,
        height: 800,
        parent: mainWindow,
        modal: true,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      
      authWindow.loadURL(url);
      
      authWindow.once('ready-to-show', () => {
        authWindow.show();
      });

      authWindow.webContents.on('will-redirect', (e, redirectUrl) => {
        if (isSiteUrl(redirectUrl)) {
          mainWindow.loadURL(redirectUrl);
          authWindow.close();
        }
      });
      
      return { action: 'deny' };
    }

    if (!isSiteUrl(url)) {
      openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isSiteUrl(url) && !isAuthUrl(url)) {
      event.preventDefault();
      openExternal(url);
    }
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: APP_NAME,
            submenu: [
              { role: 'about', label: `O ${APP_NAME}` },
              { type: 'separator' },
              { role: 'hide', label: 'Ukryj' },
              { role: 'hideOthers', label: 'Ukryj inne' },
              { role: 'unhide', label: 'Pokaż wszystkie' },
              { type: 'separator' },
              { role: 'quit', label: 'Zamknij' },
            ],
          },
        ]
      : []),
    {
      label: 'Nawigacja',
      submenu: [
        {
          label: 'Strona główna',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow?.loadURL(SITE_URL),
        },
        {
          label: 'Produkty',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.loadURL(`${SITE_URL}/products`),
        },
        {
          label: 'Koszyk',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.loadURL(`${SITE_URL}/cart`),
        },
        {
          label: 'Moje konto',
          accelerator: 'CmdOrCtrl+M',
          click: () => mainWindow?.loadURL(`${SITE_URL}/dashboard`),
        },
        { type: 'separator' },
        {
          label: 'Panel Administratora',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => mainWindow?.loadURL(`${SITE_URL}/admin`),
        },
      ],
    },
    {
      label: 'Widok',
      submenu: [
        { role: 'reload', label: 'Odśwież', accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload', label: 'Wymuś odświeżenie', accelerator: 'CmdOrCtrl+Shift+R' },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Powiększ', accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut', label: 'Pomniejsz', accelerator: 'CmdOrCtrl+-' },
        { role: 'resetZoom', label: 'Resetuj zoom', accelerator: 'CmdOrCtrl+0' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pełny ekran' },
      ],
    },
    {
      label: 'Edycja',
      submenu: [
        { role: 'undo', label: 'Cofnij' },
        { role: 'redo', label: 'Ponów' },
        { type: 'separator' },
        { role: 'cut', label: 'Wytnij' },
        { role: 'copy', label: 'Kopiuj' },
        { role: 'paste', label: 'Wklej' },
        { role: 'selectAll', label: 'Zaznacz wszystko' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function setupOptimizations() {
  app.commandLine.appendSwitch('disable-http-cache', 'false');

  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');

  nativeTheme.themeSource = 'system';
}

setupOptimizations();

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'notifications' && isSiteUrl(webContents.getURL()));
  });

  buildMenu();
  createSplashWindow();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashWindow();
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
});

ipcMain.on('show-notification', (event, payload) => {
  if (!isSiteUrl(event.senderFrame?.url ?? '')) return;
  const title = typeof payload?.title === 'string' ? payload.title.slice(0, 120) : '';
  const body = typeof payload?.body === 'string' ? payload.body.slice(0, 500) : '';
  if (title && Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, 'icon.png') }).show();
  }
});
