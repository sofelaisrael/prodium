import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import lineIcon from '../assets/line.svg'
import backlineIcon from '../assets/backline.svg'
import useLazyVideos from '../components/LazyVideo'
import Loader from '../components/Loader'

export default function Episode() {
  const { id } = useParams()
  const [episode, setEpisode] = useState(null)
  const [prevNext, setPrevNext] = useState({ prev: null, next: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const contentRef = useLazyVideos()

  useEffect(() => {
    setLoading(true)
    setError('')
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
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px] text-neutral-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-[13px] text-neutral-900 underline underline-offset-4 hover:text-neutral-600">
          Try again
        </button>
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
    <div className="animate-fade-in mx-5 md:mx-20 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Link to="/episodes" className="inline-flex items-center justify-center h-10 w-10 hover:opacity-70 transition-opacity" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            <img src={backlineIcon} alt="" className="h-3 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {prevNext.prev ? (
              <Link to={`/episodes/${prevNext.prev.id}`} className="flex h-7 w-7 md:h-[28px] md:w-[28px] items-center justify-center rounded-full border border-black transition-colors hover:bg-black hover:text-white">
                <img src={backlineIcon} alt="" className="h-1.5 w-auto" />
              </Link>
            ) : (
              <span className="flex h-7 w-7 md:h-[28px] md:w-[28px] cursor-not-allowed items-center justify-center rounded-full border border-neutral-200 text-neutral-300">
                <img src={backlineIcon} alt="" className="h-1.5 w-auto opacity-40" />
              </span>
            )}
            {prevNext.next ? (
              <Link to={`/episodes/${prevNext.next.id}`} className="flex h-7 w-7 md:h-[28px] md:w-[28px] items-center justify-center rounded-full border border-black transition-colors hover:bg-black hover:text-white">
                <img src={backlineIcon} alt="" className="h-1.5 w-auto scale-x-[-1]" />
              </Link>
            ) : (
              <span className="flex h-7 w-7 md:h-[28px] md:w-[28px] cursor-not-allowed items-center justify-center rounded-full border border-neutral-200 text-neutral-300">
                <img src={backlineIcon} alt="" className="h-1.5 w-auto scale-x-[-1] opacity-40" />
              </span>
            )}
          </div>
        </div>
        <div className="mt-[31px] md:mt-[81px]">
          <h1 className="font-bebas text-[36px] md:text-[64px] uppercase leading-none tracking-[0.0022em]" style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {episode.title}
          </h1>
        </div>
      </header>

      {/* Content card - black border with inner gray */}
      <div className="rounded-[17px] bg-black p-2 md:p-[17px]">
        <div className="rounded-[17px] bg-[#F8F8F8] p-5 md:p-10">
          {/* Content */}
          <div ref={contentRef} className="prose prose-neutral prose-lg font-novamono max-w-none" dangerouslySetInnerHTML={{ __html: episode.content }} />
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center gap-3 mt-8 py-4 sm:gap-5">
        {prevNext.prev ? (
          <Link to={`/episodes/${prevNext.prev.id}`} className="flex items-center justify-center gap-2 border border-black px-4 py-2.5 text-[11px] text-black hover:bg-black hover:text-white transition-colors rounded-none sm:px-10 sm:py-2.5 sm:text-[16px]">
            Previous Episode
            <img src={lineIcon} alt="" className="h-2 w-auto" />
          </Link>
        ) : (
          <span className="flex items-center justify-center gap-2 border border-neutral-200 px-4 py-2.5 text-[11px] text-neutral-300 cursor-not-allowed rounded-none sm:px-10 sm:py-2.5 sm:text-[16px]">
            Previous Episode
            <img src={lineIcon} alt="" className="h-2 w-auto opacity-40" />
          </span>
        )}
        {prevNext.next ? (
          <Link to={`/episodes/${prevNext.next.id}`} className="flex items-center justify-center gap-2 bg-black text-white border border-black px-4 py-2.5 text-[11px] rounded-none hover:bg-neutral-800 transition-colors sm:px-10 sm:py-2.5 sm:text-[16px]">
            Next Episode
            <img src={lineIcon} alt="" className="h-2 invert w-auto" />
          </Link>
        ) : (
          <span className="flex items-center justify-center gap-2 bg-neutral-400 text-neutral-300 border border-neutral-300 px-4 py-2.5 text-[11px] cursor-not-allowed rounded-none sm:px-10 sm:py-2.5 sm:text-[16px]">
            Next Episode
            <img src={lineIcon} alt="" className="h-2 w-auto invert opacity-40" />
          </span>
        )}
      </div>
    </div>
  )
}
