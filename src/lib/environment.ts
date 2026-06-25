export function isExtensionContext(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.runtime !== 'undefined' &&
    !!chrome.runtime.id
  )
}
