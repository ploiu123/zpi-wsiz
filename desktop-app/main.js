const { app, BrowserWindow, shell, Menu, nativeTheme, session } = require('electron');
const path = require('path');

// ─── Konfiguracja ───────────────────────────────────────────────────────
const SITE_URL = 'https://zpi-wsiz.vercel.app';
const APP_NAME = 'Złote Miody';

let mainWindow = null;
let splashWindow = null;

// ─── Splash screen (ekran ładowania) ────────────────────────────────────
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

// ─── Główne okno ────────────────────────────────────────────────────────
function createMainWindow() {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    show: false,                       // pokaż dopiero po załadowaniu
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

  // Ładuj stronę ze zoptymalizowanym user-agent
  mainWindow.loadURL(SITE_URL, {
    userAgent: mainWindow.webContents.getUserAgent() + ` ZloteMiodyApp/1.0`,
  });

  // Gdy strona się załaduje — ukryj splash, pokaż okno
  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Obsługa błędu ładowania (brak internetu)
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`Błąd ładowania: ${code} — ${desc}`);
    mainWindow.loadFile(path.join(__dirname, 'splash.html'));
    mainWindow.show();
    // Spróbuj ponownie po 5 sekundach
    setTimeout(() => {
      mainWindow.loadURL(SITE_URL);
    }, 5000);
  });

  // Otwieraj linki zewnętrzne w przeglądarce systemowej
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(SITE_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Nawigacja — zostań w obrębie strony
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(SITE_URL) && !url.startsWith('about:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

// ─── Menu aplikacji ─────────────────────────────────────────────────────
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

// ─── Optymalizacja ──────────────────────────────────────────────────────
function setupOptimizations() {
  // Cache — nie czyść co sesję, utrzymuj dane logowania
  app.commandLine.appendSwitch('disable-http-cache', 'false');

  // Włącz GPU acceleration
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');

  // Obsługa ciemnego/jasnego motywu
  nativeTheme.themeSource = 'system';
}

// ─── Start aplikacji ────────────────────────────────────────────────────
setupOptimizations();

app.whenReady().then(() => {
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

// Wyczyść sesję przy zamykaniu (opcjonalnie)
app.on('before-quit', () => {
  // Zachowuj ciastka i dane logowania między sesjami
});
