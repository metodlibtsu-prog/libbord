import { Link, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Обзор' },
  { to: '/admin/channels', label: 'Каналы' },
  { to: '/admin/counters', label: 'Счётчики' },
  { to: '/admin/engagement', label: 'Вовлечённость' },
  { to: '/admin/reviews', label: 'Отзывы' },
]

export default function AdminLayout() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  // Wait for auth to load before redirecting
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  if (!session) {
    navigate('/admin/login')
    return null
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-gray-900">
              Libbord
            </Link>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-medium text-gray-600">Админ-панель</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Выйти
          </button>
        </div>
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-t-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
