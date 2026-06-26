import { useRef, useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { Node, mergeAttributes } from '@tiptap/core'
import { api } from '../api'

const ResizableVideo = Node.create({
  name: 'resizableVideo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      width: { default: '100%' },
    }
  },

  parseHTML() {
    return [{ tag: 'video' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', class: 'rounded-lg' })]
  },

  addCommands() {
    return {
      setVideo: (attrs) => ({ commands }) => {
        return commands.insertContent({ type: 'resizableVideo', attrs })
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableVideoComponent)
  },
})

function ResizableVideoComponent({ node, updateAttributes }) {
  const [isResizing, setIsResizing] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const containerRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    startX.current = e.clientX
    startWidth.current = containerRef.current?.offsetWidth || 0

    const handleMouseMove = (e) => {
      const dx = e.clientX - startX.current
      const containerParent = containerRef.current?.parentElement
      const maxWidth = containerParent?.offsetWidth || 700
      const newWidth = Math.min(Math.max(startWidth.current + dx, 100), maxWidth)
      const widthPercent = Math.round((newWidth / maxWidth) * 100)
      updateAttributes({ width: `${widthPercent}%` })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [updateAttributes])

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        className="group relative my-4"
        style={{ width: node.attrs.width }}
      >
        <video
          src={node.attrs.src}
          controls
          className="w-full rounded-lg"
        />
        <div
          onMouseDown={handleMouseDown}
          className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity ${
            isResizing ? 'opacity-100' : ''
          }`}
        >
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors ${
            isResizing ? 'bg-blue-500' : 'bg-neutral-400'
          }`} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: '100%' },
    }
  },

  parseHTML() {
    return [{ tag: 'img' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { class: 'rounded-lg' })]
  },

  addCommands() {
    return {
      setImage: (attrs) => ({ commands }) => {
        return commands.insertContent({ type: 'resizableImage', attrs })
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
})

function ResizableImageComponent({ node, updateAttributes }) {
  const [isResizing, setIsResizing] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const containerRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    startX.current = e.clientX
    startWidth.current = containerRef.current?.offsetWidth || 0

    const handleMouseMove = (e) => {
      const dx = e.clientX - startX.current
      const containerParent = containerRef.current?.parentElement
      const maxWidth = containerParent?.offsetWidth || 700
      const newWidth = Math.min(Math.max(startWidth.current + dx, 100), maxWidth)
      const widthPercent = Math.round((newWidth / maxWidth) * 100)
      updateAttributes({ width: `${widthPercent}%` })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [updateAttributes])

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        className="group relative my-4"
        style={{ width: node.attrs.width }}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className="w-full rounded-lg"
          draggable={false}
        />
        <div
          onMouseDown={handleMouseDown}
          className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity ${
            isResizing ? 'opacity-100' : ''
          }`}
        >
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors ${
            isResizing ? 'bg-blue-500' : 'bg-neutral-400'
          }`} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

const Bar = ({ editor, imageRef, videoRef, onError }) => {
  if (!editor) return null

  const btn = 'p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors'
  const active = 'bg-neutral-100 text-neutral-900'

  const handleUpload = async (file, type) => {
    if (!file) return
    try {
      const result = await api.upload(file)
      if (type === 'image') {
        editor.chain().focus().setImage({ src: result.url }).run()
      } else {
        editor.chain().focus().setVideo({ src: result.url }).run()
      }
    } catch (err) {
      onError?.(err.message)
    }
  }

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

      <button type="button" onClick={() => imageRef.current?.click()} className={btn} title="Insert image">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </button>
      <button type="button" onClick={() => videoRef.current?.click()} className={btn} title="Insert video">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
          <rect x="2" y="6" width="14" height="12" rx="2" />
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

      <input type="file" ref={imageRef} accept="image/*" className="hidden" onChange={e => { handleUpload(e.target.files[0], 'image'); e.target.value = '' }} />
      <input type="file" ref={videoRef} accept="video/*" className="hidden" onChange={e => { handleUpload(e.target.files[0], 'video'); e.target.value = '' }} />
    </div>
  )
}

export default function TipTap({ content, onChange, onError }) {
  const imageRef = useRef(null)
  const videoRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage,
      Image,
      ResizableVideo,
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white">
      <Bar editor={editor} imageRef={imageRef} videoRef={videoRef} onError={onError} />
      <EditorContent
        editor={editor}
        className="prose prose-neutral prose-lg max-w-none px-4 py-8 min-h-[500px] focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[480px] [&_.tiptap]:text-neutral-800"
      />
    </div>
  )
}
