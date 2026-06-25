import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight">Prodium</Link>
      </div>
    </header>
  )
}
