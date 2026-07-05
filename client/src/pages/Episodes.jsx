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
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.getEpisodes()
      .then(setAllEpisodes)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const episodes = allEpisodes.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="animate-fade-in py-12 mx-5 md:mx-20">
      <div className="mb-12">
        <h1 className="font-bebas text-[48px] uppercase leading-none tracking-[0.04em] text-neutral-900 md:text-[72px]">
          Episodes
        </h1>
        <p className="mt-3 text-[15px] text-neutral-500 font-light flex items-center gap-2">
          Explore all published episodes
          <span className="inline-flex border h-1.5 w-1.5 rounded-full bg-neutral-900" />
          {allEpisodes.length} episodes
        </p>
      </div>

      <div className="mb-10">
        <div className="relative max-w-md">
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
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-[14px] text-neutral-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-[13px] text-neutral-900 underline underline-offset-4 hover:text-neutral-600">
            Try again
          </button>
        </div>
      ) : episodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-[14px] text-neutral-400">No episodes found.</p>
        </div>
      ) : (
        <div className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {episodes.map((e, i) => {
            const thumb = e.banner_image || extractFirstImage(e.content)
            const initials = `EP${i + 1}`
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
                  <div className="h-[160px] flex flex-col justify-between gap-2">
                    <h2 className="mt-2 font-bebas text-[22px] uppercase  leading-tight tracking-wide text-neutral-900 line-clamp-2">
                      {e.title}
                    </h2>
                    <div className="flex items-center gap-2 text-[9px] uppercase  tracking-wider text-neutral-400">
                      <span>{new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {e.excerpt && (
                      <p className="text-[13px] font-novamono leading-[15px] text-neutral-500  line-clamp-2">
                        {e.excerpt}
                      </p>
                    )}
                    <div className="inline-flex items-center gap-2 bg-white px-15 py-2 text-[11px] font-medium text-[#777] border-[#777] border self-start">
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
