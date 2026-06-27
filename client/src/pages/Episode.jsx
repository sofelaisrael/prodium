import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function Episode() {
  const { id } = useParams()
  const [episode, setEpisode] = useState(null)
  const [prevNext, setPrevNext] = useState({ prev: null, next: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getEpisode(id)
      .then(async (ep) => {
        setEpisode(ep)
        if (ep.project_id) {
          const episodes = await api.getProjectEpisodes(ep.project_id)
          const idx = episodes.findIndex(e => e.id === ep.id)
          setPrevNext({
            prev: idx > 0 ? episodes[idx - 1] : null,
            next: idx < episodes.length - 1 ? episodes[idx + 1] : null
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-[14px] text-neutral-400">Loading...</div>
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px] text-neutral-400">Episode not found.</p>
        <Link to="/projects" className="mt-4 inline-block text-[14px] text-neutral-600 underline underline-offset-4 hover:text-neutral-900">
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="md:mx-20 py-6">
      <Link to={`/projects/${episode.project_id}`} className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to project
      </Link>

      <header className="mt-6 mb-8">
        <div className="flex items-center gap-2 text-[13px] text-neutral-400">
          <span>{episode.reading_time} min read</span>
          <span>·</span>
          <span>{new Date(episode.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <h1 className="mt-2 font-bebas text-[48px] uppercase leading-none tracking-[0.04em] text-neutral-900 md:text-[64px]">
          {episode.title}
        </h1>
      </header>

      <div className="rounded-2xl border border-black p-6 md:p-10">
        <div className="prose prose-neutral prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: episode.content }} />
      </div>

      <div className="flex items-center justify-between mt-8 py-4">
        {prevNext.prev ? (
          <Link to={`/episodes/${prevNext.prev.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-5 py-2.5 text-[13px] text-neutral-600 hover:border-neutral-900 hover:text-neutral-900">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Previous
          </Link>
        ) : <span />}
        {prevNext.next ? (
          <Link to={`/episodes/${prevNext.next.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-5 py-2.5 text-[13px] text-neutral-600 hover:border-neutral-900 hover:text-neutral-900">
            Next
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
