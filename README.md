# Git Worktree Panel

A lightweight, always-on-top floating panel for Windows that shows all your git worktrees and their branches at a glance — auto-refreshing in the background.

![Panel Preview](preview.png)

---

## Features

- 🌲 Displays all worktrees per repo with branch names
- 🔄 Auto-refreshes every N seconds (configurable)
- 📌 Always-on-top floating window
- ➕ Add multiple repos — each shown as a collapsible card
- 🔒 Shows locked/prunable/bare/detached worktree states
- 💾 Remembers window position and settings between launches
- ⚙ Adjustable opacity, refresh interval, always-on-top

---

## Setup (Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- Git installed and in your PATH
- Windows 10/11

### Install & Run

```bash
# 1. Clone or copy this folder somewhere
cd git-worktree-panel

# 2. Install dependencies
npm install

# 3. Launch the panel
npm start
```

The panel will appear in the top-right corner of your screen.

---

## Build a Portable .exe (No Install Required)

```bash
npm install
npm run build:portable
```

This creates `dist/GitWorktreePanel.exe` — a single executable you can put anywhere and run directly, no Node.js needed on the target machine.

---

## Usage

### Adding a Repository
1. Click **`+ repo`** in the footer
2. Enter an optional display name
3. Paste the **root path** of your git repo (the folder containing `.git`)
4. Hit **Add** or press Enter

> Example path: `C:\Users\you\projects\my-app`

### Removing a Repository
Hover over the repo header and click the **✕** button that appears.

### Controls
| Control | Action |
|---|---|
| 🔴 Red dot | Hide window |
| 🟡 Yellow dot | Minimize |
| 🟢 Green dot | Toggle always-on-top |
| **⚙** | Open settings |
| **↺ refresh** | Manual refresh now |
| Drag titlebar | Move window |

### Settings
- **Refresh interval**: How often to poll `git worktree list` (1–60 seconds)
- **Always on top**: Float above all other windows
- **Opacity**: Transparency (20–100%)

---

## Worktree Indicators

| Color | Meaning |
|---|---|
| 🔵 Blue | Main/primary worktree |
| 🟢 Green | Normal branch worktree |
| 🔴 Red/Orange | Detached HEAD |
| 🟡 Yellow | Locked worktree |
| ⚫ Gray | Bare worktree |

Badges shown: `main`, `🔒` (locked), `prune` (prunable), `bare`

---

## Auto-Start with Windows

To launch the panel automatically when Windows starts:

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to `GitWorktreePanel.exe` (or to `npm start` via a `.bat` file) in that folder

### Startup .bat file (for dev mode)
Create `start-worktree-panel.bat`:
```bat
@echo off
cd /d C:\path\to\git-worktree-panel
npx electron . --no-sandbox
```
Then add a shortcut to this `.bat` file in your startup folder.

---

## Config File Location

Settings are saved at:
```
%APPDATA%\git-worktree-panel\config.json
```

You can edit this directly if needed.
