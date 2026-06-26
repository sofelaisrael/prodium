import { useEffect } from 'react'

export default function ConfirmModal({ open, onClose, onConfirm, title, message }) {
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
          <h2 className="mb-2 text-[16px] font-semibold text-neutral-900">{title}</h2>
        )}
        <p className="text-[14px] text-neutral-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
