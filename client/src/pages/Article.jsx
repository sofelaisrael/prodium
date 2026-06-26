import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, trackView } from '../api'

export default function Article() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackView(`/articles/${id}`)
  }, [id])

  useEffect(() => {
    setLoading(true)
    api.getArticle(id).then(setArticle).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const readingTime = (html) => {
    if (!html) return 1
    const text = html.replace(/<[^>]*>/g, ' ')
    const words = text.split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>
  if (!article) return <p className="text-sm text-gray-400">Article not found.</p>

  return (
    <div className="space-y-8">
      <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">&larr; Back</Link>

      <article>
        <h1 className="text-3xl font-bold">{article.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-gray-400">
          <span>{article.category || 'General'}</span>
          <span>{article.reading_time || readingTime(article.content)} min read</span>
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
        </div>
        <div className="mt-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>
    </div>
  )
}
