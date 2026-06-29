import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Blob from '../components/Blob'
import lineIcon from '../assets/line.svg'

function extractFirstImage(html) {
  if (!html) return null
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (category) params.category = category
    api.getProjects(params).then(setProjects).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [category])
  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    load()
  }

  return (
    <div className="py-12 px-5 md:mx-20">
      <div className="mb-12">
        <h1 className="font-bebas text-[48px] uppercase leading-none tracking-[0.04em] text-neutral-900 md:text-[72px]">
          Projects
        </h1>
        <p className="mt-3 text-[15px] text-neutral-500 font-light">Explore all published projects.</p>
      </div>

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full border border-neutral-200 bg-white pl-9 pr-4 text-[14px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
          />
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('')}
              className={`px-4 py-1.5 text-[13px] font-medium transition-colors ${
                !category
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className={`px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  category === c.name
                    ? 'bg-neutral-900 text-white'
                    : 'border border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[14px] text-neutral-400">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-[14px] text-neutral-400">No projects found.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {projects.map((p, i) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className={`group ${i === 0 ? 'sm:col-span-2' : ''}`}
            >
              <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow hover:shadow-lg">
                <div className={`relative bg-neutral-100 ${i === 0 ? 'aspect-[21/9]' : 'aspect-[16/10]'}`}>
                  <Blob id={p.id} className="h-full w-full" size="sm" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bebas text-[48px] text-white uppercase tracking-wider">{p.title?.charAt(0)}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-neutral-400">
                    <span>{p.category || 'General'}</span>
                    <span>·</span>
                    <span>{p.episode_count || 0} episodes</span>
                  </div>
                  <h2 className="mt-2 font-bebas text-[24px] uppercase leading-tight tracking-wide text-neutral-900 md:text-[28px] group-hover:text-neutral-600 transition-colors">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="mt-2 text-[14px] leading-relaxed text-neutral-500 line-clamp-2">
                      {p.excerpt}
                    </p>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-900">
                    Read
                    <img src={lineIcon} alt="" className="h-1.5 w-auto" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
