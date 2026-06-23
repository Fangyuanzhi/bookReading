import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import BookDetail from './pages/BookDetail'
import Reader from './pages/Reader'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Upload from './pages/Upload'
import { useAuthStore } from './store/auth'

function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Routes>
      <Route path="/read/:chapterId" element={<Reader />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="book/:id" element={<BookDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search" element={<Search />} />
        <Route path="upload" element={<Upload />} />
      </Route>
    </Routes>
  )
}

export default App
