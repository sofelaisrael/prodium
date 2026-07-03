module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://prodmin.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { supabase, supabaseAdmin } = require('./server/app');

  try {
    if (req.path === '/api/analytics/stats' && req.method === 'GET') {
      const token = process.env.GOATCOUNTER_TOKEN;
      const baseUrl = process.env.GOATCOUNTER_URL;

      if (!token || !baseUrl) {
        return res.status(500).json({ error: 'GoatCounter not configured' });
      }

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();
      const end = now.toISOString();

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [totalRes, hitsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v0/stats/total?start=${start}&end=${end}`, { headers }),
        fetch(`${baseUrl}/api/v0/stats/hits?start=${start}&end=${end}`, { headers })
      ]);

      const total = await totalRes.json();
      const hits = await hitsRes.json();

      return res.json({
        total: total.total ?? 0,
        totalUnique: total.total_unique ?? 0,
        paths: hits.hits || []
      });
    }

    if (req.path === '/api/projects' && req.method === 'GET' && req.query.all === 'true') {
      const { data, error } = await supabaseAdmin.from('projects').select('*').order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(data || []);
    }

    if (req.path.startsWith('/api/') && req.method === 'GET') {
      return res.status(404).json({ error: 'Not found' });
    }

    if (req.method === 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}