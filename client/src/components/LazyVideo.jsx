import { useState, useRef, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import VideoPlayer from './VideoPlayer'

function Skeleton() {
  return (
    <div className="relative w-full overflow-hidden bg-neutral-100" style={{ paddingBottom: '56.25%' }}>
      <div className="absolute inset-0 animate-pulse">
        <div className="absolute inset-0 bg-neutral-200" />
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-neutral-200/80 to-transparent" />
        <div className="absolute bottom-6 left-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-300" />
          <div className="h-1 flex-1 rounded bg-neutral-300" />
        </div>
        <div className="absolute bottom-6 right-6">
          <div className="h-4 w-20 rounded bg-neutral-300" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-neutral-300/60" />
        </div>
      </div>
    </div>
  )
}

function LazyVideoPlayer({ src }) {
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="my-6 overflow-hidden rounded-lg" style={{ maxHeight: '80vh' }}>
      {!visible && <Skeleton />}
      {visible && !loaded && (
        <>
          <Skeleton />
          <video
            src={src}
            onLoadedData={() => setLoaded(true)}
            className="hidden"
            preload="auto"
          />
        </>
      )}
      {visible && loaded && (
        <VideoPlayer src={src} />
      )}
    </div>
  )
}

export default function useLazyVideos() {
  const ref = useRef(null)

  const init = useCallback(() => {
    const container = ref.current
    if (!container) return

    const videos = container.querySelectorAll('video:not([data-lazy-init])')
    videos.forEach(video => {
      video.setAttribute('data-lazy-init', 'true')
      const src = video.getAttribute('src')
      if (!src) return

      const wrapper = document.createElement('div')
      video.parentNode.insertBefore(wrapper, video)
      video.remove()

      createRoot(wrapper).render(<LazyVideoPlayer src={src} />)
    })
  }, [])

  useEffect(() => {
    init()
    const observer = new MutationObserver(init)
    if (ref.current) observer.observe(ref.current, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [init])

  return ref
}
