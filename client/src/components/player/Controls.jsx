import { useState, useRef, useEffect } from 'react'

function formatTime(s) {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function VolumeIcon({ volume, muted }) {
  if (muted || volume === 0) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  )
}

export default function Controls({ playing, currentTime, duration, volume, muted, onPlayPause, onVolumeChange, onToggleMute, containerRef }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const volumeTimeout = useRef(null)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    const el = containerRef?.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen()
    }
  }

  const handleVolumeEnter = () => {
    clearTimeout(volumeTimeout.current)
    setShowVolume(true)
  }

  const handleVolumeLeave = () => {
    volumeTimeout.current = setTimeout(() => setShowVolume(false), 300)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-3 pb-4 pt-8 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <button onClick={onPlayPause} className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-transform">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <span className="text-white text-[12px] font-novamono tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        <div
          className="relative flex items-center"
          onMouseEnter={handleVolumeEnter}
          onMouseLeave={handleVolumeLeave}
        >
          <button onClick={onToggleMute} className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-transform">
            <VolumeIcon volume={volume} muted={muted} />
          </button>

          {showVolume && (
            <div className="absolute bottom-full right-0 mb-2 bg-black/80 rounded-lg px-2 py-2 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          )}
        </div>

        <button onClick={toggleFullscreen} className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-transform">
          {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>
      </div>
    </div>
  )
}
