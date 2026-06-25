import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Article from './pages/Article'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles/:id" element={<Article />} />
        </Routes>
      </main>
    </div>
  )
}
