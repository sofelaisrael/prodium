import { useRef, useState } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Node, mergeAttributes } from '@tiptap/core'
import { api } from '../api'

function useResizable(node, updateAttributes) {
  const ref = useRef(null)

  const startResize = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const el = ref.current
    if (!el) return

    const parent = el.parentElement
    if (!parent) return

    const startClientX = e.clientX
    const containerW = parent.offsetWidth
    const startPctW = parseFloat(node.attrs.width) || 100

    const onMove = (ev) => {
      const dx = ev.clientX - startClientX
      const deltaPct = (dx / containerW) * 100
      const newPctW = Math.max(10, Math.min(100, startPctW + deltaPct))
      updateAttributes({ width: `${Math.round(newPctW)}%` })
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.body.style.cursor = 'nwse-resize'
    document.body.style.userSelect = 'none'
  }

  return { ref, startResize }
}

function MediaNodeView({ node, updateAttributes, extension }) {
  const { ref, startResize } = useResizable(node, updateAttributes)
  const isVideo = extension.name === 'resizableVideo'

  return (
    <NodeViewWrapper>
      <div className="relative group" style={{ width: node.attrs.width || '100%' }}>
        {isVideo ? (
          <video ref={ref} src={node.attrs.src} controls className="w-full rounded-lg" />
        ) : (
          <img ref={ref} src={node.attrs.src} alt={node.attrs.alt || ''} className="w-full rounded-lg" />
        )}
        <div
          contentEditable={false}
          onPointerDown={startResize}
          className="absolute bottom-0 right-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center cursor-nwse-resize"
        >
          <div className="w-2 h-2 rounded-full bg-neutral-400 hover:bg-blue-500 transition-colors" />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

function createMediaNode(name, tag, attrs) {
  return Node.create({
    name,
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
      return {
        src: { default: null },
        alt: { default: null },
        width: { default: '100%' },
        ...attrs,
      }
    },

    parseHTML() {
      return [{ tag }]
    },

    renderHTML({ HTMLAttributes }) {
      return [tag, mergeAttributes(HTMLAttributes, { class: 'rounded-lg' })]
    },

    addCommands() {
      return {
        [`set${name.charAt(0).toUpperCase() + name.slice(1)}`]: (at) => ({ commands }) => {
          return commands.insertContent({ type: name, attrs: at })
        },
      }
    },

    addNodeView() {
      return ReactNodeViewRenderer(MediaNodeView)
    },
  })
}

const ResizableImage = createMediaNode('resizableImage', 'img', { alt: { default: null } })
const ResizableVideo = createMediaNode('resizableVideo', 'video', { controls: { default: true } })

const UploadPlaceholder = Node.create({
  name: 'uploadPlaceholder',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: false,

  addAttributes() {
    return { uploadId: { default: null } }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="uploadPlaceholder"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'uploadPlaceholder' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(() => (
      <NodeViewWrapper>
        <div className="my-3 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-sm text-neutral-500">Uploading...</span>
        </div>
      </NodeViewWrapper>
    ))
  },
})

function ImageGalleryNodeView({ node, updateAttributes }) {
  const [dragged, setDragged] = useState(null)
  const [over, setOver] = useState(null)
  const fileRef = useRef(null)
  const images = node.attrs.images || []

  const onDragStart = (e, i) => { setDragged(i); e.dataTransfer.effectAllowed = 'move' }
  const onDragOver = (e, i) => { e.preventDefault(); setOver(i) }
  const onDrop = (e, i) => {
    e.preventDefault()
    if (dragged === null || dragged === i) return
    const arr = [...images]
    const [item] = arr.splice(dragged, 1)
    arr.splice(i, 0, item)
    updateAttributes({ images: arr })
    setDragged(null); setOver(null)
  }
  const onDragEnd = () => { setDragged(null); setOver(null) }

  const addImages = async (files) => {
    const newImgs = []
    for (const file of Array.from(files || [])) {
      try {
        const r = await api.upload(file)
        newImgs.push({ src: r.url, alt: '' })
      } catch (err) {
        console.error('Gallery upload failed:', err)
      }
    }
    if (newImgs.length) updateAttributes({ images: [...images, ...newImgs] })
  }

  const removeImage = (i) => updateAttributes({ images: images.filter((_, j) => j !== i) })

  const moveImage = (i, dir) => {
    const arr = [...images]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    updateAttributes({ images: arr })
  }

  if (!images.length) {
    return (
      <NodeViewWrapper>
        <div className="my-4 rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center">
          <p className="text-sm text-neutral-400 mb-3">No images yet</p>
          <button onClick={() => fileRef.current?.click()} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800">Add images</button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { addImages(e.target.files); e.target.value = '' }} />
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div className="my-4 rounded-xl border border-neutral-100 p-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${node.attrs.columns || 2}, 1fr)` }}>
          {images.map((img, i) => (
            <div
              key={i}
              draggable
              onDragStart={e => onDragStart(e, i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={e => onDrop(e, i)}
              onDragEnd={onDragEnd}
              className={`relative group rounded-lg overflow-hidden cursor-move ${over === i ? 'ring-2 ring-blue-500' : ''} ${dragged === i ? 'opacity-40' : ''}`}
            >
              <img src={img.src} alt={img.alt || ''} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-1">
                  <button onClick={() => moveImage(i, -1)} className="rounded bg-white/90 p-1 hover:bg-white" title="Move left">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button onClick={() => moveImage(i, 1)} className="rounded bg-white/90 p-1 hover:bg-white" title="Move right">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                  <button onClick={() => removeImage(i)} className="rounded bg-white/90 p-1 hover:bg-white text-red-500" title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50">+ Add images</button>
          <div className="flex items-center gap-1 ml-auto">
            {[2, 3, 4].map(n => (
              <button key={n} onClick={() => updateAttributes({ columns: n })} className={`rounded px-2 py-1 text-xs ${node.attrs.columns === n ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}>{n}</button>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { addImages(e.target.files); e.target.value = '' }} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

const ImageGallery = Node.create({
  name: 'imageGallery',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: { default: [] },
      columns: { default: 2 },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="imageGallery"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'imageGallery' })]
  },

  addCommands() {
    return {
      setImageGallery: () => ({ commands }) => {
        return commands.insertContent({ type: 'imageGallery', attrs: { images: [], columns: 2 } })
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGalleryNodeView)
  },
})

function findPlaceholder(doc, uploadId) {
  let pos = null
  doc.descendants((node, position) => {
    if (node.type.name === 'uploadPlaceholder' && node.attrs.uploadId === uploadId) {
      pos = position
      return false
    }
  })
  return pos
}

const Bar = ({ editor, imageRef, videoRef, onError, uploading, setUploading, setProgress }) => {
  if (!editor) return null

  const btn = 'p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors'
  const active = 'bg-neutral-100 text-neutral-900'

  const handleUpload = async (files, type) => {
    const list = Array.from(files || [])
    if (!list.length) return
    setUploading(type)

    const ids = list.map((_, i) => `upload-${Date.now()}-${i}`)

    for (const id of ids) {
      editor.chain().focus().insertContent({ type: 'uploadPlaceholder', attrs: { uploadId: id } }).run()
    }

    for (let i = 0; i < list.length; i++) {
      try {
        const result = await api.upload(list[i], (p) => {
          // Calculate overall progress: (finished files + current file progress) / total files
          const overall = Math.round(((i + (p / 100)) / list.length) * 100)
          setProgress(overall)
        })
        const pos = findPlaceholder(editor.state.doc, ids[i])
        if (pos !== null) {
          const nodeType = type === 'image' ? 'resizableImage' : 'resizableVideo'
          editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).insertContentAt(pos, {
            type: nodeType,
            attrs: { src: result.url, ...(type === 'image' ? { alt: '' } : { controls: true }) }
          }).run()
        }
      } catch (err) {
        onError?.(err.message)
        const pos = findPlaceholder(editor.state.doc, ids[i])
        if (pos !== null) {
          editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
        }
      }
    }
    setUploading(null)
    setProgress(0)
  }

  const Spinner = () => (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-100 bg-white px-2 py-1.5 sticky top-0 z-10">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} ${editor.isActive('bold') ? active : ''}`} title="Bold">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} ${editor.isActive('italic') ? active : ''}`} title="Italic">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" x2="10" y1="4" y2="4" />
          <line x1="14" x2="5" y1="20" y2="20" />
          <line x1="15" x2="9" y1="4" y2="20" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btn} ${editor.isActive('underline') ? active : ''}`} title="Underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4v6a6 6 0 0 0 12 0V4" />
          <line x1="4" x2="20" y1="20" y2="20" />
        </svg>
      </button>

      <div className="mx-1.5 h-5 w-px bg-neutral-100" />

      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btn} ${editor.isActive('heading', { level: 2 }) ? active : ''}`} title="Heading 2">
        <span className="text-[13px] font-semibold">H2</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btn} ${editor.isActive('heading', { level: 3 }) ? active : ''}`} title="Heading 3">
        <span className="text-[13px] font-semibold">H3</span>
      </button>

      <div className="mx-1.5 h-5 w-px bg-neutral-100" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btn} ${editor.isActive('bulletList') ? active : ''}`} title="Bullet list">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btn} ${editor.isActive('blockquote') ? active : ''}`} title="Quote">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 6H3" />
          <path d="M21 12H8" />
          <path d="M21 18H8" />
          <path d="M3 12v6" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn} title="Divider">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" x2="22" y1="12" y2="12" />
        </svg>
      </button>

      <div className="mx-1.5 h-5 w-px bg-neutral-100" />

      <button type="button" onClick={() => imageRef.current?.click()} disabled={!!uploading} className={`${btn} disabled:opacity-40`} title="Insert image">
        {uploading === 'image' ? <Spinner /> : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        )}
      </button>
      <button type="button" onClick={() => videoRef.current?.click()} disabled={!!uploading} className={`${btn} disabled:opacity-40`} title="Insert video">
        {uploading === 'video' ? <Spinner /> : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
            <rect x="2" y="6" width="14" height="12" rx="2" />
          </svg>
        )}
      </button>
      <button type="button" onClick={() => editor.chain().focus().setImageGallery().run()} className={btn} title="Insert image gallery">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 15h4l3-3 4 4 4-4h3" />
        </svg>
      </button>

      <div className="mx-1.5 h-5 w-px bg-neutral-100" />

      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`${btn} disabled:opacity-30`} title="Undo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`${btn} disabled:opacity-30`} title="Redo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
        </svg>
      </button>

      <input type="file" ref={imageRef} accept="image/*" multiple className="hidden" onChange={e => { handleUpload(e.target.files, 'image'); e.target.value = '' }} />
      <input type="file" ref={videoRef} accept="video/*" multiple className="hidden" onChange={e => { handleUpload(e.target.files, 'video'); e.target.value = '' }} />
    </div>
  )
}

export default function TipTap({ content, onChange, onError }) {
  const imageRef = useRef(null)
  const videoRef = useRef(null)
  const [uploading, setUploading] = useState(null)
  const [progress, setProgress] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage,
      ResizableVideo,
      UploadPlaceholder,
      ImageGallery,
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  return (
    <div className="rounded-xl border border-neutral-100 bg-white">
      <Bar editor={editor} imageRef={imageRef} videoRef={videoRef} onError={onError} uploading={uploading} setUploading={setUploading} setProgress={setProgress} />
      <div className="relative">
        {uploading && (
          <div className="absolute top-0 left-0 right-0 z-10 h-0.5 bg-neutral-100">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <EditorContent
          editor={editor}
          className="prose prose-neutral prose-lg max-w-none px-4 py-8 min-h-[500px] focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[480px] [&_.tiptap]:text-neutral-800 [&_.tiptap]:overflow-visible [&_img]:!max-w-full [&_video]:!max-w-full"
        />
      </div>
    </div>
  )
}
