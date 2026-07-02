import { useState, useRef, useEffect } from 'react'

function formatTime(s) {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoPlayer({ src, className = '' }) {
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const containerRef = useRef(null)
  const hideTimer = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showVolume, setShowVolume] = useState(false)

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
    const el = containerRef.current
    if (!el) return
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen()
  }

  const handleMouseMove = () => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  const handleMouseLeave = () => {
    if (playing && !dragging) {
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setShowControls(false), 1000)
    }
  }

  useEffect(() => {
    return () => clearTimeout(hideTimer.current)
  }, [])

  const progress = duration ? (time / duration) * 100 : 0
  const bufferedPct = duration ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden bg-black ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
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

      {/* Center play button */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${!playing ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105 pointer-events-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-all duration-300 ${
          showControls || !playing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-3 px-4">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1 cursor-pointer bg-white/20 rounded-full mb-3 group/bar"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: `${progress}%` }} />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
              )}
            </button>

            {/* Time */}
            <span className="text-[12px] text-white/70 tabular-nums font-mono">
              {formatTime(time)}<span className="text-white/40 mx-1">/</span>{formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Volume */}
            <div
              className="relative flex items-center gap-2"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                {muted || volume === 0 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : volume < 0.5 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${showVolume ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}
                onClick={handleVolume}
              >
                <div className="relative h-1 bg-white/30 rounded-full cursor-pointer">
                  <div className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: `${muted ? 0 : volume * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
