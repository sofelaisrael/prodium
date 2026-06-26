import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const location = useLocation()

  return (
    <header className="border-b border-neutral-100">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link to="/" className="text-[17px] font-semibold tracking-tight text-neutral-900">
          Prodium
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className={`text-[14px] transition-colors ${
              location.pathname === '/'
                ? 'font-medium text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Home
          </Link>
          <Link
            to="/episodes"
            className={`text-[14px] transition-colors ${
              location.pathname === '/episodes'
                ? 'font-medium text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Episodes
          </Link>
        </nav>
      </div>
    </header>
  )
}
