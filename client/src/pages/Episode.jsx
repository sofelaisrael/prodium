import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import lineIcon from '../assets/line.svg'
import useLazyVideos from '../components/LazyVideo'
import Loader from '../components/Loader'

export default function Episode() {
  const { id } = useParams()
  const [episode, setEpisode] = useState(null)
  const [prevNext, setPrevNext] = useState({ prev: null, next: null })
  const [loading, setLoading] = useState(true)
  const contentRef = useLazyVideos()

  useEffect(() => {
    setLoading(true)
    api.getEpisode(id)
      .then(async (ep) => {
        setEpisode(ep)
        const all = await api.getEpisodes()
        const idx = all.findIndex(e => e.id === ep.id)
        setPrevNext({
          prev: idx > 0 ? all[idx - 1] : null,
          next: idx < all.length - 1 ? all[idx + 1] : null
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader />
      </div>
    )
  }

  if (!episode) {
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
    <div className="animate-fade-in md:mx-20 py-6">
      <Link to="/episodes" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        All Episodes
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

      {episode.banner_image && (
        <div className="mb-8 overflow-hidden rounded-2xl">
          <img src={episode.banner_image} alt="" className="w-full aspect-[21/9] object-cover" />
        </div>
      )}

      <div className="rounded-2xl border-10 border-black p-6 md:p-10">
        <div ref={contentRef} className="prose prose-neutral prose-lg font-novamono max-w-none" dangerouslySetInnerHTML={{ __html: episode.content }} />
      </div>

      <div className="flex items-center gap-5 mt-8 py-4">
          {prevNext.prev ? (
            <Link to={`/episodes/${prevNext.prev.id}`} className="flex items-center gap-2 border border-neutral-300 px-10 py-2.5 text-[13px] text-black hover:border-neutral-900 hover:text-neutral-900">
              Read Previous Episode
              <img src={lineIcon} alt="" className="h-2 w-auto" />
            </Link>
          ) : (
            <span className="flex items-center gap-2 border border-neutral-200 px-10 py-2.5 text-[13px] text-neutral-300 cursor-not-allowed">
              Read Previous Episode
              <img src={lineIcon} alt="" className="h-2 w-auto opacity-40" />
            </span>
          )}
          {prevNext.next ? (
            <Link to={`/episodes/${prevNext.next.id}`} className="flex items-center gap-2 bg-black text-white border border-neutral-300 px-10 py-2.5 text-[13px]">
              Read Next Episode
              <img src={lineIcon} alt="" className="h-2 invert w-auto" />
            </Link>
          ) : (
            <span className="flex items-center gap-2 border border-neutral-200 bg-gray-600 px-10 py-2.5 text-[13px] text-neutral-300 cursor-not-allowed">
              Read Next Episode
              <img src={lineIcon} alt="" className="h-2 w-auto invert opacity-40" />
            </span>
          )}
      </div>
    </div>
  )
}
