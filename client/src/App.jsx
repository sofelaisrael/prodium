import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Episodes from './pages/Episodes'
import Episode from './pages/Episode'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <ScrollToTop />
      <Header />
      <main className="flex flex-1 flex-col pt-[88px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/episodes" element={<Episodes />} />
          <Route path="/episodes/:id" element={<Episode />} />
        </Routes>
      </main>
    </div>
  )
}
