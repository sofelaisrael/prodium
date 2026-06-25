import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Home() {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.trackView('/')
  }, [])

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
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">
          Search
        </button>
      </form>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-3 py-1 text-xs ${!category ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.name}
              onClick={() => setCategory(c.name)}
              className={`rounded-full px-3 py-1 text-xs ${category === c.name ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c.name} ({c.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-400">No articles found.</p>
      ) : (
        <div className="space-y-4">
          {articles.map(a => (
            <Link
              key={a.id}
              to={`/articles/${a.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 hover:border-gray-300"
            >
              <h2 className="text-lg font-semibold">{a.title}</h2>
              {a.excerpt && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{a.excerpt}</p>}
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <span>{a.category || 'General'}</span>
                <span>{a.reading_time} min read</span>
                <span>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
