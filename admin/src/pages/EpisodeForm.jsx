import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import TipTap from '../components/TipTap'
import Modal from '../components/Modal'

export default function EpisodeForm() {
  const { projectId: routeProjectId, id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const dropdownRef = useRef(null)

  const [projectId, setProjectId] = useState(routeProjectId)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew) {
      api.getEpisode(id)
        .then(e => {
          setTitle(e.title || '')
          setContent(e.content || '')
          setPublished(e.published || false)
          setProjectId(e.project_id)
        })
        .catch(() => navigate(routeProjectId ? `/projects/${routeProjectId}/episodes` : '/projects'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, routeProjectId, navigate])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const save = async (publishState) => {
    setSaving(true)
    setShowDropdown(false)
    try {
      const body = { title, content, published: publishState }
      if (isNew) {
        await api.createEpisode(projectId, body)
        navigate(`/projects/${projectId}/episodes`)
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
          onClick={() => navigate(projectId ? `/projects/${projectId}/episodes` : '/projects')}
          className="inline-flex items-center gap-1.5 text-[14px] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Episodes
        </button>

        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <div className="flex">
              <button
                onClick={() => save(isNew ? true : published)}
                disabled={saving || !title.trim()}
                className="rounded-l-full bg-neutral-900 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  Publish
                </button>
                <button
                  onClick={() => save(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
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

      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="Episode title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mb-2 w-full border-none bg-transparent text-[32px] font-semibold tracking-tight text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
        />

        <TipTap content={content} onChange={setContent} onError={setError} />
      </form>

      <Modal open={!!error} onClose={() => setError('')} title="Something went wrong">
        {error}
      </Modal>
    </div>
  )
}
