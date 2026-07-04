import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import TipTap from '../components/TipTap'
import Modal from '../components/Modal'

export default function EpisodeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const dropdownRef = useRef(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [category, setCategory] = useState('')
  const [bannerImage, setBannerImage] = useState('')
  const [bannerUploading, setBannerUploading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const bannerRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState('')
  const [titleWarning, setTitleWarning] = useState('')
  const existingTitles = useRef([])

  useEffect(() => {
    if (!isNew) {
      api.getEpisode(id)
        .then(e => {
          setTitle(e.title || '')
          setContent(e.content || '')
          setPublished(e.published || false)
          setCategory(e.category || '')
          setBannerImage(e.banner_image || '')
        })
        .catch(() => navigate('/episodes'))
        .finally(() => setLoading(false))
    } else {
      api.getEpisodes().then(episodes => {
        existingTitles.current = episodes.map(e => e.title.toLowerCase())
      }).catch(() => {})
    }
  }, [id, isNew, navigate])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const trimmed = title.trim().toLowerCase()
    if (trimmed && existingTitles.current.includes(trimmed)) {
      setTitleWarning('An episode with this name already exists')
    } else {
      setTitleWarning('')
    }
  }, [title])

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerUploading(true)
    try {
      const result = await api.upload(file)
      setBannerImage(result.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setBannerUploading(false)
      e.target.value = ''
    }
  }

  const save = async (publishState) => {
    setSaving(true)
    setShowDropdown(false)
    try {
      const body = { title, content, published: publishState, category, banner_image: bannerImage || null }
      if (isNew) {
        await api.createEpisode(body)
        navigate('/episodes')
      } else {
        await api.updateEpisode(id, body)
        setPublished(publishState)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-sm text-neutral-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[740px]">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/episodes')}
          className="inline-flex items-center gap-1.5 text-[14px] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Episodes
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              showSettings ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            Settings
          </button>

          <div className="relative" ref={dropdownRef}>
            <div className="flex">
              <button
                onClick={() => save(isNew ? true : published)}
                disabled={saving || !title.trim()}
                className="rounded-l-full bg-neutral-900 px-4 py-2 font-novamono text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
              >
                {saving ? 'Saving...' : isNew ? 'Publish' : 'Save'}
              </button>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={saving}
                className="rounded-r-full border-l border-neutral-700 bg-neutral-900 px-2 py-2 text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-lg border border-neutral-100 bg-white py-1 shadow-lg">
                <button
                  onClick={() => save(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-novamono text-[13px] text-neutral-700 hover:bg-neutral-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  Publish
                </button>
                <button
                  onClick={() => save(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-novamono text-[13px] text-neutral-700 hover:bg-neutral-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  Save as draft
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/10" onClick={() => setShowSettings(false)}>
          <div
            className="mt-20 mr-8 w-[300px] rounded-xl border border-neutral-100 bg-white p-5 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="mb-4 text-[14px] font-semibold text-neutral-900">Episode settings</h3>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-[13px] text-neutral-500">Category</span>
              <input
                type="text"
                placeholder="e.g. Technology, Design"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[14px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-[13px] text-neutral-500">Banner image</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://... or upload"
                  value={bannerImage}
                  onChange={e => setBannerImage(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-[14px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none"
                />
                <input
                  ref={bannerRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bannerRef.current?.click()}
                  disabled={bannerUploading}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                >
                  {bannerUploading ? '...' : 'Upload'}
                </button>
              </div>
              {bannerImage && (
                <img src={bannerImage} alt="" className="mt-2 h-20 w-full rounded-lg object-cover border border-neutral-100" />
              )}
            </label>

            <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
              <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${
                published ? 'text-emerald-600' : 'text-neutral-500'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                {published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="Episode title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mb-2 w-full border-none bg-transparent text-[32px] font-semibold tracking-tight text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
        />
        {titleWarning && (
          <p className="mb-2 text-[13px] text-amber-600">{titleWarning}</p>
        )}

        <TipTap content={content} onChange={setContent} onError={setError} />
      </form>

      <Modal open={!!error} onClose={() => setError('')} title="Something went wrong">
        {error}
      </Modal>
    </div>
  )
}
