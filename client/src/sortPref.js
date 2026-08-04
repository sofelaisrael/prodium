const KEY = 'prodium-episode-sort'

export function getSortDesc() {
  try {
    return localStorage.getItem(KEY) === 'desc'
  } catch {
    return false
  }
}

export function setSortDesc(desc) {
  try {
    localStorage.setItem(KEY, desc ? 'desc' : 'asc')
  } catch {}
}
