import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/context/ThemeContext'
import { PeriodProvider } from '@/context/PeriodContext'
import { AuthProvider } from '@/context/AuthContext'
import DashboardPage from '@/pages/DashboardPage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminChannelsPage from '@/pages/AdminChannelsPage'
import AdminCountersPage from '@/pages/AdminCountersPage'
import AdminEngagementPage from '@/pages/AdminEngagementPage'
import AdminReviewsPage from '@/pages/AdminReviewsPage'
import AdminVkPage from '@/pages/AdminVkPage'
import AdminLayout from '@/components/layout/AdminLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <PeriodProvider>
          <BrowserRouter>
            <Routes>
              {/* Public dashboard */}
              <Route path="/" element={<DashboardPage />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="channels" element={<AdminChannelsPage />} />
                <Route path="counters" element={<AdminCountersPage />} />
                <Route path="engagement" element={<AdminEngagementPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="vk" element={<AdminVkPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PeriodProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
