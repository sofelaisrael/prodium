import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h2 className="mb-3 text-[16px] font-semibold text-neutral-900">{title}</h2>
        )}
        <div className="text-[14px] text-neutral-600">{children}</div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
