# Your Chrome like Arc or Dia Kit

Chrome is great. But Arc and Dia have better UX for tab & URL management. This extension brings those missing pieces to Chrome — no store install needed, just build it yourself.

**Self-built local extensions are the safest extensions.** You can read every line of code before you install it. No updates pushed without your knowledge. No telemetry. No permissions you didn't ask for.

## What You Get

### 1. Copy URL with a keystroke

`Cmd+Shift+C` — copies the current tab's URL to your clipboard instantly. No popup, no right-click menu. Just the URL, ready to paste.

A sleek toast notification appears in the top-right corner to confirm.

Works on all pages including `chrome://` pages (via offscreen fallback).

### 2. Auto Tab Cleanup

Tabs you haven't touched in **12 hours** are automatically closed. Your browser stays clean without you lifting a finger.

Safe by default:
- **Pinned tabs** are never closed
- **Grouped tabs** are never closed
- Cleanup runs every hour in the background

### 3. Last Tab Switching

`Alt+Shift+Tab` — jumps to the tab you were just looking at. Hit it again to keep going back through your tab history, like undo for your attention.

Tab history is stored in session storage, so it survives background service worker restarts. History resets when you close Chrome.

This is the "go back" feature Chrome should have had from day one.

### 4. Pin/Unpin Tab Toggle

`Ctrl+Shift+D` — toggles pin/unpin on the current tab. Chrome doesn't have a shortcut for this. Now you do.

## Shortcuts at a Glance

| Shortcut | Action |
|---|---|
| `Cmd+Shift+C` | Copy current URL |
| `Alt+Shift+Tab` | Go back through tab history |
| `Ctrl+Shift+D` | Toggle pin/unpin tab |

All shortcuts can be customized at `chrome://extensions/shortcuts`.

## Install (2 minutes)

```bash
git clone https://github.com/TeXmeijin/your-chrome-like-arc-or-dia-kit.git
cd your-chrome-like-arc-or-dia-kit
npm install
npm run build
```

Then:

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right toggle)
3. Click **Load unpacked** and select the `.output/chrome-mv3/` folder

Done.

## Tech Stack

- [WXT](https://wxt.dev/) — next-gen browser extension framework
- TypeScript
- Manifest V3

## Why Not Publish to the Chrome Web Store?

- Store extensions can update silently and add unwanted permissions
- Review process doesn't catch everything
- A local build gives you full control and zero trust required
- This is a personal tool — fork it, modify it, make it yours

## License

MIT
