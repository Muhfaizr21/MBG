import { useState, useEffect } from 'react'
import { SiteHeader } from './components/layout/SiteHeader'
import { SiteFooter } from './components/layout/SiteFooter'
import { HomePage } from './pages/HomePage'
import { FiturPage } from './pages/FiturPage'
import { TentangKamiPage } from './pages/TentangKamiPage'
import { ScanPage } from './pages/ScanPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AdminPage } from './pages/admin/AdminPage'
import { ValidatorsPage } from './pages/admin/ValidatorsPage'
import { SppgPage } from './pages/admin/SppgPage'
import { DeliveriesPage } from './pages/admin/DeliveriesPage'
import { AttendancePage } from './pages/admin/AttendancePage'
import { SchoolsPage } from './pages/admin/SchoolsPage'
import { SchedulePage } from './pages/admin/SchedulePage'
import { NoticesPage } from './pages/admin/NoticesPage'
import { CalendarPage } from './pages/admin/CalendarPage'
import { ReportsPage } from './pages/admin/ReportsPage'
import { FeedbackPage } from './pages/admin/FeedbackPage'
import { SppgDashboardPage } from './pages/sppg/SppgDashboardPage'
import { SppgRecipesPage } from './pages/sppg/SppgRecipesPage'
import { SppgBatchesPage } from './pages/sppg/SppgBatchesPage'
import { SppgQualityPage } from './pages/sppg/SppgQualityPage'
import { SppgLogisticsPage } from './pages/sppg/SppgLogisticsPage'
import { SppgSchoolsPage } from './pages/sppg/SppgSchoolsPage'
import { SppgHandoverPage } from './pages/sppg/SppgHandoverPage'
import { SppgIncidentsPage } from './pages/sppg/SppgIncidentsPage'
import { SppgBillingPage } from './pages/sppg/SppgBillingPage'
import { SppgCompliancePage } from './pages/sppg/SppgCompliancePage'

// Helper for programmatic navigation
export function navigate(to) {
  if (!to) return
  if (to.startsWith('http://') || to.startsWith('https://')) {
    window.location.href = to
    return
  }
  const clean = to.replace(/^#\/?/, '/').replace(/^\/#/, '') || '/'
  const target = clean.startsWith('/') ? clean : '/' + clean
  window.history.pushState(null, '', target)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function getCleanPath() {
  // If user visits with legacy hash (e.g. /#/login or #/login), convert immediately to /login
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    const fromHash = window.location.hash.replace(/^#/, '')
    window.history.replaceState(null, '', fromHash)
    return fromHash.split('?')[0].split('#')[0] || '/'
  }
  let path = window.location.pathname.split('?')[0].split('#')[0] || '/'
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  return path
}

function usePath() {
  const [path, setPath] = useState(getCleanPath)

  useEffect(() => {
    const handlePop = () => setPath(getCleanPath())
    window.addEventListener('popstate', handlePop)

    // Handle seamless SPA anchor clicks for clean URLs
    const handleClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      // If anchor has hash only on same page like href="#kontak", let native scroll handle it
      if (href && href.startsWith('#') && !href.startsWith('#/')) return

      if (
        anchor.href &&
        anchor.origin === window.location.origin &&
        !anchor.hasAttribute('download') &&
        anchor.target !== '_blank' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey &&
        !e.defaultPrevented
      ) {
        e.preventDefault()
        const url = new URL(anchor.href)
        navigate(url.pathname + url.search + url.hash)
      }
    }

    document.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('popstate', handlePop)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return path
}

function PublicPage({ path }) {
  if (path === '/' || path === '/home') return <HomePage />
  if (path === '/fitur') return <FiturPage />
  if (path === '/tentang-kami' || path === '/tentang' || path === '/mulai') return <TentangKamiPage />
  if (path === '/scan') return <ScanPage />

  return <NotFoundPage path={path} />
}

export default function App() {
  const path = usePath()

  // Full-screen isolated admin dashboard (no public header/footer)
  if (path === '/admin') return <AdminPage route={path} />
  if (path === '/admin/validators') return <ValidatorsPage />
  if (path === '/admin/sppg') return <SppgPage />
  if (path === '/admin/deliveries') return <DeliveriesPage />
  if (path === '/admin/attendance') return <AttendancePage />
  if (path === '/admin/schools') return <SchoolsPage />
  if (path === '/admin/schedule') return <SchedulePage />
  if (path === '/admin/notices') return <NoticesPage />
  if (path === '/admin/calendar') return <CalendarPage />
  if (path === '/admin/reports') return <ReportsPage />
  if (path === '/admin/feedback') return <FeedbackPage />
  if (path.startsWith('/admin/')) return <AdminPage route={path} />

  // Full-screen isolated SPPG kitchen cockpit (no public header/footer, completely decoupled from /admin/*)
  if (path === '/sppg/recipes') {
    return <SppgRecipesPage />
  }
  if (path === '/sppg/batches') {
    return <SppgBatchesPage />
  }
  if (path === '/sppg/quality') {
    return <SppgQualityPage />
  }
  if (path === '/sppg/logistics') {
    return <SppgLogisticsPage />
  }
  if (path === '/sppg/schools') {
    return <SppgSchoolsPage />
  }
  if (path === '/sppg/handover') {
    return <SppgHandoverPage />
  }
  if (path === '/sppg/incidents') {
    return <SppgIncidentsPage />
  }
  if (path === '/sppg/billing') {
    return <SppgBillingPage />
  }
  if (path === '/sppg/compliance') {
    return <SppgCompliancePage />
  }
  if (path === '/sppg' || path === '/sppg/dashboard' || path.startsWith('/sppg/')) {
    return <SppgDashboardPage />
  }

  // Full-screen isolated auth pages
  if (path === '/login' || path === '/signin' || path === '/auth/signin') {
    return <LoginPage />
  }
  if (
    path === '/register' ||
    path === '/signup' ||
    path === '/auth/signup' ||
    path === '/auth/register'
  ) {
    return <RegisterPage />
  }

  // Full-screen 404 page (no header/footer) if route is invalid/unknown
  const isKnownRoute =
    path === '/' ||
    path === '/home' ||
    path === '/fitur' ||
    path === '/tentang-kami' ||
    path === '/tentang' ||
    path === '/mulai' ||
    path === '/scan'

  if (!isKnownRoute) {
    return <NotFoundPage path={path} />
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between selection:bg-gray-900 selection:text-white">
      <SiteHeader path={path} />
      <main className="flex-1">
        <PublicPage path={path} />
      </main>
      <SiteFooter />
    </div>
  )
}
