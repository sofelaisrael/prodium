export default function Loader({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className="relative flex items-center gap-2">
        <span className="block h-2 w-2 animate-bounce rounded-full bg-neutral-900 [animation-delay:-0.3s]" />
        <span className="block h-2 w-2 animate-bounce rounded-full bg-neutral-900 [animation-delay:-0.15s]" />
        <span className="block h-2 w-2 animate-bounce rounded-full bg-neutral-900" />
      </div>
    </div>
  )
}
