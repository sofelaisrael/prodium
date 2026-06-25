const BASE = '/api'

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

function getVisitorId() {
  let id = localStorage.getItem('visitor_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('visitor_id', id)
  }
  return id
}

const viewedPaths = new Set()

export const api = {
  getArticles: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.category) qs.set('category', params.category)
    const query = qs.toString()
    return request(`/articles${query ? `?${query}` : ''}`)
  },

  getArticle: (id) => request(`/articles/${id}`),

  getCategories: () => request('/categories'),

  trackView: (path) => {
    const key = `${path}_${getVisitorId()}`
    if (viewedPaths.has(key)) return
    viewedPaths.add(key)
    request('/analytics/view', {
      method: 'POST',
      body: JSON.stringify({ path, visitor_id: getVisitorId() })
    }).catch(() => {})
  }
}
