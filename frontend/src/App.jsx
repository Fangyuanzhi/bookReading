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
import Legal from './pages/Legal'
import Privacy from './pages/Privacy'
import AuthorDashboard from './pages/AuthorDashboard'
import AuthorBook from './pages/AuthorBook'
import AuthorChapterEdit from './pages/AuthorChapterEdit'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Discover from './pages/Discover'
import Vip from './pages/Vip'
import Shelf from './pages/Shelf'
import Feed from './pages/Feed'
import UserProfile from './pages/UserProfile'
import BookWorld from './pages/BookWorld'
import LoreDetail from './pages/LoreDetail'
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
        <Route path="book/:id/world" element={<BookWorld />} />
        <Route path="book/:id/world/:entityType/:entityId" element={<LoreDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="profile" element={<Profile />} />
        <Route path="shelf" element={<Shelf />} />
        <Route path="feed" element={<Feed />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="search" element={<Search />} />
        <Route path="upload" element={<Upload />} />
        <Route path="author" element={<AuthorDashboard />} />
        <Route path="author/:bookId" element={<AuthorBook />} />
        <Route path="author/:bookId/chapters/:chapterId" element={<AuthorChapterEdit />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:id" element={<GroupDetail />} />
        <Route path="discover" element={<Discover />} />
        <Route path="vip" element={<Vip />} />
        <Route path="legal" element={<Legal />} />
        <Route path="privacy" element={<Privacy />} />
      </Route>
    </Routes>
  )
}

export default App
