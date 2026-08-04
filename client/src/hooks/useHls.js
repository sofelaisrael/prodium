import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'

function toMp4(src) {
  if (!src) return src
  if (!/cloudinary\.com/.test(src)) return src
  if (/\.m3u8$/i.test(src)) return src.replace(/\.m3u8$/i, '.mp4')
  if (/\.(mov|avi|mkv|flv|wmv|webm|m4v)$/i.test(src)) {
    const mp4 = src.replace(/\.(mov|avi|mkv|flv|wmv|webm|m4v)$/i, '.mp4')
    if (!/\/video\/upload\//.test(mp4) || /f_mp4|w_\d+|q_auto/.test(mp4)) return mp4
    return mp4.replace('/video/upload/', '/video/upload/f_mp4,w_1920,c_limit,q_auto:good/')
  }
  return src
}

export default function useHls(src) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(null)
    setIsReady(false)
    setCanPlay(false)

    // Cloudinary sources play the H.264 .mp4 directly (HLS/transcodes are
    // unreliable there). Only plain .m3u8 sources use hls.js.
    const isCloudinary = /cloudinary\.com/.test(src)
    const isPlainHls = /\.m3u8(\?|$)/.test(src) && !isCloudinary
    const nativeSrc = isCloudinary ? toMp4(src) : src

    const onReady = () => setIsReady(true)
    const onFrameReady = () => setCanPlay(true)

    const setupNative = (initialSrc) => {
      const onError = () => setError('Failed to load video')
      video.src = initialSrc
      video.addEventListener('loadeddata', onReady)
      video.addEventListener('loadeddata', onFrameReady)
      video.addEventListener('canplay', onFrameReady)
      video.addEventListener('error', onError)
      return () => {
        video.removeEventListener('loadeddata', onReady)
        video.removeEventListener('loadeddata', onFrameReady)
        video.removeEventListener('canplay', onFrameReady)
        video.removeEventListener('error', onError)
        video.removeAttribute('src')
        video.load()
      }
    }

    if (!isPlainHls || !Hls.isSupported()) {
      return setupNative(nativeSrc)
    }

    const isNativeHls = video.canPlayType('application/vnd.apple.mpegurl')
    if (isNativeHls) {
      return setupNative(src)
    }

    let hls
    try {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 5,
        maxBufferLength: 4,
        maxMaxBufferLength: 8,
        startFragPrefetch: true,
        testBandwidth: false,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 2,
        manifestLoadingRetryDelay: 500,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
      })
    } catch {
      return setupNative(nativeSrc)
    }

    hlsRef.current = hls

    let destroyed = false
    let fallbackDone = false
    let fatalCount = 0

    const fallbackToNative = () => {
      if (fallbackDone || destroyed) return
      fallbackDone = true
      try { hls.destroy() } catch {}
      hlsRef.current = null
      video.removeEventListener('loadeddata', onFrameReady)
      video.removeEventListener('canplay', onFrameReady)
      setupNative(nativeSrc)
    }

    hls.loadSource(src)
    hls.attachMedia(video)

    video.addEventListener('loadeddata', onFrameReady)
    video.addEventListener('canplay', onFrameReady)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (destroyed) return
      setIsReady(true)
    })

    hls.on(Hls.Events.FRAG_LOADED, () => {
      if (destroyed) return
      fatalCount = 0
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (destroyed || fallbackDone) return

      if (data.fatal) {
        fatalCount += 1
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
            fallbackToNative()
            return
          }
          if (fatalCount >= 2) {
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

    hls.on(Hls.Events.MANIFEST_LOADED, (_, data) => {
      if (destroyed) return
      if (data.levels && data.levels.length === 0) {
        fallbackToNative()
      }
    })

    return () => {
      destroyed = true
      video.removeEventListener('loadeddata', onFrameReady)
      video.removeEventListener('canplay', onFrameReady)
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

  return { videoRef, isReady, canPlay, error, destroy }
}
