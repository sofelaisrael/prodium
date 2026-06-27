import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import ConfirmModal from '../components/ConfirmModal'

const filters = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
]

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const load = () => {
    setLoading(true)
    api.getProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const togglePublish = async (project) => {
    await api.updateProject(project.id, { published: !project.published })
    load()
  }

  const deleteProject = async () => {
    if (!deleteId) return
    await api.deleteProject(deleteId)
    setDeleteId(null)
    load()
  }

  const filtered = projects.filter(p => {
    if (activeFilter === 'published' && !p.published) return false
    if (activeFilter === 'draft' && p.published) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900">Projects</h1>
          <p className="mt-1 text-[15px] text-neutral-500">{projects.length} total projects</p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New project
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
              {f.key === 'all' && projects.length}
              {f.key === 'published' && projects.filter(p => p.published).length}
              {f.key === 'draft' && projects.filter(p => !p.published).length}
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
            {search ? 'No projects match your search.' : 'No projects yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(p => (
            <Link
              key={p.id}
              to={`/projects/${p.id}/episodes`}
              className="group overflow-hidden rounded-xl border border-neutral-100 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/9] bg-neutral-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-bebas text-[48px] text-neutral-200 uppercase tracking-wider">{p.title?.charAt(0)}</span>
                </div>
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => { e.preventDefault(); togglePublish(p) }}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                      p.published
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {p.published ? 'Published' : 'Draft'}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors truncate">
                    {p.title}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => { e.preventDefault(); setDeleteId(p.id) }}
                      className="rounded p-1.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[12px] text-neutral-400">
                  {p.episode_count || 0} episodes · {p.category || 'Uncategorized'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteProject}
        title="Delete project"
        message="Are you sure? This will delete the project and all its episodes. This action cannot be undone."
      />
    </div>
  )
}
