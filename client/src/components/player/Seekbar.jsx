import { useRef, useState, useCallback } from 'react'

export default function Seekbar({ currentTime, duration, buffered, onSeek }) {
  const barRef = useRef(null)
  const [hovering, setHovering] = useState(false)
  const [hoverX, setHoverX] = useState(0)
  const [hoverTime, setHoverTime] = useState(0)
  const [dragging, setDragging] = useState(false)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

  const getTimeFromX = useCallback((clientX) => {
    const rect = barRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return (x / rect.width) * duration
  }, [duration])

  const formatTime = (s) => {
    if (!s || !isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleMouseMove = (e) => {
    const rect = barRef.current.getBoundingClientRect()
    setHoverX(e.clientX - rect.left)
    setHoverTime(getTimeFromX(e.clientX))
    if (dragging) {
      onSeek(getTimeFromX(e.clientX))
    }
  }

  const handleMouseDown = (e) => {
    setDragging(true)
    onSeek(getTimeFromX(e.clientX))
    const onUp = () => {
      setDragging(false)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mouseup', onUp)
  }

  const handleTouchStart = (e) => {
    setDragging(true)
    onSeek(getTimeFromX(e.touches[0].clientX))
  }

  const handleTouchMove = (e) => {
    if (dragging) {
      onSeek(getTimeFromX(e.touches[0].clientX))
    }
  }

  return (
    <div
      ref={barRef}
      className="absolute bottom-0 left-0 right-0 z-10 h-5 flex items-end cursor-pointer group/seek"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setDragging(false) }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setDragging(false)}
    >
      {/* Background track */}
      <div className="absolute bottom-2 left-0 right-0 h-[3px] group-hover/seek:h-[5px] transition-all bg-white/20 rounded-full overflow-hidden">
        {/* Buffered */}
        <div
          className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Played */}
        <div
          className="absolute inset-y-0 left-0 bg-white rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hover thumb */}
      {(hovering || dragging) && duration > 0 && (
        <div
          className="absolute bottom-4 -translate-x-1/2 bg-black/80 text-white text-[11px] font-novamono px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap"
          style={{ left: `${hoverX}px` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Scrub thumb */}
      <div
        className="absolute bottom-[5px] -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `${progress}%` }}
      />
    </div>
  )
}
