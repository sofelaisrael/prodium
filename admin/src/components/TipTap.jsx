import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { Node, mergeAttributes } from '@tiptap/core'
import { api } from '../api'

const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, controls: { default: true } }
  },
  parseHTML() {
    return [{ tag: 'video' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', class: 'max-w-full rounded' })]
  },
  addCommands() {
    return {
      setVideo: (attrs) => ({ commands }) => commands.insertContent({ type: 'video', attrs })
    }
  }
})

const Bar = ({ editor, imageRef, videoRef }) => {
  if (!editor) return null
  const btn = 'px-2 py-1 text-xs rounded hover:bg-gray-200'
  const active = 'bg-gray-200 font-medium'

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
      alert(err.message)
    }
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} ${editor.isActive('bold') ? active : ''}`}>B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} ${editor.isActive('italic') ? active : ''}`}>I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btn} ${editor.isActive('underline') ? active : ''}`}>U</button>
      <span className="mx-1 w-px bg-gray-300" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btn} ${editor.isActive('heading', { level: 2 }) ? active : ''}`}>H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btn} ${editor.isActive('heading', { level: 3 }) ? active : ''}`}>H3</button>
      <span className="mx-1 w-px bg-gray-300" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btn} ${editor.isActive('bulletList') ? active : ''}`}>List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btn} ${editor.isActive('blockquote') ? active : ''}`}>Quote</button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn}>Line</button>
      <span className="mx-1 w-px bg-gray-300" />
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`${btn} ${editor.isActive({ textAlign: 'left' }) ? active : ''}`}>L</button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`${btn} ${editor.isActive({ textAlign: 'center' }) ? active : ''}`}>C</button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`${btn} ${editor.isActive({ textAlign: 'right' }) ? active : ''}`}>R</button>
      <span className="mx-1 w-px bg-gray-300" />
      <input type="file" ref={imageRef} accept="image/*" className="hidden" onChange={e => { handleUpload(e.target.files[0], 'image'); e.target.value = '' }} />
      <input type="file" ref={videoRef} accept="video/*" className="hidden" onChange={e => { handleUpload(e.target.files[0], 'video'); e.target.value = '' }} />
      <button type="button" onClick={() => imageRef.current?.click()} className={btn}>Image</button>
      <button type="button" onClick={() => videoRef.current?.click()} className={btn}>Video</button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn}>Undo</button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn}>Redo</button>
    </div>
  )
}

export default function TipTap({ content, onChange }) {
  const imageRef = useRef(null)
  const videoRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
      VideoNode,
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <Bar editor={editor} imageRef={imageRef} videoRef={videoRef} />
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[280px]" />
    </div>
  )
}
