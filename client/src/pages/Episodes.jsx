import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Loader from '../components/Loader'

export default function Episodes() {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (category) params.category = category
    api.getArticles(params).then(setArticles).catch(() => {}).finally(() => setLoading(false))
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
    <div className="animate-fade-in py-10 px-4 md:px-0">
      <div className="mb-10">
        <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900 md:text-[32px]">Episodes</h1>
        <p className="mt-2 text-[14px] text-neutral-500 md:text-[15px]">Explore all published episodes.</p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search episodes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-4 text-[14px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
          />
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('')}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                !category
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  category === c.name
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-[14px] text-neutral-400">No episodes found.</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {articles.map(a => (
            <Link
              key={a.id}
              to={`/episodes/${a.id}`}
              className="group block py-8"
            >
              <div className="flex items-center gap-2 text-[13px] text-neutral-400">
                <span>{a.category || 'General'}</span>
                <span>·</span>
                <span>{a.reading_time} min read</span>
                <span>·</span>
                <span>{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h2 className="mt-2 text-[20px] font-semibold text-neutral-900 group-hover:underline">
                {a.title}
              </h2>
              {a.excerpt && (
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 line-clamp-2">
                  {a.excerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
