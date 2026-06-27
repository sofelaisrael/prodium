import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Project from './pages/Project'
import Episode from './pages/Episode'

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <Header />
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<Project />} />
          <Route path="/episodes/:id" element={<Episode />} />
        </Routes>
      </main>
    </div>
  )
}
