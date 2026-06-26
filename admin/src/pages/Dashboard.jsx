import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Dashboard() {
  const [articles, setArticles] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getArticles().then(setArticles).catch(() => {}),
      api.getAnalytics().then(setAnalytics).catch(() => {})
    ]).finally(() => setLoading(false))
  }, [])

  const published = articles.filter(a => a.published).length
  const drafts = articles.length - published

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link to="/articles/new" className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">
          New article
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: articles.length },
          { label: 'Published', value: published },
          { label: 'Drafts', value: drafts },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {analytics && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-gray-500">Page views (last 30 days)</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-2xl font-semibold">{analytics.total}</p>
              <p className="text-sm text-gray-500">Total views</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-2xl font-semibold">{analytics.totalUnique}</p>
              <p className="text-sm text-gray-500">Unique visitors</p>
            </div>
          </div>
          {analytics.paths.length > 0 && (
            <>
              <h3 className="mb-2 text-sm font-medium text-gray-500">Top pages</h3>
              <div className="rounded-lg border border-gray-200 bg-white">
                {analytics.paths.map(p => (
                  <div key={p.path} className="flex items-center justify-between px-4 py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{p.path}</span>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{p.count} views</span>
                      <span>{p.count_unique} unique</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-500">Recent articles</h2>
        {articles.length === 0 ? (
          <p className="text-sm text-gray-400">No articles yet.</p>
        ) : (
          <div className="space-y-2">
            {articles.slice(0, 5).map(a => (
              <Link
                key={a.id}
                to={`/articles/${a.id}/edit`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-gray-300"
              >
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.category || 'Uncategorized'}</p>
                </div>
                <span className={`text-xs ${a.published ? 'text-green-600' : 'text-gray-400'}`}>
                  {a.published ? 'Published' : 'Draft'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
