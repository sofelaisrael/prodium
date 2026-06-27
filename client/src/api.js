const BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://prodium-server.vercel.app/api'

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : {} } catch { data = {} }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  getProjects: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.category) qs.set('category', params.category)
    const query = qs.toString()
    return request(`/projects${query ? `?${query}` : ''}`)
  },

  getProject: (id) => request(`/projects/${id}`),

  getCategories: () => request('/categories'),

  getProjectEpisodes: (projectId) => request(`/projects/${projectId}/episodes`),

  getEpisode: (id) => request(`/episodes/${id}`),
}
