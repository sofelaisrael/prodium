const { supabase, supabaseAdmin } = require('./app')
const { authenticateToken, generateToken } = require('./auth')

module.exports = function (app) {
  // Login - owner only
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' })
      }

      // Check if email is in the admins list
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
    if (!html) return 1
    const text = html.replace(/<[^>]*>/g, ' ')
    const words = text.split(/\s+/).filter(Boolean).length
    const imgs = (html.match(/<img /gi) || []).length
    const vids = (html.match(/<video |<iframe /gi) || []).length
    const minutes = Math.max(1, Math.ceil(words / 200 + imgs * 0.2 + vids * 0.5))
    return minutes
  }

  // Get all articles (supports ?search=, ?category=, ?featured=1)
  app.get('/api/articles', async (req, res) => {
    try {
      const { search, category, featured } = req.query

      let query = supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
      }

      if (featured === '1') {
        query = query.limit(6)
      }

      const { data, error } = await query

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      const articles = (data || []).map(a => ({
        ...a,
        reading_time: calcReadingTime(a.content)
      }))

      res.json(articles)

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get all categories with article counts
  app.get('/api/categories', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('category')
        .eq('published', true)

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

  // Get single article
  app.get('/api/articles/:id', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', req.params.id)
        .single()

      if (error) {
        return res.status(404).json({ error: 'Article not found' })
      }

      res.json({ ...data, reading_time: calcReadingTime(data.content) })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Create article (owner only)
  app.post('/api/articles', authenticateToken, async (req, res) => {
    try {
      const { title, content, excerpt, category } = req.body

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' })
      }

      const { data, error } = await supabaseAdmin
        .from('articles')
        .insert([{
          title,
          content,
          excerpt: excerpt || content.substring(0, 200) + '...',
          category: category || 'General',
          author_email: req.user.email,
          author_id: req.user.userId,
          published: true
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

  // Update article (owner only)
  app.put('/api/articles/:id', authenticateToken, async (req, res) => {
    try {
      const { title, content, excerpt, category } = req.body

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('id', req.params.id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Article not found' })
      }

      if (existing.author_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to update this article' })
      }

      const { data, error } = await supabaseAdmin
        .from('articles')
        .update({
          title: title || existing.title,
          content: content || existing.content,
          excerpt: excerpt || existing.excerpt,
          category: category || existing.category,
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

  // Delete article (owner only)
  app.delete('/api/articles/:id', authenticateToken, async (req, res) => {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('id', req.params.id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Article not found' })
      }

      if (existing.author_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this article' })
      }

      const { error } = await supabaseAdmin
        .from('articles')
        .delete()
        .eq('id', req.params.id)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      res.json({ message: 'Article deleted successfully' })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Record a page view
  app.post('/api/analytics/view', async (req, res) => {
    try {
      const { path, visitor_id } = req.body

      if (!path) {
        return res.status(400).json({ error: 'Path is required' })
      }

      const { error } = await supabase
        .from('page_views')
        .insert([{ path, visitor_id: visitor_id || null }])

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      res.status(201).json({ message: 'View recorded' })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get analytics stats (admin only)
  app.get('/api/analytics/stats', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('page_views')
        .select('path, visitor_id')

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      const views = data || []
      const total = views.length
      const uniqueVisitors = new Set(views.filter(v => v.visitor_id).map(v => v.visitor_id)).size

      const byPath = {}
      for (const v of views) {
        byPath[v.path] = (byPath[v.path] || 0) + 1
      }

      const pathBreakdown = Object.entries(byPath)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)

      res.json({ total, uniqueVisitors, byPath: pathBreakdown })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get user profile (owner only)
  app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('articles')
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
        articles: data || []
      })

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })
}
