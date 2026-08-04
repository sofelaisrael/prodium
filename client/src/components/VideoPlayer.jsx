import { useState, useRef, useEffect, useCallback } from 'react'
import useHls from '../hooks/useHls'
import Seekbar from './player/Seekbar'
import Controls from './player/Controls'

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
    </div>
  )
}

function VideoSkeleton() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-neutral-100">
      <div className="media-skeleton" />
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
  const { videoRef, isReady, canPlay, error } = useHls(src)

  const posterSrc = (() => {
    if (!src || !/cloudinary\.com/.test(src)) return undefined
    return src.replace(/\.(mp4|mov|avi|mkv|flv|wmv|webm|m4v)([?#].*)?$/i, '.jpg')
  })()

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [aspect, setAspect] = useState(null)

  const hideTimer = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateAspect = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspect(video.videoWidth / video.videoHeight)
      }
    }
    updateAspect()

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
    video.addEventListener('loadedmetadata', updateAspect)
    video.addEventListener('resize', updateAspect)

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
      video.removeEventListener('loadedmetadata', updateAspect)
      video.removeEventListener('resize', updateAspect)
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
    if (!video || !canPlay) return
    if (video.paused) {
      video.play().catch(() => {})
      setHasStarted(true)
      setControlsVisible(true)
    } else {
      video.pause()
    }
  }, [videoRef, canPlay])

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
      className={`relative group overflow-hidden ${className} ${!canPlay ? 'bg-neutral-100' : 'bg-black'}`}
      onMouseMove={showControls}
      onMouseLeave={() => { if (playing) setControlsVisible(false) }}
      style={{ maxHeight: '80vh', aspectRatio: aspect ? `${aspect}` : '16 / 9' }}
    >
      <video
        ref={videoRef}
        data-vplayer-video
        preload="metadata"
        poster={posterSrc}
        className={`w-full max-h-[80vh] object-cover cursor-pointer transition-opacity duration-500 ${canPlay || posterSrc ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        onClick={togglePlay}
      />

      {!canPlay && !posterSrc && <VideoSkeleton />}

      {!hasStarted && canPlay && <BigPlayButton onClick={togglePlay} />}

      {isBuffering && hasStarted && isReady && <LoadingSpinner />}

      {controlsVisible && hasStarted && canPlay && (
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
