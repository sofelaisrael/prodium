const { supabase, supabaseAdmin, cloudinary } = require('./app')
const { authenticateToken, generateToken } = require('./auth')

module.exports = function (app) {
  // Login - owner only
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' })
      }

      const adminEmails = (process.env.ADMIN_EMAILS || process.env.OWNER_EMAIL || '').split(',').map(e => e.trim()).filter(Boolean)
      if (adminEmails.length === 0) {
        return res.status(500).json({ error: 'ADMIN_EMAILS not configured' })
      }

      if (!adminEmails.includes(email)) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = generateToken(authData.user.id, authData.user.email)

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: authData.user.id,
          email: authData.user.email
        }
      })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Calculate reading time from HTML content
  function calcReadingTime(html) {
    if (!html) return { minutes: 1, videos: 0 }
    const text = html.replace(/<[^>]*>/g, ' ')
    const words = text.split(/\s+/).filter(Boolean).length
    const imgs = (html.match(/<img /gi) || []).length
    const vids = (html.match(/<video |<iframe /gi) || []).length
    const minutes = Math.max(1, Math.ceil(words / 200 + imgs * 0.2 + vids * 0.5))
    return { minutes, videos: vids }
  }

  // ─── EPISODES ─────────────────────────────────────────────

  // Get all episodes (supports ?search=, ?category=, ?all=true for admin)
  app.get('/api/episodes', async (req, res) => {
    try {
      const { search, category, all } = req.query
      const isAdmin = all === 'true'

      let query = (isAdmin ? supabaseAdmin : supabase)
        .from('episodes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isAdmin) {
        query = query.eq('published', true)
      }

      if (category) {
        query = query.eq('category', category)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      const episodes = (data || []).map(e => {
        const { minutes, videos } = calcReadingTime(e.content)
        return { ...e, reading_time: minutes, video_count: videos }
      })

      res.json(episodes)

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get single episode
  app.get('/api/episodes/:id', async (req, res) => {
    try {
      const { all } = req.query
      const isAdmin = all === 'true'

      let query = (isAdmin ? supabaseAdmin : supabase)
        .from('episodes')
        .select('*')
        .eq('id', req.params.id)

      if (!isAdmin) {
        query = query.eq('published', true)
      }

      const { data, error } = await query.single()

      if (error) {
        return res.status(404).json({ error: 'Episode not found' })
      }

      const { minutes, videos } = calcReadingTime(data.content)
      res.json({ ...data, reading_time: minutes, video_count: videos })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Create episode (owner only)
  app.post('/api/episodes', authenticateToken, async (req, res) => {
    try {
      const { title, content, excerpt, published, banner_image, category } = req.body

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' })
      }

      const { data, error } = await supabaseAdmin
        .from('episodes')
        .insert([{
          title,
          content,
          excerpt: excerpt || content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200) + '...',
          published: published !== false,
          banner_image: banner_image || null,
          category: category || 'General',
          author_id: req.user.userId,
          author_email: req.user.email,
        }])
        .select()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      res.status(201).json(data[0])

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Update episode (owner only)
  app.put('/api/episodes/:id', authenticateToken, async (req, res) => {
    try {
      const { title, content, excerpt, published, banner_image, category } = req.body

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('episodes')
        .select('*')
        .eq('id', req.params.id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Episode not found' })
      }

      const update = {
        title: title || existing.title,
        content: content || existing.content,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        published: published !== undefined ? published : existing.published,
        category: category || existing.category,
        banner_image: banner_image !== undefined ? banner_image : existing.banner_image,
        updated_at: new Date().toISOString(),
      }

      if (published === true && existing.published === false) {
        update.created_at = new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('episodes')
        .update(update)
        .eq('id', req.params.id)
        .select()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      res.json(data[0])

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Delete episode (owner only)
  app.delete('/api/episodes/:id', authenticateToken, async (req, res) => {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('episodes')
        .select('*')
        .eq('id', req.params.id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Episode not found' })
      }

      const { error } = await supabaseAdmin
        .from('episodes')
        .delete()
        .eq('id', req.params.id)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      res.json({ message: 'Episode deleted successfully' })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // ─── UPLOAD ───────────────────────────────────────────────

  const MAX_UPLOAD = 4 * 1024 * 1024

  app.post('/api/upload', authenticateToken, async (req, res) => {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)

      const buffer = Buffer.concat(chunks)

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'No file data received' })
      }

      if (buffer.length > MAX_UPLOAD) {
        return res.status(413).json({ error: 'File too large. Maximum size is 4MB.' })
      }

      const ext = (req.headers['x-file-ext'] || 'bin').replace(/[^a-z0-9.]/gi, '')
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const mimetype = req.headers['content-type'] || 'application/octet-stream'

      const { data, error } = await supabaseAdmin.storage
        .from('uploads')
        .upload(filename, buffer, { contentType: mimetype })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('uploads')
        .getPublicUrl(filename)

      res.json({ url: urlData.publicUrl, filename, mimetype })

    } catch (error) {
      console.error('Upload error:', error)
      res.status(500).json({ error: error.message || 'Upload failed' })
    }
  })

  // ─── CLOUDINARY UPLOAD SIGNATURE ─────────────────────────

  app.get('/api/upload-signature', authenticateToken, (req, res) => {
    try {
      const timestamp = Math.round(Date.now() / 1000)
      const params = { timestamp, folder: 'prodium' }
      const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET)

      res.json({
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        folder: 'prodium',
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // ─── ANALYTICS ────────────────────────────────────────────

  app.get('/api/analytics/stats', authenticateToken, async (req, res) => {
    try {
      const token = process.env.GOATCOUNTER_TOKEN
      const baseUrl = process.env.GOATCOUNTER_URL

      if (!token || !baseUrl) {
        return res.status(500).json({ error: 'GoatCounter not configured' })
      }

      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString()
      const end = now.toISOString()

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const [totalRes, hitsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v0/stats/total?start=${start}&end=${end}`, { headers }),
        fetch(`${baseUrl}/api/v0/stats/hits?start=${start}&end=${end}`, { headers })
      ])

      const total = await totalRes.json()
      const hits = await hitsRes.json()

      res.json({
        total: total.total ?? 0,
        totalUnique: total.total_unique ?? 0,
        paths: hits.hits || []
      })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // ─── USER ─────────────────────────────────────────────────

  app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('episodes')
        .select('*')
        .eq('author_id', req.user.userId)
        .order('created_at', { ascending: false })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      res.json({
        user: {
          id: req.user.userId,
          email: req.user.email
        },
        episodes: data || []
      })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })
}
