import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-[320px]">
        <div className="mb-10 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">Prodium</h1>
          <p className="mt-2 text-[14px] text-neutral-500">Sign in to your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 text-[14px] text-neutral-700 placeholder:text-neutral-400 transition-colors focus:border-neutral-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 text-[14px] text-neutral-700 placeholder:text-neutral-400 transition-colors focus:border-neutral-400 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-neutral-900 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
