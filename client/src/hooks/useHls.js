import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'

function toHlsUrl(src) {
  if (!src) return src
  if (/\.m3u8(\?|$)/.test(src)) return src
  if (/cloudinary\.com/.test(src) && /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)(\?|$)/.test(src)) {
    return src.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)(\?|$)/, '.m3u8$1')
  }
  return src
}

export default function useHls(src) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(null)
    setIsReady(false)

    const hlsUrl = toHlsUrl(src)
    const isNativeHls = video.canPlayType('application/vnd.apple.mpegurl')

    if (isNativeHls) {
      video.src = hlsUrl
      const onReady = () => setIsReady(true)
      const onError = () => setError('Failed to load video')
      video.addEventListener('loadeddata', onReady)
      video.addEventListener('error', onError)
      return () => {
        video.removeEventListener('loadeddata', onReady)
        video.removeEventListener('error', onError)
        video.removeAttribute('src')
        video.load()
      }
    }

    if (!Hls.isSupported()) {
      video.src = src
      const onReady = () => setIsReady(true)
      const onError = () => setError('Failed to load video')
      video.addEventListener('loadeddata', onReady)
      video.addEventListener('error', onError)
      return () => {
        video.removeEventListener('loadeddata', onReady)
        video.removeEventListener('error', onError)
        video.removeAttribute('src')
        video.load()
      }
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 5,
      maxBufferLength: 10,
      maxMaxBufferLength: 20,
      startFragPrefetch: false,
      testBandwidth: false,
    })

    hlsRef.current = hls
    hls.loadSource(hlsUrl)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setIsReady(true)
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError()
        } else {
          setError('Playback error')
          hls.destroy()
        }
      }
    })

    return () => {
      hls.destroy()
      hlsRef.current = null
    }
  }, [src])

  const destroy = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }, [])

  return { videoRef, isReady, error, destroy }
}
