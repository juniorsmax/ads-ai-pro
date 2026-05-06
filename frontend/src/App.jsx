import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import Keywords from './pages/Keywords'
import Reports from './pages/Reports'
import Competitors from './pages/Competitors'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import Optimizer from './pages/Optimizer'
import Copywriter from './pages/Copywriter'
import Billing from './pages/Billing'
import Sidebar from './components/shared/Sidebar'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-slate-950">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/keywords" element={<Keywords />} />
              <Route path="/optimizer" element={<Optimizer />} />
              <Route path="/copywriter" element={<Copywriter />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/competitors" element={<Competitors />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/onboarding" element={<Onboarding />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
