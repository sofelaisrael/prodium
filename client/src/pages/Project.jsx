import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import lineIcon from '../assets/line.svg'

function extractFirstImage(html) {
  if (!html) return null
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

export default function Project() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getProject(id).then(setProject).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-[14px] text-neutral-400">Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px] text-neutral-400">Project not found.</p>
        <Link to="/projects" className="mt-4 inline-block text-[14px] text-neutral-600 underline underline-offset-4 hover:text-neutral-900">
          Back to projects
        </Link>
      </div>
    )
  }

  const episodes = project.episodes || []

  return (
    <div className="py-12 px-5 md:mx-20">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        All Projects
      </Link>

      <header className="mt-8 mb-14">
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-neutral-400">
          <span>{project.category || 'General'}</span>
          <span>·</span>
          <span>{episodes.length} episodes</span>
        </div>
        <h1 className="mt-3 font-bebas text-[56px] uppercase leading-none tracking-[0.04em] text-neutral-900 md:text-[80px]">
          {project.title}
        </h1>
        {project.excerpt && (
          <p className="mt-5 text-[16px] leading-relaxed text-neutral-500 max-w-2xl font-light">
            {project.excerpt}
          </p>
        )}
      </header>

      {episodes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-[14px] text-neutral-400">No episodes yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-4">
          {episodes.map((e, i) => {
            const thumb = extractFirstImage(e.content)
            return (
              <Link
                key={e.id}
                to={`/episodes/${e.id}`}
                data-project={project.title?.slice(0, 2).toUpperCase()}
                className={`${i === 0 ? 'col-span-1 pl-4 episode-line' : ''}`}
              >
                <div className="overflow-hidden bg-white">
                  <div className={`relative bg-neutral-100 rounded-md border overflow-hidden ${i === 0 ? 'aspect-[21/15]' : 'aspect-[16/1]'}`}>
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-bebas text-[48px] text-neutral-200 uppercase tracking-wider">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-block bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-700 backdrop-blur-sm">
                        {e.reading_time} min read
                      </span>
                    </div>
                  </div>
                  <div className="">
                    <h2 className={`mt-2 font-bebas uppercase leading-tight tracking-wide text-neutral-900 ${i === 0 ? 'text-[28px] md:text-[32px]' : 'text-[22px]'}`}>
                      {e.title}
                    </h2>
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-neutral-400">
                      <span>{new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    
                    {e.excerpt && (
                      <p className="mt-2 text-[14px] leading-relaxed text-neutral-500 line-clamp-2">
                        {e.excerpt}
                      </p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-2 bg-white px-10 py-2 text-[13px] font-medium text-black border">
                      Read
                      <img src={lineIcon} alt="" className="h-1.5 w-auto" />
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
