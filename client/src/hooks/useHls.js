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

    const setupNative = (fallbackSrc) => {
      video.src = fallbackSrc
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

    const isNativeHls = video.canPlayType('application/vnd.apple.mpegurl')
    if (isNativeHls) {
      return setupNative(hlsUrl)
    }

    if (!Hls.isSupported()) {
      return setupNative(src)
    }

    let hls
    try {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 5,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        startFragPrefetch: false,
        testBandwidth: false,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 500,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
      })
    } catch {
      return setupNative(src)
    }

    hlsRef.current = hls

    let destroyed = false
    let fallbackDone = false

    const fallbackToNative = () => {
      if (fallbackDone || destroyed) return
      fallbackDone = true
      try { hls.destroy() } catch {}
      hlsRef.current = null
      setupNative(src)
    }

    hls.loadSource(hlsUrl)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (destroyed) return
      setIsReady(true)
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (destroyed || fallbackDone) return

      if (data.fatal) {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
            fallbackToNative()
            return
          }
          hls.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try {
            hls.recoverMediaError()
          } catch {
            fallbackToNative()
          }
        } else {
          fallbackToNative()
        }
      }
    })

    hls.on(Hls.Events.MANIFEST_LOADING, () => {})

    hls.on(Hls.Events.MANIFEST_LOADED, (_, data) => {
      if (destroyed) return
      if (data.levels && data.levels.length === 0) {
        fallbackToNative()
      }
    })

    return () => {
      destroyed = true
      if (hlsRef.current) {
        try { hlsRef.current.destroy() } catch {}
        hlsRef.current = null
      }
    }
  }, [src])

  const destroy = useCallback(() => {
    if (hlsRef.current) {
      try { hlsRef.current.destroy() } catch {}
      hlsRef.current = null
    }
  }, [])

  return { videoRef, isReady, error, destroy }
}
