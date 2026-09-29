import { useState, useMemo, useEffect, useRef } from 'react'
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
} from 'lucide-react'
import { ASSIGNED_SCHOOLS_MANIFEST } from '../../data/sppgPortalData'
import {
  DEPOT,
  SCHOOL_COORDS,
  LATEST_ARRIVAL,
  TEMP_FLOOR,
  FLEETS,
  BACKUP_FLEET,
  etaMinutes,
  arrivalClock,
  isOnTime,
  tempOk,
  fleetIssue,
  fleetPosition,
  notifyText,
} from '../../data/sppgLogisticsData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const THEAD = 'border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600'
const GHOST = `rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] ${FOCUS}`

function toMinutes(clock) {
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
  const [fleets, setFleets] = useState(FLEETS)
  const [backup, setBackup] = useState(BACKUP_FLEET)
  const [sessionClock, setSessionClock] = useState('07:02')
  const [letterId, setLetterId] = useState(null)
  const [printLetter, setPrintLetter] = useState(null)
  const [dispatchId, setDispatchId] = useState(null)
  const [notifyId, setNotifyId] = useState(null)
  const [copied, setCopied] = useState(false)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layersRef = useRef(null)

  const nowMinutes = toMinutes(sessionClock)
  const schoolById = useMemo(() => {
    const map = {}
    ASSIGNED_SCHOOLS_MANIFEST.forEach((s) => {
      map[s.id] = s
    })
    return map
  }, [])

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
        row[f.plate] = f.tempSeries[i] ? f.tempSeries[i].temp : null
      })
      return row
    })
  }, [fleets])

  // Peta digambar ulang setiap data armada berubah.
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const map = L.map(mapRef.current, {
      center: [DEPOT.lat, DEPOT.lng],
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
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    const layers = layersRef.current
    if (!map || !layers) return
    layers.clearLayers()
    L.marker([DEPOT.lat, DEPOT.lng], { icon: dot('#23259C') })
      .bindPopup(`<b>${DEPOT.name}</b>`)
      .addTo(layers)
    Object.entries(SCHOOL_COORDS).forEach(([id, c]) => {
      const s = schoolById[id]
      L.marker([c.lat, c.lng], { icon: dot('#64748B') })
        .bindPopup(`<b>${s ? s.name : id}</b>`)
        .addTo(layers)
    })
    fleets.forEach((f) => {
      const pos = fleetPosition(f)
      const issue = fleetIssue(f)
      const color = issue ? '#E11D48' : '#059669'
      const eta = etaMinutes(f)
      const s = schoolById[f.schoolId]
      const dest = SCHOOL_COORDS[f.schoolId]
      if (dest) {
        L.polyline(
          [
            [DEPOT.lat, DEPOT.lng],
            [dest.lat, dest.lng],
          ],
          { color: issue ? '#E11D48' : '#23259C', weight: 2, dashArray: '5 5', opacity: 0.6 }
        ).addTo(layers)
      }
      L.marker([pos.lat, pos.lng], { icon: dot(color) })
        .bindPopup(
          `<b>${f.plate}</b><br>${s ? s.name : ''}<br>ETA ${eta === null ? 'tertahan' : `${eta} mnt`} · ${f.boxTempC}C`
        )
        .addTo(layers)
    })
  }, [fleets, schoolById])

  useEffect(() => {
    if (!dispatchId && !notifyId && !letterId) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDispatchId(null)
        setNotifyId(null)
        setLetterId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatchId, notifyId, letterId])

  useEffect(() => {
    if (!printLetter) return
    const t = setTimeout(() => window.print(), 150)
    return () => clearTimeout(t)
  }, [printLetter])

  function handleDispatch() {
    const troubled = fleets.find((f) => f.id === dispatchId)
    if (!troubled || backup.status !== 'siaga') {
      setDispatchId(null)
      return
    }
    setFleets((list) =>
      list.map((f) =>
        f.id === troubled.id
          ? { ...f, status: 'kembali', speedKph: 0 }
          : f
      )
    )
    setBackup((b) => ({
      ...b,
      status: 'jalan',
      schoolId: troubled.schoolId,
      batchToken: troubled.batchToken,
      boxCount: troubled.boxCount,
      distanceKm: troubled.distanceKm,
      speedKph: 30,
      departAt: sessionClock,
      progress: 0,
      boxTempC: troubled.boxTempC,
    }))
    setDispatchId(null)
  }

  const letterFleet = fleets.find((f) => f.id === letterId) || null
  const dispatchFleet = fleets.find((f) => f.id === dispatchId) || null
  const notifyFleet = fleets.find((f) => f.id === notifyId) || null
  const troubled = fleets.filter((f) => fleetIssue(f))

  return (
    <div className="space-y-5">
      <style>{`@page{size:A5;margin:8mm}.letter-print-sheet{display:none}@media print{body *{visibility:hidden}.letter-print-sheet,.letter-print-sheet *{visibility:visible}.letter-print-sheet{display:block !important;position:absolute;inset:0}}`}</style>

      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              SPPG-01 · SELASA, 29 SEPT 2026 · BATAS TIBA {LATEST_ARRIVAL} WIB
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Armada dan logistik rute
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Radius 45 menit, suhu boks di atas {TEMP_FLOOR}C, tiba sebelum {LATEST_ARRIVAL} WIB.
              Peringatan muncul dari hitungan, bukan dari laporan manual.
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

      {troubled.length > 0 && (
        <div role="alert" className="space-y-2">
          {troubled.map((f) => {
            const s = schoolById[f.schoolId]
            return (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-xs"
              >
                <div>
                  <p className="font-bold text-rose-900">
                    {f.plate} {fleetIssue(f)} menuju {s ? s.name : ''}.
                  </p>
                  <p className="mt-0.5 text-[11px] text-rose-800">
                    {backup.status === 'siaga'
                      ? `Armada cadangan ${backup.plate} siaga di dapur dan bisa mengambil muatan ${f.boxCount} boks.`
                      : 'Armada cadangan sudah diterjunkan. Pantau suhu boks armada ini.'}
                  </p>
                </div>
                {backup.status === 'siaga' && (
                  <button type="button" onClick={() => setDispatchId(f.id)} className={BTN}>
                    <ArrowLeftRight className="h-4 w-4" />
                    Dispatch cadangan
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

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
              <span className="h-2.5 w-2.5 rounded-full bg-[#23259C]" /> Dapur SPPG-01
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

      <div className={`p-5 text-xs ${CARD}`}>
        <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · SENSOR BOKS</p>
        <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
          Apakah suhu semua boks bertahan di atas {TEMP_FLOOR}C?
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
              <ReferenceLine y={TEMP_FLOOR} stroke="#E11D48" strokeDasharray="5 4" label={{ value: 'Batas 60C', fontSize: 10, fill: '#E11D48' }} />
              {fleets.map((f, i) => (
                <Line
                  key={f.id}
                  type="monotone"
                  dataKey={f.plate}
                  stroke={['#23259C', '#D97706', '#059669', '#E11D48'][i % 4]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-xs">
            <thead className={THEAD}>
              <tr>
                <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                <th scope="col" className="px-3 py-2.5">Armada</th>
                <th scope="col" className="px-3 py-2.5">Tujuan</th>
                <th scope="col" className="px-3 py-2.5 text-right">Laju</th>
                <th scope="col" className="px-3 py-2.5 text-right">Suhu boks</th>
                <th scope="col" className="px-3 py-2.5 text-right">ETA</th>
                <th scope="col" className="px-3 py-2.5">Tiba</th>
                <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                <th scope="col" className="px-4 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fleets.map((f, i) => {
                const s = schoolById[f.schoolId]
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
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-800">{s ? s.name : ''}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">{f.batchToken}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {f.speedKph}
                      <span className="font-normal text-slate-500"> km/jam</span>
                    </td>
                    <td className={`px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums ${tempOk(f) ? 'text-slate-900' : 'text-rose-700'}`}>
                      {f.boxTempC}C
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {eta === null ? 'tertahan' : `${eta} mnt`}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {arrivalClock(f, nowMinutes)} WIB
                      <span className={`block text-[11px] font-semibold ${onTime ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {onTime ? 'Tiba sebelum batas' : 'Lewat batas 07:15'}
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
                        <button type="button" onClick={() => { setNotifyId(f.id); setCopied(false) }} className={GHOST}>
                          Notifikasi
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {letterFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label={`Surat jalan ${letterFleet.plate}`} className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-1">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-slate-500">SURAT JALAN ARMADA</p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                  {letterFleet.plate} · {schoolById[letterFleet.schoolId]?.name}
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
                ['Sopir', `${letterFleet.driver} · darurat ${letterFleet.emergencyPhone}`],
                ['Batch muatan', letterFleet.batchToken],
                ['Jumlah', `${letterFleet.boxCount} boks`],
                ['Berangkat', `${letterFleet.departAt} WIB dari ${DEPOT.name}`],
                ['ETA tiba', `${arrivalClock(letterFleet, nowMinutes)} WIB`],
                ['Suhu boks', `${letterFleet.boxTempC}C (batas ${TEMP_FLOOR}C)`],
                ['Diterbitkan', `Dapur ${DEPOT.name}, sesi 29 Sept 2026`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold text-slate-500">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
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

      {dispatchFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Dispatch armada cadangan" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">DISPATCH CADANGAN</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Alihkan muatan {dispatchFleet.plate}?
            </h2>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
            <p className="text-xs leading-relaxed text-slate-600">
              {backup.plate} mengambil {dispatchFleet.boxCount} boks {dispatchFleet.batchToken} dan
              berangkat sekarang. {dispatchFleet.plate} kembali ke dapur untuk pemeriksaan.
              Keputusan ini tercatat di sesi ini.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={handleDispatch} className={BTN}>
                <ArrowLeftRight className="h-4 w-4" />
                Alihkan sekarang
              </button>
              <button type="button" onClick={() => setDispatchId(null)} className={`rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {notifyFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Notifikasi estimasi tiba" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SIAR KE SEKOLAH</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
              <Bell className="h-4 w-4 text-[#23259C]" />
              Estimasi tiba {notifyFleet.plate}
            </h2>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-700">
              {notifyText(notifyFleet, schoolById[notifyFleet.schoolId]?.name || '', nowMinutes)}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Nomor guru validator masih placeholder di data sesi, jadi pesan disalin manual.
              Tombol kirim otomatis aktif setelah nomor resmi terdaftar.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      notifyText(notifyFleet, schoolById[notifyFleet.schoolId]?.name || '', nowMinutes)
                    )
                    setCopied(true)
                  } catch {
                    setCopied(false)
                  }
                }}
                className={BTN}
              >
                {copied ? 'Tersalin' : 'Salin pesan'}
              </button>
              <button type="button" onClick={() => setNotifyId(null)} className={`rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="letter-print-sheet" aria-hidden="true">
        {printLetter && (
          <div style={{ color: '#000', background: '#fff', padding: 16, fontFamily: 'sans-serif' }}>
            <p style={{ fontSize: 18, fontWeight: 800 }}>SURAT JALAN ARMADA MBG</p>
            <p style={{ fontSize: 12 }}>Dapur {DEPOT.name} · 29 September 2026</p>
            <hr />
            <p style={{ fontSize: 13 }}>Kendaraan: {printLetter.plate} · {printLetter.type}</p>
            <p style={{ fontSize: 13 }}>Sopir: {printLetter.driver} · darurat {printLetter.emergencyPhone}</p>
            <p style={{ fontSize: 13 }}>Tujuan: {schoolById[printLetter.schoolId]?.name}</p>
            <p style={{ fontSize: 13 }}>Muatan: {printLetter.boxCount} boks · {printLetter.batchToken}</p>
            <p style={{ fontSize: 13 }}>Berangkat {printLetter.departAt} WIB · ETA {arrivalClock(printLetter, nowMinutes)} WIB</p>
            <p style={{ fontSize: 13 }}>Suhu boks {printLetter.boxTempC}C</p>
            <br />
            <p style={{ fontSize: 12 }}>Sopir: (....................) · Guru penerima: (....................)</p>
          </div>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Posisi armada dan angka telemetri adalah data sesi latihan dari perangkat dapur, bukan
        pelacakan GPS langsung. Surat jalan dicetak lewat dialog cetak sistem.
      </p>
    </div>
  )
}
