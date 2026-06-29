import { useState, useRef, useEffect, useCallback } from 'react'

function formatTime(s) {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoPlayer({ src, className = '' }) {
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [dragging, setDragging] = useState(false)

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || dragging) return
    setTime(v.currentTime)
  }

  const handleProgress = () => {
    const v = videoRef.current
    if (!v || !v.buffered.length) return
    setBuffered(v.buffered.end(v.buffered.length - 1))
  }

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const v = videoRef.current
    if (!v) return
    v.currentTime = pct * duration
    setTime(v.currentTime)
  }

  const handleMouseDown = (e) => {
    setDragging(true)
    handleSeek(e)
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => handleSeek(e)
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, duration])

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const handleVolume = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const v = videoRef.current
    if (!v) return
    v.volume = pct
    setVolume(pct)
    if (pct === 0) { v.muted = true; setMuted(true) }
    else if (v.muted) { v.muted = false; setMuted(false) }
  }

  const toggleFullscreen = () => {
    const el = videoRef.current?.parentElement
    if (!el) return
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen()
  }

  const progress = duration ? (time / duration) * 100 : 0
  const bufferedPct = duration ? (buffered / duration) * 100 : 0

  return (
    <div className={`group relative overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={(e) => setDuration(e.target.duration)}
        onProgress={handleProgress}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        className="w-full cursor-pointer"
        preload="metadata"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div
          ref={progressRef}
          className="relative mx-4 mt-3 h-1 cursor-pointer bg-white/20"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${bufferedPct}%` }} />
          <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100" style={{ left: `calc(${progress}% - 6px)` }} />
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-neutral-300">
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              )}
            </button>

            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-neutral-300">
                {muted || volume === 0 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                ) : volume < 0.5 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                )}
              </button>
              <div className="hidden w-20 cursor-pointer group-hover/vol:block" onClick={handleVolume}>
                <div className="relative h-1 bg-white/30">
                  <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${muted ? 0 : volume * 100}%` }} />
                </div>
              </div>
            </div>

            <span className="font-novamono text-[11px] text-white/70">
              {formatTime(time)} / {formatTime(duration)}
            </span>
          </div>

          <button onClick={toggleFullscreen} className="text-white hover:text-neutral-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
          </button>
        </div>
      </div>

      {!playing && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black transition-transform hover:scale-105">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
        </button>
      )}
    </div>
  )
}
