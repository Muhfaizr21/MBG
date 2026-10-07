import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  ScanLine,
  UtensilsCrossed,
  CalendarDays,
  Megaphone,
  MessageSquareWarning,
  LogOut,
  Menu,
  GraduationCap,
  X,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'

import { navigate } from '../../App'
import { useAuth } from '../../context/AuthContext'

export const SISWA_SIDEBAR_MENU = [
  { id: 'dashboard', label: 'Beranda Saya', icon: LayoutDashboard, href: '/siswa' },
  { id: 'scans', label: 'Riwayat Scan Porsi', icon: ScanLine, href: '/siswa/scans' },
  { id: 'menu', label: 'Menu Hari Ini', icon: UtensilsCrossed, href: '/siswa/menu' },
  { id: 'presensi', label: 'Presensi Makan', icon: CalendarDays, href: '/siswa/presensi' },
  { id: 'notices', label: 'Pengumuman Sekolah', icon: Megaphone, href: '/siswa/notices' },
  { id: 'aduan', label: 'Aduan & Masukan', icon: MessageSquareWarning, href: '/siswa/aduan' },
]

const SISWA_NOTIFICATIONS = [
  {
    id: 's-notif-1',
    title: 'Porsi Hari Ini Terverifikasi',
    desc: 'Boks BATCH-JKT-1006-05 lolos scan validator pada 07:14 WIB. Selamat makan siang!',
    time: '10 menit lalu',
    urgency: 'success',
    href: '/siswa/scans',
    read: false,
  },
  {
    id: 's-notif-2',
    title: 'Menu Esok Hari: Paket C - Ikan Patin Bumbu Kuning',
    desc: 'Siklus menu Hari Ke-3. Berikan rating setelah makan untuk evaluasi mutu.',
    time: '1 jam lalu',
    urgency: 'info',
    href: '/siswa/menu',
    read: false,
  },
  {
    id: 's-notif-3',
    title: 'Aduan #ADR/SISWA/1003/04 Sedang Ditindaklanjuti',
    desc: 'Tim SPPG sedang mengkaji mekanisme tutup boks yang lebih ringan.',
    time: '3 hari lalu',
    urgency: 'warning',
    href: '/siswa/aduan',
    read: true,
  },
]

/**
 * Portal Siswa layout: sidebar ringan + topbar + notifikasi sederhana.
 * Dipakai untuk seluruh rute /siswa/*.
 */
export function SiswaLayout({ activeMenu = 'dashboard', title, badge, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(SISWA_NOTIFICATIONS)
  const [toastMessage, setToastMessage] = useState(null)
  const notifRef = useRef(null)

  const { user, logout } = useAuth()
  const initials = (user?.fullName || user?.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!toastMessage) return
    const t = setTimeout(() => setToastMessage(null), 3200)
    return () => clearTimeout(t)
  }, [toastMessage])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false)
        setIsNotifOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleNotifClick = (notif) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
    setIsNotifOpen(false)
    if (notif.href) navigate(notif.href)
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 font-sans antialiased flex flex-col lg:flex-row">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:z-30 lg:translate-x-0 shadow-sm overflow-hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="bg-gradient-to-b from-emerald-600 via-teal-600 to-cyan-700 text-white px-5 py-6 rounded-b-[28px] text-center shadow-md relative overflow-hidden shrink-0">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-2.5 border border-white/20">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h2 className="font-extrabold text-lg tracking-tight text-white">KawanGizi Siswa</h2>
              <p className="text-emerald-100 text-[11px] leading-snug mt-1 font-medium opacity-90">
                Pantau porsi makan bergizi harianmu
              </p>
            </div>
          </div>

          <nav className="p-4 space-y-1 flex-1">
            {SISWA_SIDEBAR_MENU.map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setIsSidebarOpen(false)
                    navigate(item.href)
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5 text-rose-500" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white px-4 sm:px-6 py-3 border-b border-slate-200/70 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
              {badge && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 font-mono">
                  {badge}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden xl:inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-semibold text-slate-600">
              Data simulasi
            </span>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((p) => !p)}
                className={`relative p-2 text-slate-500 hover:text-slate-800 transition rounded-xl hover:bg-slate-100 cursor-pointer ${
                  isNotifOpen ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20' : ''
                }`}
                aria-label="Pusat Notifikasi"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-[310px] sm:w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 border-b border-slate-100 bg-slate-50/80">
                    <h3 className="font-extrabold text-slate-900 text-sm">Notifikasi Saya</h3>
                    <p className="text-[11px] text-slate-500">Pembaruan porsi, menu & aduan</p>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((notif) => {
                      let iconBg = 'bg-blue-100 text-blue-700'
                      let IconComp = Bell
                      if (notif.urgency === 'success') {
                        iconBg = 'bg-emerald-100 text-emerald-700'
                        IconComp = CheckCircle2
                      } else if (notif.urgency === 'warning') {
                        iconBg = 'bg-amber-100 text-amber-700'
                        IconComp = AlertTriangle
                      } else if (notif.urgency === 'info') {
                        iconBg = 'bg-cyan-100 text-cyan-700'
                        IconComp = Info
                      }
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer ${
                            !notif.read ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconBg}`}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs leading-snug ${
                                !notif.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                              }`}
                            >
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mt-0.5">
                              {notif.desc}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 inline-block">{notif.time}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User chip */}
            <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 border border-white/20">
                {initials}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-900">{user?.fullName || 'Siswa'}</p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {user?.schoolName || 'Siswa Penerima MBG'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">{children}</main>

        <footer className="bg-white border-t border-slate-200/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-extrabold text-slate-700 tracking-tight">BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA</span>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span className="text-slate-500">Portal Siswa Program Makan Bergizi Gratis</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px]">
            <span>Rancangan prototipe</span>
            <span aria-hidden="true">&bull;</span>
            <span>ICONFEST 2026</span>
          </div>
        </footer>
      </div>

      {/* mobile close for sidebar (ESC handled above) */}
      {isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed top-3 left-[260px] z-50 p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-500"
          aria-label="Tutup Menu"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
