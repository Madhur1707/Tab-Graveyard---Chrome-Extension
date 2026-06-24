const OPEN_TABS_KEY = 'openTabs'
const CLOSED_TABS_KEY = 'closedTabs'
const MAX_CLOSED_TABS = 500

function isRestorableUrl(url) {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeTab(tab, description) {
  if (!tab || !isRestorableUrl(tab.url)) return null

  return {
    title: tab.title || tab.url,
    url: tab.url,
    domain: new URL(tab.url).hostname.replace(/^www\./, ''),
    favIconUrl: tab.favIconUrl || '',
    description: description || '',
  }
}

// Reads the page's meta description (used to give AI search real meaning to
// embed, instead of just a short title). Best-effort: fails silently on pages
// where scripts can't run (chrome://, web store, PDF viewers, etc.).
async function getPageDescription(tabId) {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const pick = (sel) => document.querySelector(sel)?.getAttribute('content') || ''
        return (
          pick('meta[name="description"]') ||
          pick('meta[property="og:description"]') ||
          pick('meta[name="twitter:description"]') ||
          ''
        )
      },
    })
    return (injection?.result || '').trim().slice(0, 300)
  } catch {
    return ''
  }
}

async function getOpenTabs() {
  const result = await chrome.storage.session.get(OPEN_TABS_KEY)
  return result[OPEN_TABS_KEY] || {}
}

async function setOpenTabs(openTabs) {
  await chrome.storage.session.set({ [OPEN_TABS_KEY]: openTabs })
}

async function rememberTab(tab, description) {
  const openTabs = await getOpenTabs()
  // Preserve a description we captured earlier if this update didn't bring a new
  // one (e.g. a title-only change shouldn't wipe the page description).
  const existing = openTabs[tab.id]
  const tabInfo = normalizeTab(tab, description || existing?.description)

  if (tabInfo) {
    openTabs[tab.id] = tabInfo
  } else {
    delete openTabs[tab.id]
  }

  await setOpenTabs(openTabs)
}

async function forgetTab(tabId) {
  const openTabs = await getOpenTabs()
  delete openTabs[tabId]
  await setOpenTabs(openTabs)
}

async function saveClosedTab(tabInfo) {
  const savedTab = {
    id: Date.now(),
    ...tabInfo,
    closedAt: Date.now(),
  }

  const result = await chrome.storage.local.get(CLOSED_TABS_KEY)
  const existing = result[CLOSED_TABS_KEY] || []
  const updated = [savedTab, ...existing].slice(0, MAX_CLOSED_TABS)

  await chrome.storage.local.set({ [CLOSED_TABS_KEY]: updated })
}

async function refreshOpenTabs() {
  const tabs = await chrome.tabs.query({})
  const openTabs = {}

  for (const tab of tabs) {
    const tabInfo = normalizeTab(tab)
    if (tabInfo) openTabs[tab.id] = tabInfo
  }

  await setOpenTabs(openTabs)
}

chrome.runtime.onInstalled.addListener(() => {
  refreshOpenTabs()
})

chrome.runtime.onStartup.addListener(() => {
  refreshOpenTabs()
})

chrome.tabs.onCreated.addListener((tab) => {
  rememberTab(tab)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title || changeInfo.favIconUrl || tab.status === 'complete') {
    // Once the page has finished loading, grab its meta description for AI search.
    const description =
      tab.status === 'complete' && isRestorableUrl(tab.url)
        ? await getPageDescription(tabId)
        : ''
    rememberTab(tab, description)
  }
})

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (removeInfo.isWindowClosing) {
    await forgetTab(tabId)
    return
  }

  const openTabs = await getOpenTabs()
  const tabInfo = openTabs[tabId]

  if (tabInfo) {
    await saveClosedTab(tabInfo)
  }

  delete openTabs[tabId]
  await setOpenTabs(openTabs)
})

refreshOpenTabs()

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})
