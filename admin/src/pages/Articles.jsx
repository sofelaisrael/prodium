import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.getArticles()
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const togglePublish = async (article) => {
    await api.updateArticle(article.id, { published: !article.published })
    load()
  }

  const deleteArticle = async (id) => {
    if (!confirm('Delete this article?')) return
    await api.deleteArticle(id)
    load()
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Articles</h1>
        <Link to="/articles/new" className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">
          New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-gray-400">No articles yet.</p>
      ) : (
        <div className="space-y-2">
          {articles.map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link to={`/articles/${a.id}/edit`} className="text-sm font-medium hover:underline">
                  {a.title}
                </Link>
                <p className="text-xs text-gray-400">{a.category || 'Uncategorized'} &middot; {new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => togglePublish(a)}
                  className={`text-xs px-2 py-1 rounded ${a.published ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {a.published ? 'Published' : 'Draft'}
                </button>
                <Link to={`/articles/${a.id}/edit`} className="text-xs text-gray-400 hover:text-gray-600">Edit</Link>
                <button onClick={() => deleteArticle(a.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
