export default defineBackground(() => {
  // ==========================================
  // Feature 3: Switch to last used tab (stack)
  // ==========================================
  const tabHistory: number[] = [];
  let switchingViaShortcut = false;

  function trackLastTab(tabId: number) {
    if (switchingViaShortcut) return;
    // Remove if already in history, then push to top
    const idx = tabHistory.indexOf(tabId);
    if (idx !== -1) tabHistory.splice(idx, 1);
    tabHistory.push(tabId);
  }

  async function switchToLastTab() {
    if (tabHistory.length < 2) return;
    // Pop current tab, peek at previous
    const current = tabHistory.pop()!;
    const target = tabHistory[tabHistory.length - 1];
    // Put current back at the bottom so it's reachable later
    tabHistory.unshift(current);
    try {
      switchingViaShortcut = true;
      await browser.tabs.update(target, { active: true });
      const tab = await browser.tabs.get(target);
      if (tab.windowId !== undefined) {
        await browser.windows.update(tab.windowId, { focused: true });
      }
    } catch {
      // Tab no longer exists, remove from history
      const idx = tabHistory.indexOf(target);
      if (idx !== -1) tabHistory.splice(idx, 1);
    } finally {
      switchingViaShortcut = false;
    }
  }

  // Clean up closed tabs from history
  browser.tabs.onRemoved.addListener((tabId) => {
    const idx = tabHistory.indexOf(tabId);
    if (idx !== -1) tabHistory.splice(idx, 1);
  });

  // ==========================================
  // Feature 1: Copy URL shortcut (Cmd+Shift+C)
  // ==========================================
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'copy-url') {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.url) return;

      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id! },
          func: (url: string) => {
            navigator.clipboard.writeText(url);
          },
          args: [tab.url],
        });
      } catch {
        await copyViaOffscreen(tab.url);
      }
    }

    if (command === 'last-tab') {
      switchToLastTab();
    }
  });

  // ==========================================
  // Feature 2: Auto tab cleanup (24h inactive)
  // ==========================================
  const STORAGE_KEY = 'tab_last_active';
  const CLEANUP_ALARM = 'tab-cleanup';
  const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  async function recordTabActivity(tabId: number) {
    const data: Record<number, number> =
      ((await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] as Record<number, number> | undefined) ?? {};
    data[tabId] = Date.now();
    await browser.storage.local.set({ [STORAGE_KEY]: data });
  }

  async function cleanupStaleTabs() {
    const now = Date.now();
    const data: Record<number, number> =
      ((await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] as Record<number, number> | undefined) ?? {};
    const tabs = await browser.tabs.query({});

    for (const tab of tabs) {
      if (!tab.id) continue;
      if (tab.pinned) continue;
      if (tab.groupId !== undefined && tab.groupId !== -1) continue;

      const lastActive = data[tab.id];
      if (!lastActive) {
        // First time seeing this tab — record it, don't close
        data[tab.id] = now;
        continue;
      }

      if (now - lastActive >= MAX_AGE_MS) {
        await browser.tabs.remove(tab.id);
        delete data[tab.id];
      }
    }

    // Clean up entries for tabs that no longer exist
    const existingTabIds = new Set(tabs.map((t) => t.id));
    for (const id of Object.keys(data)) {
      if (!existingTabIds.has(Number(id))) {
        delete data[Number(id)];
      }
    }

    await browser.storage.local.set({ [STORAGE_KEY]: data });
  }

  // Track tab activity
  browser.tabs.onActivated.addListener(({ tabId }) => {
    trackLastTab(tabId);
    recordTabActivity(tabId);
  });

  browser.tabs.onCreated.addListener((tab) => {
    if (tab.id) recordTabActivity(tab.id);
  });

  // Run cleanup every hour
  browser.alarms.create(CLEANUP_ALARM, { periodInMinutes: 60 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CLEANUP_ALARM) {
      cleanupStaleTabs();
    }
  });

  // Run cleanup on startup too
  cleanupStaleTabs();
});

async function copyViaOffscreen(text: string) {
  const existingContexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });

  if (existingContexts.length === 0) {
    await browser.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Copy URL to clipboard on restricted pages',
    });
  }

  await browser.runtime.sendMessage({
    type: 'copy-to-clipboard',
    text,
  });
}
