import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Landing from './pages/Landing'
import Waitlist from './pages/Waitlist'
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
import MobileNav from './components/shared/MobileNav'
import FeedbackWidget from './components/shared/FeedbackWidget'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-950 pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav />
      <FeedbackWidget />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing — sin sidebar */}
          <Route path="/" element={<Landing />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App — con sidebar */}
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/campaigns" element={<AppLayout><Campaigns /></AppLayout>} />
          <Route path="/keywords" element={<AppLayout><Keywords /></AppLayout>} />
          <Route path="/optimizer" element={<AppLayout><Optimizer /></AppLayout>} />
          <Route path="/copywriter" element={<AppLayout><Copywriter /></AppLayout>} />
          <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
          <Route path="/competitors" element={<AppLayout><Competitors /></AppLayout>} />
          <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
