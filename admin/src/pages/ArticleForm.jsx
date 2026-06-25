import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import TipTap from '../components/TipTap'

export default function ArticleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { title, category, content, published }
      if (isNew) {
        const created = await api.createArticle(body)
        navigate(`/articles/${created.id}/edit`)
      } else {
        await api.updateArticle(id, body)
        navigate('/articles')
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? 'New article' : 'Edit article'}</h1>
        <button onClick={() => navigate('/articles')} className="text-sm text-gray-400 hover:text-gray-600">Back</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />

        <input
          type="text"
          placeholder="Category (optional)"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />

        <TipTap content={content} onChange={setContent} />

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={published}
              onChange={e => setPublished(e.target.checked)}
              className="rounded"
            />
            Publish
          </label>
          <div className="flex-1" />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
