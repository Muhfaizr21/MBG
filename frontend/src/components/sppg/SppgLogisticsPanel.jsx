import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts'
import {
  Printer,
  X,
  MapPin,
  Bell,
  ArrowLeftRight,
  Building2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Truck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchSppgLogisticsBundle,
  fetchSppgList,
  dispatchSppgBackupFleet,
  sendSppgDeliveryNotification,
  submitSppgLogisticsIntervention,
} from '../../lib/api'
import {
  LATEST_ARRIVAL,
  TEMP_FLOOR,
  SLOW_KPH,
  etaMinutes,
  arrivalClock,
  isOnTime,
  tempOk,
  fleetIssue,
  notifyText,
} from '../../data/sppgLogisticsData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const THEAD = 'border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600'
const GHOST = `rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] ${FOCUS}`

function toMinutes(clock) {
  if (!clock) return 0
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

function dot(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export function SppgLogisticsPanel() {
  const { user, isSuperadmin } = useAuth()

  // Ruang dapur aktif (multi-tenant per SPPG)
  const [activeSppgId, setActiveSppgId] = useState(() => {
    if (user?.sppgId) return user.sppgId
    return 'SPPG-01'
  })

  const [isLoadingBundle, setIsLoadingBundle] = useState(false)
  const [kitchenName, setKitchenName] = useState('Memuat Dapur...')
  const [kitchenCode, setKitchenCode] = useState('SPPG')
  const [depot, setDepot] = useState({ lat: -6.1955, lng: 106.8305, name: 'Dapur SPPG' })
  const [sessionClock, setSessionClock] = useState('07:02')
  const [fleets, setFleets] = useState([])
  const [backup, setBackup] = useState(null)
  const [schoolCoords, setSchoolCoords] = useState({})

  const [kitchenOptions, setKitchenOptions] = useState([
    { id: 'SPPG-01', name: 'SPPG Sentral Menteng 01' },
    { id: 'SPPG-02', name: 'SPPG Kebayoran Baru Mandiri' },
  ])

  // Modals & User Actions
  const [letterId, setLetterId] = useState(null)
  const [printLetter, setPrintLetter] = useState(null)
  const [dispatchId, setDispatchId] = useState(null)
  const [isDispatching, setIsDispatching] = useState(false)
  const [notifyId, setNotifyId] = useState(null)
  const [notifyPhone, setNotifyPhone] = useState('')
  const [copied, setCopied] = useState(false)
  const [notifyOk, setNotifyOk] = useState('')

  // Superadmin Intervention Modal
  const [interventionFleetId, setInterventionFleetId] = useState(null)
  const [interventionAction, setInterventionAction] = useState('recall')
  const [interventionReason, setInterventionReason] = useState('')
  const [interventionError, setInterventionError] = useState('')
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false)

  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layersRef = useRef(null)

  // Sinkronisasi otomatis dapur untuk staf SPPG
  useEffect(() => {
    if (!isSuperadmin && user?.sppgId) {
      setActiveSppgId(user.sppgId)
    }
  }, [user?.sppgId, isSuperadmin])

  // Muat daftar seluruh dapur aktif dari PostgreSQL untuk Superadmin
  useEffect(() => {
    if (isSuperadmin) {
      fetchSppgList()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setKitchenOptions(
              data.map((k) => ({
                id: k.id,
                name: k.name || k.id,
                code: k.code || k.id,
              }))
            )
          }
        })
        .catch((err) => console.warn('Gagal memuat daftar SPPG:', err))
    }
  }, [isSuperadmin])

  // Load bundle logistik lengkap dari server
  const loadBundle = useCallback(async (sppgIdToFetch) => {
    setIsLoadingBundle(true)
    try {
      const data = await fetchSppgLogisticsBundle(sppgIdToFetch)
      if (data) {
        if (data.kitchenName) setKitchenName(data.kitchenName)
        if (data.kitchenCode) setKitchenCode(data.kitchenCode)
        if (data.depot) setDepot(data.depot)
        if (data.sessionClock) setSessionClock(data.sessionClock)
        if (data.fleets && Array.isArray(data.fleets)) {
          setFleets(data.fleets)
        }
        if (data.backupFleet) {
          setBackup(data.backupFleet)
        } else {
          setBackup(null)
        }
        if (data.schoolCoords) {
          setSchoolCoords(data.schoolCoords)
        }
      }
    } catch (err) {
      console.warn('Gagal memuat bundle logistik dari server:', err)
    } finally {
      setIsLoadingBundle(false)
    }
  }, [])

  useEffect(() => {
    loadBundle(activeSppgId)
  }, [activeSppgId, loadBundle])

  const nowMinutes = toMinutes(sessionClock)

  const stats = useMemo(() => {
    const issues = fleets.filter((f) => fleetIssue(f))
    return {
      moving: fleets.filter((f) => f.status === 'jalan').length,
      total: fleets.length,
      onTime: fleets.filter((f) => isOnTime(f, nowMinutes)).length,
      issues: issues.length,
      cold: fleets.filter((f) => !tempOk(f)).length,
    }
  }, [fleets, nowMinutes])

  const chartData = useMemo(() => {
    const steps = ['+0 mnt', '+5 mnt', '+10 mnt', '+15 mnt']
    return steps.map((m, i) => {
      const row = { m }
      fleets.forEach((f) => {
        row[f.plate] = f.tempSeries && f.tempSeries[i] ? f.tempSeries[i].temp : null
      })
      return row
    })
  }, [fleets])

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const map = L.map(mapRef.current, {
      center: [depot.lat, depot.lng],
      zoom: 13,
      scrollWheelZoom: false,
      attributionControl: false,
    })
    L.control.attribution({ position: 'bottomright', prefix: 'Esri GIS' }).addTo(map)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16 }
    ).addTo(map)
    layersRef.current = L.layerGroup().addTo(map)
    mapInstance.current = map
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => {
      clearTimeout(t)
      map.remove()
      mapInstance.current = null
    }
  }, [depot.lat, depot.lng])

  // Render layer titik depot, sekolah tujuan, dan pergerakan armada
  useEffect(() => {
    const map = mapInstance.current
    const layers = layersRef.current
    if (!map || !layers) return
    layers.clearLayers()

    // Titik Depot Dapur SPPG
    L.marker([depot.lat, depot.lng], { icon: dot('#23259C') })
      .bindPopup(`<b>${depot.name}</b><br>Sentral Pengolahan & Pengiriman`)
      .addTo(layers)

    // Titik Sekolah-sekolah Binaan
    Object.values(schoolCoords).forEach((sc) => {
      if (sc.lat && sc.lng) {
        L.marker([sc.lat, sc.lng], { icon: dot('#64748B') })
          .bindPopup(`<b>${sc.name}</b><br>Penerima MBG`)
          .addTo(layers)
      }
    })

    // Titik Armada Bergerak
    fleets.forEach((f) => {
      const targetLat = f.schoolLat || (schoolCoords[f.schoolId]?.lat) || (depot.lat + 0.01)
      const targetLng = f.schoolLng || (schoolCoords[f.schoolId]?.lng) || (depot.lng + 0.01)

      // Interpolasi posisi GPS berdasarkan progress perjalanan
      const posLat = depot.lat + (targetLat - depot.lat) * (f.progress || 0)
      const posLng = depot.lng + (targetLng - depot.lng) * (f.progress || 0)

      const issue = fleetIssue(f)
      const color = issue ? '#E11D48' : '#059669'
      const eta = etaMinutes(f)

      // Garis rute dari dapur ke sekolah tujuan
      L.polyline(
        [
          [depot.lat, depot.lng],
          [targetLat, targetLng],
        ],
        { color: issue ? '#E11D48' : '#23259C', weight: 2, dashArray: '5 5', opacity: 0.6 }
      ).addTo(layers)

      // Marker kendaraan
      L.marker([posLat, posLng], { icon: dot(color) })
        .bindPopup(
          `<b>${f.plate} (${f.type})</b><br>` +
          `Sopir: ${f.driver}<br>` +
          `Tujuan: ${f.schoolName || 'Sekolah Binaan'}<br>` +
          `Muatan: ${f.boxCount} boks (${f.batchToken})<br>` +
          `ETA: ${eta === null ? 'tertahan' : `${eta} mnt`} · Suhu: ${f.boxTempC}°C`
        )
        .addTo(layers)
    })
  }, [fleets, depot, schoolCoords])

  // ESC Listener untuk Modal
  useEffect(() => {
    if (!dispatchId && !notifyId && !letterId && !interventionFleetId) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDispatchId(null)
        setNotifyId(null)
        setLetterId(null)
        setInterventionFleetId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatchId, notifyId, letterId, interventionFleetId])

  useEffect(() => {
    if (!printLetter) return
    const t = setTimeout(() => window.print(), 150)
    return () => clearTimeout(t)
  }, [printLetter])

  // Handler Dispatch Armada Cadangan ke Database
  async function handleDispatch() {
    if (!dispatchId) return
    setIsDispatching(true)
    try {
      const res = await dispatchSppgBackupFleet(dispatchId, activeSppgId)
      if (res) {
        // Muat ulang data terbaru dari PostgreSQL
        await loadBundle(activeSppgId)
      }
    } catch (err) {
      console.warn('Gagal menerjunkan armada cadangan:', err)
    } finally {
      setIsDispatching(false)
      setDispatchId(null)
    }
  }

  // Handler Kirim / Rekam Notifikasi Siaran ke Database
  async function handleSendNotification(e) {
    e.preventDefault()
    if (!notifyId) return
    const targetFleet = fleets.find((f) => f.id === notifyId)
    if (!targetFleet) return

    const message = notifyText(targetFleet, targetFleet.schoolName || 'Sekolah Binaan', nowMinutes)
    try {
      await sendSppgDeliveryNotification(notifyId, {
        recipientPhone: notifyPhone.trim(),
        message,
      }, activeSppgId)
      setNotifyOk('Pesan siaran estimasi tiba berhasil dicatat ke sistem.')
      setTimeout(() => {
        setNotifyId(null)
        setNotifyOk('')
      }, 1200)
    } catch (err) {
      console.warn('Gagal mencatat siaran pesan:', err)
    }
  }

  // Handler Intervensi Logistik Superadmin
  async function handleInterventionSubmit(e) {
    e.preventDefault()
    if (!interventionFleetId) return
    if (!interventionReason || interventionReason.trim().length < 5) {
      setInterventionError('Alasan intervensi wajib diisi minimal 5 karakter untuk jejak audit forensik.')
      return
    }

    setIsSubmittingIntervention(true)
    setInterventionError('')
    try {
      await submitSppgLogisticsIntervention({
        fleetId: interventionFleetId,
        action: interventionAction,
        reason: interventionReason.trim(),
      }, activeSppgId)

      await loadBundle(activeSppgId)
      setInterventionFleetId(null)
      setInterventionReason('')
    } catch (err) {
      setInterventionError(err.message || 'Gagal mengeksekusi tindakan intervensi logistik.')
    } finally {
      setIsSubmittingIntervention(false)
    }
  }

  const letterFleet = fleets.find((f) => f.id === letterId) || null
  const dispatchFleet = fleets.find((f) => f.id === dispatchId) || null
  const notifyFleet = fleets.find((f) => f.id === notifyId) || null
  const interventionFleet = fleets.find((f) => f.id === interventionFleetId) || null
  const troubled = fleets.filter((f) => fleetIssue(f))

  return (
    <div className="space-y-5">
      <style>{`@page{size:A5;margin:8mm}.letter-print-sheet{display:none}@media print{body *{visibility:hidden}.letter-print-sheet,.letter-print-sheet *{visibility:visible}.letter-print-sheet{display:block !important;position:absolute;inset:0}}`}</style>

      {/* ========================================================================= */}
      {/* MULTI-TENANT WORKSPACE BAR (TERKONEKSI SUPERADMIN & DAPUR ISOLASI)        */}
      {/* ========================================================================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 px-5 py-3 text-white shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-amber-400">
                Logistik & Rute Pengantaran MBG
              </p>
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-white">
                <span>{kitchenName}</span>
                <span className="text-xs font-normal text-slate-300">
                  · Armada Siap: <strong className="font-bold text-emerald-400">{stats.moving}/{stats.total}</strong>
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSuperadmin ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 p-1.5 text-xs">
                <span className="pl-1 font-semibold text-[11px] text-slate-300">
                  Inspeksi Dapur:
                </span>
                <select
                  value={activeSppgId}
                  onChange={(e) => setActiveSppgId(e.target.value)}
                  className="cursor-pointer rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  {kitchenOptions.map((k) => (
                    <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                      {k.id} · {k.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-300">
                Unit Terisolasi: <strong className="text-white">{user?.fullName || kitchenName}</strong>
              </div>
            )}

            <button
              onClick={() => loadBundle(activeSppgId)}
              disabled={isLoadingBundle}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
              title="Sinkronisasi data logistik dari server"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBundle ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERO BANNER & KPI METRICS                                                 */}
      {/* ========================================================================= */}
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              {kitchenCode} · BATAS TIBA {LATEST_ARRIVAL} WIB
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Armada dan logistik rute
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Radius 45 menit, suhu boks di atas {TEMP_FLOOR}°C, tiba sebelum {LATEST_ARRIVAL} WIB.
              Peringatan muncul otomatis dari pembacaan sensor IoT dan telemetri laju kendaraan.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">TEPAT WAKTU</p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight text-white">
              {stats.onTime}
              <span className="text-2xl text-white/50">/{stats.total}</span>
            </p>
            <p className="mt-2 text-[11px] font-medium text-white/70">
              {stats.moving} bergerak · {stats.issues} perlu perhatian · {stats.cold} suhu kritis
            </p>
          </div>
        </div>
      </section>

      {/* ALERT ARMADA BERMASALAH & DISPATCH CADANGAN */}
      {troubled.length > 0 && (
        <div role="alert" className="space-y-2">
          {troubled.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-xs"
            >
              <div>
                <p className="font-bold text-rose-900">
                  {f.plate} ({fleetIssue(f)}) menuju {f.schoolName || 'Sekolah Tujuan'}.
                </p>
                <p className="mt-0.5 text-[11px] text-rose-800">
                  {backup && backup.status === 'siaga'
                    ? `Armada cadangan ${backup.plate} siaga di dapur dan siap mengambil alih muatan ${f.boxCount} boks.`
                    : 'Armada cadangan sedang bertugas / tidak siaga. Segera hubungi koordinator logistik.'}
                </p>
              </div>
              {backup && backup.status === 'siaga' && (
                <button
                  type="button"
                  onClick={() => setDispatchId(f.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Dispatch cadangan
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIP 01: PETA PELACAK GPS ARMADA                                          */}
      {/* ========================================================================= */}
      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="px-5 pt-5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · POSISI ARMADA</p>
          <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
            Peta pelacak GPS
          </h2>
        </div>
        <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
        <div className="px-5 pb-2">
          <div ref={mapRef} className="h-[380px] w-full rounded-xl border border-slate-200" role="img" aria-label="Peta posisi armada dapur menuju sekolah" />
          <div className="flex flex-wrap gap-x-5 gap-y-1 py-3 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#23259C]" /> Dapur {kitchenName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Sekolah tujuan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Armada lancar
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> Armada perlu perhatian
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIP 02: TELEMETRI SENSOR SUHU BOKS (IOT RUTE)                            */}
      {/* ========================================================================= */}
      <div className={`p-5 text-xs ${CARD}`}>
        <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · SENSOR BOKS</p>
        <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
          Apakah suhu semua boks bertahan di atas {TEMP_FLOOR}°C?
        </h2>
        <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="#64748B" />
              <YAxis domain={[58, 66]} tick={{ fontSize: 11 }} stroke="#64748B" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={TEMP_FLOOR} stroke="#E11D48" strokeDasharray="5 4" label={{ value: 'Batas 60°C', fontSize: 10, fill: '#E11D48' }} />
              {fleets.map((f, i) => (
                <Line
                  key={f.id}
                  type="monotone"
                  dataKey={f.plate}
                  stroke={['#23259C', '#D97706', '#059669', '#E11D48', '#8B5CF6'][i % 5]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIP 03: DAFTAR STATUS PERJALANAN PER ARMADA                             */}
      {/* ========================================================================= */}
      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · DAFTAR ARMADA</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Status perjalanan per armada
            </h2>
          </div>
          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
            Jam sesi
            <input
              type="time"
              value={sessionClock}
              onChange={(e) => setSessionClock(e.target.value)}
              className={`rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs tabular-nums text-slate-800 ${FOCUS}`}
            />
          </label>
        </div>
        <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
        
        {fleets.length === 0 ? (
          <p className="px-5 py-8 text-center text-[11px] text-slate-500">
            Belum ada data armada pengantaran untuk dapur ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-xs">
              <thead className={THEAD}>
                <tr>
                  <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                  <th scope="col" className="px-3 py-2.5">Armada</th>
                  <th scope="col" className="px-3 py-2.5">Tujuan & Batch</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Laju</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Suhu boks</th>
                  <th scope="col" className="px-3 py-2.5 text-right">ETA</th>
                  <th scope="col" className="px-3 py-2.5">Tiba</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                  <th scope="col" className="px-4 py-2.5 text-center">Aksi Operasional</th>
                  {isSuperadmin && <th scope="col" className="px-3 py-2.5 text-center">Audit BGN</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fleets.map((f, i) => {
                  const eta = etaMinutes(f)
                  const issue = fleetIssue(f)
                  const onTime = isOnTime(f, nowMinutes)
                  return (
                    <tr key={f.id} className="transition hover:bg-[#23259C]/[0.03]">
                      <td className="px-4 py-3 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-[11px] font-bold text-slate-900">{f.plate}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{f.type}</p>
                        <p className="text-[10px] text-slate-400">Sopir: {f.driver}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-800">{f.schoolName || 'Sekolah Binaan'}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">{f.batchToken}</p>
                        <p className="text-[10px] text-slate-400">{f.boxCount} boks muatan</p>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {f.speedKph}
                        <span className="font-normal text-slate-500"> km/jam</span>
                      </td>
                      <td className={`px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums ${tempOk(f) ? 'text-slate-900' : 'text-rose-700'}`}>
                        {f.boxTempC}°C
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {eta === null ? 'tertahan' : `${eta} mnt`}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {arrivalClock(f, nowMinutes)} WIB
                        <span className={`block text-[11px] font-semibold ${onTime ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {onTime ? 'Tiba tepat waktu' : 'Lewat batas 07:15'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            issue
                              ? 'bg-rose-50 text-rose-800'
                              : f.status === 'kembali'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {issue || (f.status === 'kembali' ? 'Kembali ke dapur' : 'Berjalan lancar')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => setLetterId(f.id)} className={GHOST}>
                            Surat jalan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifyId(f.id)
                              setNotifyPhone(f.driverPhone || '')
                              setCopied(false)
                              setNotifyOk('')
                            }}
                            className={GHOST}
                          >
                            Notifikasi
                          </button>
                        </div>
                      </td>
                      {isSuperadmin && (
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setInterventionFleetId(f.id)
                              setInterventionAction('recall')
                              setInterventionReason('')
                              setInterventionError('')
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                          >
                            <ShieldAlert className="h-3 w-3" />
                            Intervensi
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL SURAT JALAN ARMADA                                                  */}
      {/* ========================================================================= */}
      {letterFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label={`Surat jalan ${letterFleet.plate}`} className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-1">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-slate-500">SURAT JALAN RESMI BGN</p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                  {letterFleet.plate} · {letterFleet.schoolName || 'Sekolah Penerima'}
                </h2>
              </div>
              <button type="button" onClick={() => setLetterId(null)} aria-label="Tutup surat jalan" className={`rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 ${FOCUS}`}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              {[
                ['Kendaraan', `${letterFleet.plate} · ${letterFleet.type}`],
                ['Pengemudi', `${letterFleet.driver} · Darurat: ${letterFleet.emergencyPhone || '-'}`],
                ['Batch Muatan', letterFleet.batchToken || '-'],
                ['Jumlah Boks', `${letterFleet.boxCount} boks`],
                ['Waktu Berangkat', `${letterFleet.departAt || '06:45'} WIB dari ${depot.name}`],
                ['Estimasi Tiba', `${arrivalClock(letterFleet, nowMinutes)} WIB`],
                ['Suhu Awal Boks', `${letterFleet.boxTempC}°C (Ambang batas min ${TEMP_FLOOR}°C)`],
                ['Unit Penerbit', `Dapur Sentral ${kitchenName}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold text-slate-500">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setPrintLetter(letterFleet); setLetterId(null) }} className={BTN}>
                <Printer className="h-4 w-4" />
                Cetak surat jalan
              </button>
              <button type="button" onClick={() => setLetterId(null)} className={`rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DISPATCH CADANGAN                                                   */}
      {/* ========================================================================= */}
      {dispatchFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Dispatch armada cadangan" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">DISPATCH DARURAT LOGISTIK</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Alihkan muatan {dispatchFleet.plate}?
            </h2>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
            <p className="text-xs leading-relaxed text-slate-600">
              Armada cadangan <strong>{backup?.plate || 'Cadangan'}</strong> akan diterjunkan untuk mengambil alih {dispatchFleet.boxCount} boks muatan {dispatchFleet.batchToken} menuju {dispatchFleet.schoolName}.
              Armada {dispatchFleet.plate} akan diinstruksikan kembali ke dapur untuk pemeriksaan teknis.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={handleDispatch} disabled={isDispatching} className={BTN}>
                <ArrowLeftRight className="h-4 w-4" />
                {isDispatching ? 'Menerjunkan...' : 'Alihkan sekarang'}
              </button>
              <button type="button" onClick={() => setDispatchId(null)} className={`rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NOTIFIKASI ESTIMASI TIBA KE SEKOLAH                                 */}
      {/* ========================================================================= */}
      {notifyFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Notifikasi estimasi tiba" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SIAR KE SEKOLAH</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
              <Bell className="h-4 w-4 text-[#23259C]" />
              Estimasi tiba {notifyFleet.plate}
            </h2>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
            {notifyOk && (
              <p className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
                {notifyOk}
              </p>
            )}
            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Pesan broadcast resmi
                </label>
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                  {notifyText(notifyFleet, notifyFleet.schoolName || 'Sekolah Binaan', nowMinutes)}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nomor kontak validator sekolah / guru piket
                </label>
                <input
                  type="text"
                  value={notifyPhone}
                  onChange={(e) => setNotifyPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        notifyText(notifyFleet, notifyFleet.schoolName || 'Sekolah Binaan', nowMinutes)
                      )
                      setCopied(true)
                    } catch {
                      setCopied(false)
                    }
                  }}
                  className={`rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}
                >
                  {copied ? 'Tersalin!' : 'Salin teks'}
                </button>
                <button type="submit" className={BTN}>
                  Kirim & Simpan ke Server
                </button>
                <button type="button" onClick={() => setNotifyId(null)} className={`rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}>
                  Tutup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INTERVENSI LOGISTIK SUPERADMIN BGN                                 */}
      {/* ========================================================================= */}
      {isSuperadmin && interventionFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Intervensi Logistik Superadmin" className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-1">
              <div>
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                  <ShieldAlert className="h-3 w-3" />
                  Kewenangan Superadmin BGN
                </span>
                <h2 className="mt-1 text-base font-extrabold text-slate-900">
                  Intervensi Rute Logistik ({interventionFleet.plate})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInterventionFleetId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />

            {interventionError && (
              <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] font-semibold text-rose-800">
                {interventionError}
              </p>
            )}

            <form onSubmit={handleInterventionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Pilih Tindakan Intervensi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'recall', label: 'Tarik Balik (Recall)', desc: 'Kembali ke dapur' },
                    { id: 'reroute', label: 'Alihkan Rute', desc: 'Jalur alternatif' },
                    { id: 'cooling_check', label: 'Audit Rantai Dingin', desc: 'Verifikasi sensor' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setInterventionAction(act.id)}
                      className={`cursor-pointer rounded-xl border p-2.5 text-left transition ${
                        interventionAction === act.id
                          ? 'border-rose-600 bg-rose-50 text-rose-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold text-[11px]">{act.label}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{act.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Alasan Intervensi / Catatan Audit Forensik
                </label>
                <textarea
                  rows="3"
                  value={interventionReason}
                  onChange={(e) => setInterventionReason(e.target.value)}
                  placeholder="Contoh: Kemacetan kritis > 20 menit berisiko menjatuhkan suhu boks di bawah 60°C sebelum tiba di sekolah."
                  className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 ${FOCUS}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInterventionFleetId(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIntervention}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  <AlertOctagon className="h-4 w-4" />
                  {isSubmittingIntervention ? 'Mengeksekusi...' : 'Eksekusi Intervensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT SHEET UNTUK SURAT JALAN FISIK */}
      <div className="letter-print-sheet" aria-hidden="true">
        {printLetter && (
          <div style={{ color: '#000', background: '#fff', padding: 16, fontFamily: 'sans-serif' }}>
            <p style={{ fontSize: 18, fontWeight: 800 }}>SURAT JALAN PENGANTARAN MBG RESMI</p>
            <p style={{ fontSize: 12 }}>Dapur {kitchenName} · Sesi Pengantaran Pagi</p>
            <hr />
            <p style={{ fontSize: 13 }}>Kendaraan: {printLetter.plate} · {printLetter.type}</p>
            <p style={{ fontSize: 13 }}>Sopir: {printLetter.driver} · Darurat: {printLetter.emergencyPhone || '-'}</p>
            <p style={{ fontSize: 13 }}>Sekolah Tujuan: {printLetter.schoolName}</p>
            <p style={{ fontSize: 13 }}>Muatan: {printLetter.boxCount} boks · Token: {printLetter.batchToken}</p>
            <p style={{ fontSize: 13 }}>Berangkat: {printLetter.departAt} WIB · ETA Tiba: {arrivalClock(printLetter, nowMinutes)} WIB</p>
            <p style={{ fontSize: 13 }}>Suhu Boks Awal: {printLetter.boxTempC}°C</p>
            <br />
            <p style={{ fontSize: 12 }}>Pengemudi: (....................) · Guru Penerima: (....................)</p>
          </div>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Posisi armada dan telemetri IoT terhubung langsung ke database PostgreSQL secara multi-tenant.
        Surat jalan resmi dicetak lewat dialog cetak browser sesuai standar BGN.
      </p>
    </div>
  )
}
