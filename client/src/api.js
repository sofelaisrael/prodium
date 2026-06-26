const BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://prodium-server.vercel.app/api'

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

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
}
