import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import menuIcon from '../assets/menu.svg'

export default function Header() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const linkClass = (path) => {
    const isActive = path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path)

    return `text-[14px] transition-colors relative ${
      isActive
        ? 'text-neutral-900 after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-2px] after:h-[1.5px] after:w-[calc(100%-10px)] after:mx-auto after:bg-neutral-900'
        : 'text-neutral-500 hover:text-neutral-900'
    }`
  }

  return (
    <header className="border-b border-neutral-100 mx-20 py-5">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Prodium" className="h-14 w-auto" />
        </Link>

        <nav className="hidden items-center font-novamono font-light gap-6 md:flex">
          <Link to="/" className={linkClass('/')}>
            Home
          </Link>
          <Link to="/episodes" className={linkClass('/episodes')}>
            Episodes
          </Link>
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 md:hidden"
        >
          <img src={menuIcon} alt="Menu" className="h-6 w-auto" />
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-neutral-100 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={linkClass('/')}
            >
              Home
            </Link>
            <Link
              to="/episodes"
              onClick={() => setMobileOpen(false)}
              className={linkClass('/episodes')}
            >
              Episodes
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
