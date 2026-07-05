const BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://prodium-server.vercel.app/api'

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers })
    const text = await res.text()
    let data
    try { data = text ? JSON.parse(text) : {} } catch { data = {} }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
    return data
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('fetch') || err.cause?.code === 'ENOTFOUND') {
      throw new Error('Unable to connect. Please check your internet and try again.')
    }
    throw err
  }
}

export const api = {
  getEpisodes: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.category) qs.set('category', params.category)
    const query = qs.toString()
    return request(`/episodes${query ? `?${query}` : ''}`)
  },

  getEpisode: (id) => request(`/episodes/${id}`),
}
