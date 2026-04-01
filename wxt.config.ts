import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Your Chrome like Arc or Dia Kit',
    description: 'Copy URL shortcut + auto tab cleanup',
    permissions: ['activeTab', 'scripting', 'offscreen', 'tabs', 'storage', 'alarms', 'tabGroups'],
    commands: {
      'copy-url': {
        suggested_key: {
          default: 'Ctrl+Shift+C',
          mac: 'Command+Shift+C',
        },
        description: 'Copy current tab URL to clipboard',
      },
      'last-tab': {
        suggested_key: {
          default: 'Alt+Shift+Tab',
        },
        description: 'Switch to last used tab',
      },
      'toggle-pin': {
        suggested_key: {
          default: 'Ctrl+Shift+D',
          mac: 'MacCtrl+Shift+D',
        },
        description: 'Toggle pin/unpin current tab',
      },
    },
  },
});
