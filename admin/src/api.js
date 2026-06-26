const BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://prodium-server.vercel.app/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

async function uploadRequest(path, file) {
  const token = localStorage.getItem('token')
  const ext = file.name.split('.').pop()
  const headers = {
    'Content-Type': file.type,
    'X-File-Ext': ext,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: file })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data
}

export const api = {
  login: (email, password) =>
    request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getArticles: () => request('/articles?all=true'),

  getArticle: (id) => request(`/articles/${id}`),

  createArticle: (article) =>
    request('/articles', { method: 'POST', body: JSON.stringify(article) }),

  updateArticle: (id, article) =>
    request(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(article) }),

  deleteArticle: (id) =>
    request(`/articles/${id}`, { method: 'DELETE' }),

  getAnalytics: () => request('/analytics/stats'),

  getCategories: () => request('/categories?all=true'),

  upload: (file) => uploadRequest('/upload', file),
}
