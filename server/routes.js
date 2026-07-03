const multer = require('multer')
const path = require('path')
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

  // ─── PROJECTS ─────────────────────────────────────────────

  // Get all projects (supports ?search=, ?category=, ?featured=1, ?all=true for admin)
  app.get('/api/projects', async (req, res) => {
    try {
      const { search, category, featured, all } = req.query
      const isAdmin = all === 'true'

      let query = (isAdmin ? supabaseAdmin : supabase)
        .from('projects')
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

      if (featured === '1') {
        query = query.limit(6)
      }

      const { data, error } = await query

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      // Attach episode count for each project
      const projects = await Promise.all((data || []).map(async (p) => {
        const { count } = await (isAdmin ? supabaseAdmin : supabase)
          .from('episodes')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', p.id)

        const { count: publishedCount } = await (isAdmin ? supabaseAdmin : supabase)
          .from('episodes')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', p.id)
          .eq('published', true)

        return {
          ...p,
          episode_count: count || 0,
          published_episode_count: publishedCount || 0
        }
      }))

      res.json(projects)

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get all categories with project counts
  app.get('/api/categories', async (req, res) => {
    try {
      const { all } = req.query
      const isAdmin = all === 'true'

      let query = (isAdmin ? supabaseAdmin : supabase)
        .from('projects')
        .select('category')

      if (!isAdmin) {
        query = query.eq('published', true)
      }

      const { data, error } = await query

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      const counts = {}
      for (const row of (data || [])) {
        const cat = row.category || 'General'
        counts[cat] = (counts[cat] || 0) + 1
      }

      const categories = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      res.json(categories)

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get single project (with published episodes only)
  app.get('/api/projects/:id', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', req.params.id)
        .eq('published', true)
        .single()

      if (error) {
        return res.status(404).json({ error: 'Project not found' })
      }

      // Get published episodes for this project
      const { data: episodes, error: epError } = await supabase
        .from('episodes')
        .select('*')
        .eq('project_id', req.params.id)
        .eq('published', true)
        .order('created_at', { ascending: true })

      if (epError) {
        return res.status(500).json({ error: epError.message })
      }

      res.json({
        ...data,
        episodes: (episodes || []).map(e => {
          const { minutes, videos } = calcReadingTime(e.content)
          return { ...e, reading_time: minutes, video_count: videos }
        })
      })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Create project (owner only)
  app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
      const { title, excerpt, category, published } = req.body

      if (!title) {
        return res.status(400).json({ error: 'Title is required' })
      }

      const { data, error } = await supabaseAdmin
        .from('projects')
        .insert([{
          title,
          excerpt: excerpt || '',
          category: category || 'General',
          author_email: req.user.email,
          author_id: req.user.userId,
          published: published !== false
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

  // Update project (owner only)
  app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
      const { title, excerpt, category, published } = req.body

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', req.params.id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Project not found' })
      }

      if (existing.author_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to update this project' })
      }

      const { data, error } = await supabaseAdmin
        .from('projects')
        .update({
          title: title || existing.title,
          excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
          category: category || existing.category,
          published: published !== undefined ? published : existing.published,
          updated_at: new Date().toISOString()
        })
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

  // Delete project (owner only, cascades episodes)
  app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', req.params.id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Project not found' })
      }

      if (existing.author_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this project' })
      }

      const { error } = await supabaseAdmin
        .from('projects')
        .delete()
        .eq('id', req.params.id)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      res.json({ message: 'Project deleted successfully' })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // ─── EPISODES ─────────────────────────────────────────────

  // Get episodes for a project (supports ?all=true for admin)
  app.get('/api/projects/:projectId/episodes', async (req, res) => {
    try {
      const { all } = req.query
      const isAdmin = all === 'true'

      let query = (isAdmin ? supabaseAdmin : supabase)
        .from('episodes')
        .select('*')
        .eq('project_id', req.params.projectId)
        .order('created_at', { ascending: true })

      if (!isAdmin) {
        query = query.eq('published', true)
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

  // Get single episode (published only, or all with ?all=true for admin)
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

  // Create episode in a project (owner only)
  app.post('/api/projects/:projectId/episodes', authenticateToken, async (req, res) => {
    try {
      const { title, content, excerpt, published } = req.body

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' })
      }

      // Verify project exists and user owns it
      const { data: project, error: projError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', req.params.projectId)
        .single()

      if (projError || !project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      if (project.author_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      const { data, error } = await supabaseAdmin
        .from('episodes')
        .insert([{
          project_id: req.params.projectId,
          title,
          content,
          excerpt: excerpt || content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200) + '...',
          published: published !== false
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
      const { title, content, excerpt, published } = req.body

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('episodes')
        .select('*, projects!inner(author_id)')
        .eq('id', req.params.id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Episode not found' })
      }

      if (existing.projects.author_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to update this episode' })
      }

      const update = {
          title: title || existing.title,
          content: content || existing.content,
          excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
          published: published !== undefined ? published : existing.published,
          updated_at: new Date().toISOString()
        }

        // When publishing a draft, set created_at to now so it sorts after existing published episodes
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
        .select('*, projects!inner(author_id)')
        .eq('id', req.params.id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Episode not found' })
      }

      if (existing.projects.author_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this episode' })
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

  const MB = 1024 * 1024
  const uploadMw = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * MB },
  }).single('file')

  // Upload image or video to Supabase Storage (admin only)
  app.post('/api/upload', authenticateToken, (req, res) => {
    uploadMw(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large. Maximum size is 4MB.' })
        }
        return res.status(400).json({ error: err.message })
      }

      try {
        const file = req.file
        if (!file) {
          return res.status(400).json({ error: 'No file provided' })
        }

        const ext = path.extname(file.originalname) || '.bin'
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
        const mimetype = file.mimetype || 'application/octet-stream'

        const { data, error } = await supabaseAdmin.storage
          .from('uploads')
          .upload(filename, file.buffer, { contentType: mimetype })

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
  })

  // ─── CLOUDINARY UPLOAD SIGNATURE ─────────────────────────

  // Returns a signature so the frontend can upload directly to Cloudinary
  // (bypassing Vercel's 4.5MB serverless body limit)
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

  // GoatCounter analytics proxy (admin only)
  app.get('/api/analytics/stats', (req, res) => {
    // Open to all origins for now
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    authenticateToken(req, res, async () => {
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
  })

  // ─── USER ─────────────────────────────────────────────────

  // Get user profile (owner only)
  app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('projects')
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
        projects: data || []
      })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })
}
