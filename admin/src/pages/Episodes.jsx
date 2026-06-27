import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import ConfirmModal from '../components/ConfirmModal'

const filters = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
]

export default function Episodes() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getProject(projectId).then(setProject).catch(() => {}),
      api.getProjectEpisodes(projectId).then(setEpisodes).catch(() => {})
    ]).finally(() => setLoading(false))
  }

  useEffect(load, [projectId])

  const togglePublish = async (episode) => {
    await api.updateEpisode(episode.id, { published: !episode.published })
    load()
  }

  const deleteEpisode = async () => {
    if (!deleteId) return
    await api.deleteEpisode(deleteId)
    setDeleteId(null)
    load()
  }

  const filtered = episodes.filter(e => {
    if (activeFilter === 'published' && !e.published) return false
    if (activeFilter === 'draft' && e.published) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <Link to="/projects" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Projects
          </Link>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-900">{project?.title || 'Project'}</h1>
          <p className="mt-1 text-[15px] text-neutral-500">{episodes.length} episodes</p>
        </div>
        <Link
          to={`/projects/${projectId}/episodes/new`}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New episode
        </Link>
      </div>

      <div className="flex items-center gap-4 border-b border-neutral-100">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`pb-3 text-[14px] font-medium transition-colors ${
              activeFilter === f.key
                ? 'border-b-2 border-neutral-900 text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-neutral-300">
              {f.key === 'all' && episodes.length}
              {f.key === 'published' && episodes.filter(e => e.published).length}
              {f.key === 'draft' && episodes.filter(e => !e.published).length}
            </span>
          </button>
        ))}

        <div className="ml-auto">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-48 rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-[13px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[14px] text-neutral-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-[14px] text-neutral-400">
            {search ? 'No episodes match your search.' : 'No episodes yet.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
          {filtered.map(e => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/episodes/${e.id}/edit`}
                  className="text-[15px] font-medium text-neutral-900 hover:underline"
                >
                  {e.title}
                </Link>
                <p className="mt-0.5 text-[13px] text-neutral-400">
                  {e.reading_time} min read · {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePublish(e)}
                  className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                    e.published
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  {e.published ? 'Published' : 'Draft'}
                </button>

                <Link
                  to={`/episodes/${e.id}/edit`}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Link>

                <button
                  onClick={() => setDeleteId(e.id)}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteEpisode}
        title="Delete episode"
        message="Are you sure you want to delete this episode? This action cannot be undone."
      />
    </div>
  )
}
