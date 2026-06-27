import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectForm from './pages/ProjectForm'
import Episodes from './pages/Episodes'
import EpisodeForm from './pages/EpisodeForm'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/projects" element={<PrivateRoute><Layout><Projects /></Layout></PrivateRoute>} />
      <Route path="/projects/new" element={<PrivateRoute><Layout><ProjectForm /></Layout></PrivateRoute>} />
      <Route path="/projects/:id/edit" element={<PrivateRoute><Layout><ProjectForm /></Layout></PrivateRoute>} />
      <Route path="/projects/:projectId/episodes" element={<PrivateRoute><Layout><Episodes /></Layout></PrivateRoute>} />
      <Route path="/projects/:projectId/episodes/new" element={<PrivateRoute><Layout><EpisodeForm /></Layout></PrivateRoute>} />
      <Route path="/episodes/:id/edit" element={<PrivateRoute><Layout><EpisodeForm /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
