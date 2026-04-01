export default defineBackground(() => {
  // ==========================================
  // Feature 3: Switch to last used tab (stack)
  // Persisted in storage.session to survive SW restart
  // ==========================================
  const TAB_HISTORY_KEY = 'tab_history';
  let switchingViaShortcut = false;

  async function getTabHistory(): Promise<number[]> {
    const result = await browser.storage.session.get(TAB_HISTORY_KEY);
    return (result[TAB_HISTORY_KEY] as number[] | undefined) ?? [];
  }

  async function saveTabHistory(history: number[]) {
    await browser.storage.session.set({ [TAB_HISTORY_KEY]: history });
  }

  async function trackLastTab(tabId: number) {
    if (switchingViaShortcut) return;
    const history = await getTabHistory();
    const idx = history.indexOf(tabId);
    if (idx !== -1) history.splice(idx, 1);
    history.push(tabId);
    await saveTabHistory(history);
  }

  async function switchToLastTab() {
    const history = await getTabHistory();
    if (history.length < 2) return;
    const current = history.pop()!;
    const target = history[history.length - 1];
    history.unshift(current);
    try {
      switchingViaShortcut = true;
      await browser.tabs.update(target, { active: true });
      const tab = await browser.tabs.get(target);
      if (tab.windowId !== undefined) {
        await browser.windows.update(tab.windowId, { focused: true });
      }
      await saveTabHistory(history);
    } catch {
      const idx = history.indexOf(target);
      if (idx !== -1) history.splice(idx, 1);
      await saveTabHistory(history);
    } finally {
      switchingViaShortcut = false;
    }
  }

  // Clean up closed tabs from history
  browser.tabs.onRemoved.addListener(async (tabId) => {
    const history = await getTabHistory();
    const idx = history.indexOf(tabId);
    if (idx !== -1) {
      history.splice(idx, 1);
      await saveTabHistory(history);
    }
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

            const existing = document.getElementById('__copy-url-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.id = '__copy-url-toast';
            toast.textContent = 'Copied Current URL \u{1F4CB}';
            Object.assign(toast.style, {
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: '2147483647',
              padding: '12px 22px',
              background: 'linear-gradient(180deg, rgba(115, 115, 125, 0.85) 0%, rgba(80, 80, 90, 0.9) 50%, rgba(115, 115, 125, 0.85) 100%)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              fontSize: '17px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: '700',
              letterSpacing: '0.3px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              opacity: '0',
              transform: 'translateY(-8px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              pointerEvents: 'none',
            });
            document.body.appendChild(toast);

            requestAnimationFrame(() => {
              toast.style.opacity = '1';
              toast.style.transform = 'translateY(0)';
            });

            setTimeout(() => {
              toast.style.opacity = '0';
              toast.style.transform = 'translateY(-8px)';
              setTimeout(() => toast.remove(), 200);
            }, 1500);
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

    if (command === 'toggle-pin') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await browser.tabs.update(tab.id, { pinned: !tab.pinned });
      }
    }
  });

  // ==========================================
  // Feature 2: Auto tab cleanup (24h inactive)
  // ==========================================
  const STORAGE_KEY = 'tab_last_active';
  const CLEANUP_ALARM = 'tab-cleanup';
  const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

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
