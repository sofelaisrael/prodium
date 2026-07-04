const BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://prodium-server.vercel.app/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : {} } catch { data = {} }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

function uploadWithProgress(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token')
    const ext = file.name.split('.').pop()
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}${path}`)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('X-File-Ext', ext)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let data
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : {} } catch { data = {} }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else reject(new Error(data.error || `Upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(file)
  })
}

export const api = {
  login: (email, password) =>
    request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getEpisodes: (params = {}) => {
    const qs = new URLSearchParams({ all: 'true' })
    if (params.search) qs.set('search', params.search)
    if (params.category) qs.set('category', params.category)
    return request(`/episodes?${qs}`)
  },

  getEpisode: (id) => request(`/episodes/${id}?all=true`),
  createEpisode: (episode) =>
    request('/episodes', { method: 'POST', body: JSON.stringify(episode) }),
  updateEpisode: (id, episode) =>
    request(`/episodes/${id}`, { method: 'PUT', body: JSON.stringify(episode) }),
  deleteEpisode: (id) =>
    request(`/episodes/${id}`, { method: 'DELETE' }),

  getAnalytics: () => request('/analytics/stats'),
  upload: (file, onProgress) => uploadWithProgress('/upload', file, onProgress),
}
