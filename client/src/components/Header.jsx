import { useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import menuIcon from '../assets/menu.svg'

export default function Header() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const timerRef = useRef(null)

  const closeMenu = () => {
    setClosing(true)
    timerRef.current = setTimeout(() => {
      setMobileOpen(false)
      setClosing(false)
    }, 600)
  }

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

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Episodes', path: '/episodes' },
  ]

  const strips = Array.from({ length: 7 })

  const stripClass = closing ? 'animate-strip-out' : 'animate-strip-in'
  const contentClass = closing ? 'animate-content-out' : 'animate-strip-in'

  return (
    <header className="relative z-[60] border-b border-neutral-100 mx-5 md:mx-20 py-5">
      <div className="mx-auto flex h-14 items-center justify-between">
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
          onClick={() => {
            if (closing) return
            setMobileOpen(true)
          }}
          className="p-1 md:hidden"
        >
          <img src={menuIcon} alt="Menu" className="h-6 w-auto" />
        </button>
      </div>

      {mobileOpen && (
        <nav className="fixed inset-0 z-50 md:hidden">
          {strips.map((_, i) => (
            <div
              key={i}
              className={`absolute left-0 right-0 bg-white ${stripClass}`}
              style={{
                top: `calc(${(i / 7) * 100}% - ${i > 0 ? '1px' : '0px'})`,
                height: `calc(${100 / 7}% + 1px)`,
                animationDelay: closing
                  ? `${i * 40}ms`
                  : `${i * 40}ms`,
              }}
            />
          ))}
          <div
            className={`relative z-10 flex flex-col h-full ${contentClass}`}
            style={{ animationDelay: closing ? '0ms' : '250ms' }}
          >
            <div className="flex items-center justify-end mx-5 py-5">
              <button onClick={closeMenu} className="p-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-6 mx-5 mt-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className="font-novamono text-[36px] font-extrabold text-neutral-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="font-novamono mt-auto mx-5 pb-10 flex gap-6 text-[13px] text-neutral-400">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900">Instagram</a>
              <a href="mailto:hello@sofela.com" className="hover:text-neutral-900">Email</a>
              <a href="https://vimeo.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900">Vimeo</a>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
