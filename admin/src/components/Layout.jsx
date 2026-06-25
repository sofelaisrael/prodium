import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/articles', label: 'Articles' },
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">Prodium</Link>
          <nav className="flex items-center gap-6">
            {nav.map(n => (
              <Link
                key={n.to}
                to={n.to}
                className={`text-sm ${location.pathname === n.to || (n.to !== '/' && location.pathname.startsWith(n.to)) ? 'font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {n.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">Logout</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
