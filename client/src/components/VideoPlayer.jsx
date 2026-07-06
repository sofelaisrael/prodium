import { useState, useRef, useEffect, useCallback } from 'react'
import useHls from '../hooks/useHls'
import Seekbar from './player/Seekbar'
import Controls from './player/Controls'

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  )
}

function BigPlayButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute inset-0 z-10 flex items-center justify-center group/play"
    >
      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#171717">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  )
}

export default function VideoPlayer({ src, className = '' }) {
  const containerRef = useRef(null)
  const { videoRef, isReady, error } = useHls(src)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const hideTimer = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    const onDurationChange = () => setDuration(video.duration)
    const onVolumeChange = () => {
      setVolume(video.volume)
      setMuted(video.muted)
    }
    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => setIsBuffering(false)
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const onEnded = () => {
      setPlaying(false)
      setControlsVisible(true)
      setIsBuffering(false)
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('volumechange', onVolumeChange)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('progress', onProgress)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('volumechange', onVolumeChange)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('ended', onEnded)
    }
  }, [isReady])

  const showControls = useCallback(() => {
    if (!hasStarted) return
    setControlsVisible(true)
    clearTimeout(hideTimer.current)
    if (playing) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000)
    }
  }, [playing, hasStarted])

  useEffect(() => {
    if (!hasStarted) return
    if (playing) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000)
    } else {
      setControlsVisible(true)
    }
    return () => clearTimeout(hideTimer.current)
  }, [playing, hasStarted])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      setHasStarted(true)
      setControlsVisible(true)
    } else {
      video.pause()
    }
  }, [videoRef])

  const seekTo = useCallback((time) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setCurrentTime(time)
  }, [videoRef])

  const handleVolumeChange = useCallback((val) => {
    const video = videoRef.current
    if (!video) return
    video.volume = val
    if (val > 0) video.muted = false
  }, [videoRef])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
  }, [videoRef])

  if (error) {
    return (
      <div className={`relative bg-neutral-100 flex items-center justify-center ${className}`} style={{ minHeight: 200 }}>
        <p className="text-sm text-neutral-500">{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${className}`}
      onMouseMove={showControls}
      onMouseLeave={() => { if (playing) setControlsVisible(false) }}
      style={{ maxHeight: '80vh' }}
    >
      <video
        ref={videoRef}
        className="w-full max-h-[80vh] object-cover cursor-pointer"
        playsInline
        onClick={togglePlay}
      />

      {!hasStarted && isReady && <BigPlayButton onClick={togglePlay} />}

      {isBuffering && hasStarted && isReady && <LoadingSpinner />}

      {controlsVisible && hasStarted && isReady && (
        <>
          <Seekbar
            currentTime={currentTime}
            duration={duration}
            buffered={buffered}
            onSeek={seekTo}
          />
          <Controls
            playing={playing}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            muted={muted}
            onPlayPause={togglePlay}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            containerRef={containerRef}
          />
        </>
      )}
    </div>
  )
}
