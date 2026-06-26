import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function Episode() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getArticle(id).then(setArticle).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-[14px] text-neutral-400">Loading...</div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px] text-neutral-400">Episode not found.</p>
        <Link to="/episodes" className="mt-4 inline-block text-[14px] text-neutral-600 underline underline-offset-4 hover:text-neutral-900">
          Back to episodes
        </Link>
      </div>
    )
  }

  return (
    <article className="py-10 px-4 md:px-0">
      <div className="mb-10">
        <Link to="/episodes" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Episodes
        </Link>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-2 text-[13px] text-neutral-400">
          <span>{article.category || 'General'}</span>
          <span>·</span>
          <span>{article.reading_time} min read</span>
          <span>·</span>
          <span>{new Date(article.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <h1 className="mt-4 text-[32px] font-semibold leading-tight tracking-tight text-neutral-900 md:text-[40px]">
          {article.title}
        </h1>
      </header>

      <div className="prose prose-neutral prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />

      <footer className="mt-16 border-t border-neutral-100 pt-8">
        <Link to="/episodes" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          More episodes
        </Link>
      </footer>
    </article>
  )
}
