import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Blob from '../components/Blob'
import lineIcon from '../assets/line.svg'
import Loader from '../components/Loader'

function extractFirstImage(html) {
  if (!html) return null
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

export default function Episodes() {
  const [allEpisodes, setAllEpisodes] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getEpisodes().then(all => {
      setAllEpisodes(all)
      const cats = [...new Set(all.map(e => e.category).filter(Boolean))]
      setCategories(cats.map(name => ({ name, count: all.filter(e => e.category === name).length })))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const episodes = allEpisodes.filter(e => {
    if (category && e.category !== category) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="animate-fade-in py-12 px-5 md:mx-20">
      <div className="mb-12">
        <h1 className="font-bebas text-[48px] uppercase leading-none tracking-[0.04em] text-neutral-900 md:text-[72px]">
          Episodes
        </h1>
        <p className="mt-3 text-[15px] text-neutral-500 font-light">Explore all published episodes.</p>
      </div>

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search episodes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full border border-neutral-200 bg-white pl-9 pr-4 text-[14px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
          />
        </div>

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
        <Loader />
      ) : episodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-[14px] text-neutral-400">No episodes found.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {episodes.map((e, i) => {
            const thumb = e.banner_image || extractFirstImage(e.content)
            const initials = (e.category || 'General').slice(0, 2).toUpperCase()
            return (
              <Link
                key={e.id}
                to={`/episodes/${e.id}`}
                data-project={initials}
                className="col-span-1 pl-4 episode-line"
              >
                <div className="overflow-hidden bg-white">
                  <div className="relative bg-neutral-100 rounded-md border overflow-hidden aspect-[16/10]">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Blob id={e.id} className="h-full w-full" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {!thumb && (
                      <div className="absolute top-3 left-3">
                        <span className="font-bebas text-[24px] text-white uppercase tracking-wider">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                  <div className="h-[160px] flex flex-col">
                    <h2 className="mt-1 font-bebas text-[22px] uppercase leading-tight tracking-wide text-neutral-900 line-clamp-2">
                      {e.title}
                    </h2>
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-neutral-400">
                      <span>{new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {e.excerpt && (
                      <p className="text-[13px] font-novamono leading-[15px] text-neutral-500 line-clamp-2">
                        {e.excerpt}
                      </p>
                    )}
                    <div className="mt-auto inline-flex items-center gap-2 bg-white px-15 py-2 text-[11px] font-medium text-[#777] border-[#777] border self-start">
                      Read
                      <img src={lineIcon} alt="" className="h-1 w-auto" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
