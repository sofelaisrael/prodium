import { useState, useRef, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import VideoPlayer from './VideoPlayer'

function Skeleton() {
  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-neutral-100" style={{ aspectRatio: '16 / 9' }}>
      <div className="media-skeleton" />
    </div>
  )
}

function LazyVideoPlayer({ src }) {
  const [visible, setVisible] = useState(false)
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
      { rootMargin: '0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="my-6 overflow-hidden rounded-lg" style={{ maxHeight: '80vh' }}>
      {!visible && <Skeleton />}
      {visible && <VideoPlayer src={src} />}
    </div>
  )
}

function assignLetters(rows, start) {
  let idx = start
  rows.forEach(r => r.forEach((cell, ci) => {
    if (cell === 'x') {
      const letter = String.fromCharCode(97 + idx)
      r[ci] = letter
      idx++
    }
  }))
}

function galleryAreas(layout, count) {
  switch (layout) {
    case 'featured': {
      const rows = [['a', 'a', 'b'], ['a', 'a', 'c']]
      let rest = count - 3
      while (rest > 0) {
        const row = ['.', '.', '.']
        for (let c = 0; c < 3 && rest > 0; c++, rest--) row[c] = 'x'
        rows.push(row)
      }
      assignLetters(rows, 3)
      return { columns: 3, rows }
    }
    case 'vertical': {
      if (count <= 2) return { columns: 2, rows: [['a', 'b'], ['a', '.']] }
      if (count === 3) return { columns: 2, rows: [['a', 'b'], ['a', 'c']] }
      const rows = [['a', 'b'], ['a', 'c'], ['a', 'd']]
      let rest = count - 4
      while (rest > 0) {
        const row = ['.', '.']
        for (let c = 0; c < 2 && rest > 0; c++, rest--) row[c] = 'x'
        rows.push(row)
      }
      assignLetters(rows, 4)
      return { columns: 2, rows }
    }
    case 'horizontal': {
      if (count <= 2) return { columns: 2, rows: [['a', 'a'], ['b', '.']] }
      const rows = [['a', 'a', 'a']]
      let rest = count - 1
      while (rest > 0) {
        const row = ['.', '.', '.']
        for (let c = 0; c < 3 && rest > 0; c++, rest--) row[c] = 'x'
        rows.push(row)
      }
      assignLetters(rows, 1)
      return { columns: 3, rows }
    }
    default:
      return null
  }
}

function galleryGrid(layout, columns, count) {
  if (layout === 'grid') {
    return {
      css: { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '0.5rem', margin: '1.5em 0' },
      areas: null,
    }
  }
  const data = galleryAreas(layout, count)
  if (!data) return galleryGrid('grid', columns, count)
  const letters = []
  data.rows.forEach(r => r.forEach(c => { if (c && c !== '.' && !letters.includes(c)) letters.push(c) }))
  return {
    css: {
      display: 'grid',
      gridTemplateColumns: `repeat(${data.columns}, 1fr)`,
      gridTemplateAreas: data.rows.map(r => `"${r.map(c => c || '.').join(' ')}"`).join(' '),
      gridAutoRows: 'minmax(0, 1fr)',
      aspectRatio: `${data.columns} / ${data.rows.length}`,
      gap: '0.5rem',
      margin: '1.5em 0',
    },
    areas: letters,
  }
}

function galleryCssString(css) {
  return Object.entries(css).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';')
}

export default function useLazyVideos() {
  const ref = useRef(null)

  const init = useCallback(() => {
    const container = ref.current
    if (!container) return

    const videos = container.querySelectorAll('video:not([data-lazy-init]):not([data-vplayer-video])')
    videos.forEach(video => {
      video.setAttribute('data-lazy-init', 'true')
      const src = video.getAttribute('src')
      if (!src) return

      const wrapper = document.createElement('div')
      video.parentNode.insertBefore(wrapper, video)
      video.remove()

      createRoot(wrapper).render(<LazyVideoPlayer src={src} />)
    })

    const galleries = container.querySelectorAll('[data-type="imageGallery"]:not([data-gallery-init])')
    galleries.forEach(gallery => {
      gallery.setAttribute('data-gallery-init', 'true')
      let images = []
      let columns = 2
      let layout = 'grid'
      try {
        images = JSON.parse(gallery.getAttribute('data-images') || '[]')
        columns = parseInt(gallery.getAttribute('data-columns')) || 2
        layout = gallery.getAttribute('data-layout') || 'grid'
      } catch {}

      if (!images.length) return

      const { css, areas } = galleryGrid(layout, columns, images.length)
      const grid = document.createElement('div')
      grid.className = 'image-gallery'
      grid.style.cssText = galleryCssString(css)

      images.forEach((img, i) => {
        const wrap = document.createElement('div')
        wrap.style.cssText = areas
          ? `grid-area:${areas[i]};position:relative;overflow:hidden;border-radius:0.5rem;background-color:rgb(229 229 229)`
          : 'position:relative;overflow:hidden;border-radius:0.5rem;background-color:rgb(229 229 229);aspect-ratio:1'

        const skeleton = document.createElement('div')
        skeleton.className = 'media-skeleton'
        wrap.appendChild(skeleton)

        const el = document.createElement('img')
        el.src = img.src
        el.alt = img.alt || ''
        el.loading = 'lazy'
        el.style.cssText = 'position:relative;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.4s ease'
        const reveal = () => {
          el.style.opacity = '1'
          skeleton.remove()
        }
        if (el.complete && el.naturalWidth > 0) {
          reveal()
        } else if (el.complete) {
          reveal()
        } else {
          el.addEventListener('load', reveal)
          el.addEventListener('error', reveal)
        }
        wrap.appendChild(el)
        grid.appendChild(wrap)
      })

      gallery.replaceWith(grid)
    })

    const contentImages = container.querySelectorAll('.prose img')
    contentImages.forEach(img => {
      if (img.closest('.image-gallery')) return
      if (img.getAttribute('data-img-fade')) return
      img.setAttribute('data-img-fade', 'true')
      if (img.complete && img.naturalWidth > 0) return
      img.style.opacity = '0'
      img.style.transition = 'opacity 0.4s ease'
      img.style.backgroundColor = 'rgb(245 245 245)'
      const reveal = () => {
        img.style.opacity = '1'
        img.style.backgroundColor = 'transparent'
      }
      if (img.complete) {
        reveal()
      } else {
        img.addEventListener('load', reveal)
        img.addEventListener('error', reveal)
      }
    })
  }, [])

  useEffect(() => {
    init()
    const container = ref.current
    if (!container) return
    const observer = new MutationObserver(init)
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  })

  return ref
}
