const BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://prodium-server.vercel.app/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { ...options.headers }
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : {} } catch { data = {} }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      let data
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : {} } catch { data = {} }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else reject(new Error(data.error || data.message || `Upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
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

  getUploadSignature: () => request('/upload-signature'),

  async upload(file, onProgress) {
    try {
      const { signature, timestamp, api_key, cloud_name, folder } = await this.getUploadSignature()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', api_key)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      formData.append('folder', folder)

      const url = `https://api.cloudinary.com/v1_1/${cloud_name}/${file.type.startsWith('video/') ? 'video' : 'image'}/upload`

      const result = await uploadWithProgress(url, formData, onProgress)
      return { url: result.secure_url, filename: result.public_id, mimetype: file.type }
    } catch (err) {
      console.error('Upload failed:', err)
      throw err
    }
  },
}
