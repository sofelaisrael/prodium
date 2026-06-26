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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-sm text-neutral-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-[15px] text-neutral-500">Welcome back. Here's what's happening.</p>
        </div>
        <Link
          to="/episodes/new"
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New episode
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total episodes', value: articles.length, color: 'text-neutral-900' },
          { label: 'Published', value: published, color: 'text-emerald-600' },
          { label: 'Drafts', value: drafts, color: 'text-neutral-500' },
          { label: 'Total views', value: analytics?.total ?? '—', color: 'text-neutral-900' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-neutral-100 bg-white p-5">
            <p className={`text-[28px] font-semibold tracking-tight ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      {analytics && analytics.paths.length > 0 && (
        <section>
          <h2 className="mb-4 text-[13px] font-medium uppercase tracking-wider text-neutral-400">Top pages</h2>
          <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
            {analytics.paths.slice(0, 5).map(p => (
              <div key={p.path} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-[14px] text-neutral-700 truncate">{p.path}</span>
                <div className="flex gap-6 text-[13px] text-neutral-400">
                  <span>{p.count} views</span>
                  <span>{p.count_unique} unique</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-neutral-400">Recent episodes</h2>
          <Link to="/episodes" className="text-[13px] text-neutral-500 hover:text-neutral-900">View all</Link>
        </div>
        {articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 py-12 text-center">
            <p className="text-[14px] text-neutral-400">No episodes yet.</p>
            <Link to="/episodes/new" className="mt-3 inline-block text-[14px] text-neutral-900 underline underline-offset-4 hover:text-neutral-600">
              Create your first episode
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
            {articles.slice(0, 5).map(a => (
              <Link
                key={a.id}
                to={`/episodes/${a.id}/edit`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-neutral-900 truncate">{a.title}</p>
                  <p className="mt-0.5 text-[13px] text-neutral-400">
                    {a.category || 'Uncategorized'} · {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`ml-4 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                  a.published
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {a.published ? 'Published' : 'Draft'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
