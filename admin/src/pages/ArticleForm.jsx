import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import TipTap from '../components/TipTap'
import Modal from '../components/Modal'

export default function ArticleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const dropdownRef = useRef(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [showSettings, setShowSettings] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const categoryRef = useRef(null)

  useEffect(() => {
    if (!isNew) {
      api.getArticle(id)
        .then(a => {
          setTitle(a.title || '')
          setCategory(a.category || '')
          setContent(a.content || '')
          setPublished(a.published || false)
        })
        .catch(() => navigate('/articles'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, navigate])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (showSettings) {
      api.getCategories().then(setCategories).catch(() => {})
    }
  }, [showSettings])

  const save = async (publishState) => {
    setSaving(true)
    setShowDropdown(false)
    try {
      const body = { title, category, content, published: publishState }
      if (isNew) {
        const created = await api.createArticle(body)
        navigate(`/articles/${created.id}/edit`)
      } else {
        await api.updateArticle(id, body)
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
          onClick={() => navigate('/articles')}
          className="inline-flex items-center gap-1.5 text-[14px] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Articles
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
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mb-2 w-full border-none bg-transparent text-[32px] font-semibold tracking-tight text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
        />

        <TipTap content={content} onChange={setContent} onError={setError} />
      </form>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/10" onClick={() => setShowSettings(false)}>
          <div
            className="mt-20 mr-8 w-[300px] rounded-xl border border-neutral-100 bg-white p-5 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="mb-4 text-[14px] font-semibold text-neutral-900">Article settings</h3>

            <label className="mb-4 block" ref={categoryRef}>
              <span className="mb-1.5 block text-[13px] text-neutral-500">Category</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Technology, Design"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[14px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none"
                />
                {showSuggestions && categories.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-neutral-100 bg-white py-1 shadow-lg">
                    {categories
                      .filter(c => c.name.toLowerCase().includes(category.toLowerCase()))
                      .map(c => (
                        <button
                          key={c.name}
                          onClick={() => {
                            setCategory(c.name)
                            setShowSuggestions(false)
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                        >
                          <span>{c.name}</span>
                          <span className="text-[11px] text-neutral-400">{c.count}</span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
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

      <Modal open={!!error} onClose={() => setError('')} title="Something went wrong">
        {error}
      </Modal>
    </div>
  )
}
