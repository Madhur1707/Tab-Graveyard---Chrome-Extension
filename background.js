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

function normalizeTab(tab) {
  if (!tab || !isRestorableUrl(tab.url)) return null

  return {
    title: tab.title || tab.url,
    url: tab.url,
    domain: new URL(tab.url).hostname.replace(/^www\./, ''),
    favIconUrl: tab.favIconUrl || '',
  }
}

async function getOpenTabs() {
  const result = await chrome.storage.session.get(OPEN_TABS_KEY)
  return result[OPEN_TABS_KEY] || {}
}

async function setOpenTabs(openTabs) {
  await chrome.storage.session.set({ [OPEN_TABS_KEY]: openTabs })
}

async function rememberTab(tab) {
  const tabInfo = normalizeTab(tab)
  const openTabs = await getOpenTabs()

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title || changeInfo.favIconUrl || tab.status === 'complete') {
    rememberTab(tab)
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
