const { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let win;
let tray;
let refreshInterval;
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch {}
  return {
    repos: [],
    refreshSeconds: 5,
    alwaysOnTop: true,
    x: null,
    y: null,
    opacity: 0.95
  };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

let config = loadConfig();

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 340,
    height: 480,
    x: config.x ?? width - 360,
    y: config.y ?? 40,
    frame: false,
    resizable: true,
    alwaysOnTop: config.alwaysOnTop,
    skipTaskbar: false,
    transparent: false,
    opacity: config.opacity,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');

  win.on('moved', () => {
    const [x, y] = win.getPosition();
    config.x = x;
    config.y = y;
    saveConfig(config);
  });

  win.on('resize', () => {
    const [w, h] = win.getSize();
    config.width = w;
    config.height = h;
    saveConfig(config);
  });

  startRefresh();
}

function createTray() {
  // Minimal inline tray icon (16x16 PNG as base64)
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Panel', click: () => win.show() },
    { label: 'Hide Panel', click: () => win.hide() },
    { type: 'separator' },
    { label: 'Always on Top', type: 'checkbox', checked: config.alwaysOnTop, click: (item) => {
      config.alwaysOnTop = item.checked;
      win.setAlwaysOnTop(item.checked);
      saveConfig(config);
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Git Worktree Panel');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => win.isVisible() ? win.hide() : win.show());
}

function getWorktrees(repoPath) {
  return new Promise((resolve) => {
    exec(`git worktree list --porcelain`, { cwd: repoPath }, (err, stdout) => {
      if (err) {
        resolve({ error: err.message.split('\n')[0], worktrees: [] });
        return;
      }

      const worktrees = [];
      const blocks = stdout.trim().split('\n\n');
      
      for (const block of blocks) {
        if (!block.trim()) continue;
        const lines = block.trim().split('\n');
        const entry = {};
        
        for (const line of lines) {
          if (line.startsWith('worktree ')) entry.path = line.slice(9);
          else if (line.startsWith('branch ')) entry.branch = line.slice(7).replace('refs/heads/', '');
          else if (line === 'bare') entry.bare = true;
          else if (line.startsWith('HEAD ')) entry.head = line.slice(5, 12);
          else if (line === 'prunable') entry.prunable = true;
          else if (line === 'locked') entry.locked = true;
          else if (line.startsWith('detached')) entry.branch = `detached:${entry.head}`;
        }
        
        if (entry.path) worktrees.push(entry);
      }
      
      resolve({ worktrees, error: null });
    });
  });
}

async function fetchAllWorktrees() {
  const results = [];
  for (const repo of config.repos) {
    const data = await getWorktrees(repo.path);
    results.push({
      ...repo,
      ...data,
      lastUpdated: Date.now()
    });
  }
  return results;
}

function startRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  
  const doRefresh = async () => {
    if (win && !win.isDestroyed()) {
      const data = await fetchAllWorktrees();
      win.webContents.send('worktree-data', data);
    }
  };
  
  doRefresh();
  refreshInterval = setInterval(doRefresh, (config.refreshSeconds || 5) * 1000);
}

// IPC handlers
ipcMain.handle('get-config', () => config);

ipcMain.handle('save-config', (_, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig(config);
  win.setAlwaysOnTop(config.alwaysOnTop);
  win.setOpacity(config.opacity);
  startRefresh();
  return config;
});

ipcMain.handle('add-repo', (_, repoData) => {
  config.repos.push(repoData);
  saveConfig(config);
  startRefresh();
  return config;
});

ipcMain.handle('remove-repo', (_, repoPath) => {
  config.repos = config.repos.filter(r => r.path !== repoPath);
  saveConfig(config);
  startRefresh();
  return config;
});

ipcMain.handle('refresh-now', async () => {
  const data = await fetchAllWorktrees();
  return data;
});

ipcMain.handle('close-window', () => win.hide());
ipcMain.handle('minimize-window', () => win.minimize());

ipcMain.handle('start-drag', () => {
  // handled via mouse events in renderer
});

app.whenReady().then(() => {
  createWindow();
  // createTray(); // Uncomment if you want system tray icon
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
