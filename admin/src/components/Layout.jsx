import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const nav = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    to: '/episodes',
    label: 'Episodes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    )
  },
]

export default function Layout({ children }) {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[68px] flex-col items-center border-r border-neutral-100 bg-white md:w-[220px]">
        <Link to="/" className="flex h-14 items-center gap-2 px-4 font-semibold tracking-tight">
          <span className="hidden md:block">Prodium</span>
        </Link>

        <nav className="mt-2 flex w-full flex-col gap-1 px-2">
          {nav.map(n => {
            const active = n.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(n.to)
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                  active
                    ? 'bg-neutral-100 font-medium text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <span className="flex-shrink-0">{n.icon}</span>
                <span className="hidden md:block">{n.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto mb-4 w-full px-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-[220px]">
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
