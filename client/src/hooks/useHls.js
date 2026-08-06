import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { cloudinaryToPlayableUrl } from '../utils/videoUrl'

export default function useHls(src, retryKey = 0) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const retryRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    // Only ever hand the media element standard web protocols.
    if (typeof src === 'string' && !/^(https?:|blob:|file:)/.test(src)) {
      setError('Unsupported video source')
      return
    }

    setError(null)
    setIsReady(false)
    setCanPlay(false)

    // Cloudinary sources play the H.264 .mp4 directly (HLS/transcodes are
    // unreliable there). Only plain .m3u8 sources use hls.js.
    const isCloudinary = /cloudinary\.com/.test(src)
    const isPlainHls = /\.m3u8(\?|$)/.test(src) && !isCloudinary
    const transcodeSrc = isCloudinary ? cloudinaryToPlayableUrl(src) : src

    let destroyed = false

    let nativeCleanup = null

    const onReady = () => { if (!destroyed) setIsReady(true) }
    const onFrameReady = () => { if (!destroyed) setCanPlay(true) }

    const setupNative = (primarySrc, fallbackSrc = null) => {
      let attempts = 0
      let usingFallback = false
      const onLoadedData = () => { onReady(); onFrameReady() }
      const loadSrc = (s) => { video.src = s; video.load() }
      const onError = () => {
        if (destroyed) return
        const code = video.error ? video.error.code : 0
        // Unsupported codec -> swap to the H.264 transcoded URL, once.
        if (code === 4) {
          if (fallbackSrc && !usingFallback && fallbackSrc !== primarySrc) {
            usingFallback = true
            loadSrc(fallbackSrc)
            return
          }
          setError('Failed to load video')
          return
        }
        // Aborted by the browser (e.g. a newer load won) -> ignore.
        if (code === 1) return
        // Network / decode errors -> bounded retry of the same (active) source.
        attempts += 1
        if (attempts >= 3) { setError('Failed to load video'); return }
        clearTimeout(retryRef.current)
        retryRef.current = setTimeout(() => {
          if (destroyed) return
          loadSrc(usingFallback ? fallbackSrc : primarySrc)
        }, 900)
      }
      video.addEventListener('loadeddata', onLoadedData)
      video.addEventListener('canplay', onFrameReady)
      video.addEventListener('error', onError)
      loadSrc(primarySrc)
      return () => {
        destroyed = true
        clearTimeout(retryRef.current)
        video.removeEventListener('loadeddata', onLoadedData)
        video.removeEventListener('canplay', onFrameReady)
        video.removeEventListener('error', onError)
        video.removeAttribute('src')
        video.load()
      }
    }

    if (!isPlainHls || !Hls.isSupported()) {
      const nativeHandled = setupNative(src, isCloudinary ? transcodeSrc : null)
      return nativeHandled
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
      return setupNative(isCloudinary ? transcodeSrc : src)
    }

    hlsRef.current = hls

    let fallbackDone = false
    let fatalCount = 0

    const fallbackToNative = () => {
      if (fallbackDone || destroyed) return
      fallbackDone = true
      try { hls.destroy() } catch {}
      hlsRef.current = null
      video.removeEventListener('loadeddata', onFrameReady)
      video.removeEventListener('canplay', onFrameReady)
      nativeCleanup = setupNative(isCloudinary ? transcodeSrc : src)
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
      if (nativeCleanup) nativeCleanup()
      clearTimeout(retryRef.current)
      video.removeEventListener('loadeddata', onFrameReady)
      video.removeEventListener('canplay', onFrameReady)
      if (hlsRef.current) {
        try { hlsRef.current.destroy() } catch {}
        hlsRef.current = null
      }
    }
  }, [src, retryKey])

  return { videoRef, isReady, canPlay, error }
}