import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import L from 'leaflet'
import {
  School,
  X,
  Printer,
  Phone,
  MapPin,
  ChevronDown,
} from 'lucide-react'
import { ASSIGNED_SCHOOLS_MANIFEST, SPPG_PROFILE } from '../../data/sppgPortalData'
import { SCHOOL_COORDS, DEPOT } from '../../data/sppgLogisticsData'
import {
  ATTENDANCE_DEADLINE,
  SCHOOL_PROFILES,
  attendanceStatus,
  packingQuota,
} from '../../data/sppgSchoolsData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const THEAD = 'border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600'
const GHOST = `rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] ${FOCUS}`

function dot(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export function SppgSchoolsPanel() {
  const [openId, setOpenId] = useState('sch-02')
  const [guideId, setGuideId] = useState(null)
  const [contactId, setContactId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [printGuide, setPrintGuide] = useState(null)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  const schools = useMemo(
    () =>
      ASSIGNED_SCHOOLS_MANIFEST.map((m) => ({
        ...m,
        ...(SCHOOL_PROFILES.find((p) => p.id === m.id) || {}),
      })),
    []
  )

  const totals = useMemo(() => {
    const present = schools.reduce((s, x) => s + (x.presentUpdatedAt ? x.present : 0), 0)
    const quota = schools.reduce((s, x) => s + packingQuota(x), 0)
    const updated = schools.filter((x) => x.presentUpdatedAt).length
    const specials = schools.reduce((s, x) => s + (x.specials || []).reduce((a, b) => a + b.count, 0), 0)
    return { present, quota, updated, total: schools.length, specials }
  }, [schools])

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
    const layers = L.layerGroup().addTo(map)
    L.marker([DEPOT.lat, DEPOT.lng], { icon: dot('#23259C') })
      .bindPopup(`<b>${DEPOT.name}</b>`)
      .addTo(layers)
    schools.forEach((s) => {
      const c = SCHOOL_COORDS[s.id]
      if (!c) return
      const st = attendanceStatus(s.presentUpdatedAt)
      L.marker([c.lat, c.lng], { icon: dot(st.onTime ? '#059669' : '#D97706') })
        .bindPopup(`<b>${s.name}</b><br>Kuota cetak ${packingQuota(s)} · ${st.label}`)
        .addTo(layers)
    })
    mapInstance.current = map
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => {
      clearTimeout(t)
      map.remove()
      mapInstance.current = null
    }
  }, [schools])

  useEffect(() => {
    if (!guideId && !contactId) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setGuideId(null)
        setContactId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guideId, contactId])

  useEffect(() => {
    if (!printGuide) return
    const t = setTimeout(() => window.print(), 150)
    return () => clearTimeout(t)
  }, [printGuide])

  const guideSchool = schools.find((s) => s.id === guideId) || null
  const contactSchool = schools.find((s) => s.id === contactId) || null
  const printed = schools.find((s) => s.id === printGuide) || null

  return (
    <div className="space-y-5">
      <style>{`@page{size:A5;margin:8mm}.guide-print-sheet{display:none}@media print{body *{visibility:hidden}.guide-print-sheet,.guide-print-sheet *{visibility:visible}.guide-print-sheet{display:block !important;position:absolute;inset:0}}`}</style>

      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              SPPG-01 · 4 SEKOLAH BINAAN · BATAS UPDATE {ATTENDANCE_DEADLINE} WIB
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Sekolah binaan dan kuota
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Kuota cetak mengikuti presensi pagi. Sekolah yang belum update memakai data
              terdaftar dan ditandai supaya dapur menagih ulang.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">KUOTA CETAK HARI INI</p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight text-white">
              {totals.quota.toLocaleString('id-ID')}
            </p>
            <p className="mt-2 text-[11px] font-medium text-white/70">
              {totals.present.toLocaleString('id-ID')} hadir · {totals.updated} dari {totals.total} sekolah update ·{' '}
              {totals.specials} porsi khusus
            </p>
          </div>
        </div>
      </section>

      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="px-5 pt-5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · TITIK SERAH TERIMA</p>
          <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
            Peta drop-point sekolah
          </h2>
        </div>
        <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
        <div className="px-5 pb-2">
          <div ref={mapRef} className="h-[320px] w-full rounded-xl border border-slate-200" role="img" aria-label="Peta lokasi sekolah binaan" />
          <div className="flex flex-wrap gap-x-5 gap-y-1 py-3 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#23259C]" /> Dapur SPPG-01
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Presensi tepat waktu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Telat atau belum update
            </span>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="px-5 pt-5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · PRESENSI PAGI</p>
          <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
            Kuota per sekolah
          </h2>
        </div>
        <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className={THEAD}>
              <tr>
                <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                <th scope="col" className="px-3 py-2.5">Sekolah</th>
                <th scope="col" className="px-3 py-2.5 text-right">Terdaftar</th>
                <th scope="col" className="px-3 py-2.5 text-right">Hadir</th>
                <th scope="col" className="px-3 py-2.5 text-right">Kuota cetak</th>
                <th scope="col" className="px-3 py-2.5 text-center">Presensi</th>
                <th scope="col" className="px-4 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((s, i) => {
                const st = attendanceStatus(s.presentUpdatedAt)
                const open = openId === s.id
                return (
                  <Fragment key={s.id}>
                    <tr className="transition hover:bg-[#23259C]/[0.03]">
                      <td className="px-4 py-3 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                          NPSN {s.npsn} · {s.level}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {s.enrolled.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {s.presentUpdatedAt ? s.present.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums text-[#23259C]">
                        {packingQuota(s).toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${st.tone}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? '' : s.id)}
                            aria-expanded={open}
                            className={GHOST}
                          >
                            <span className="inline-flex items-center gap-1">
                              Detail
                              <ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
                            </span>
                          </button>
                          <button type="button" onClick={() => setGuideId(s.id)} className={GHOST}>
                            Panduan
                          </button>
                          <button type="button" onClick={() => { setContactId(s.id); setCopied(false) }} className={GHOST}>
                            Hubungi
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50/60 px-8 py-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <p className="text-[11px] font-bold tracking-wide text-slate-500">PROFIL</p>
                              <p className="mt-1 text-xs text-slate-700">{s.address}</p>
                              <p className="mt-1 font-mono text-[11px] text-slate-500">
                                {SCHOOL_COORDS[s.id] ? `${SCHOOL_COORDS[s.id].lat}, ${SCHOOL_COORDS[s.id].lng}` : 'koordinat belum dipetakan'}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">Armada: {s.fleet}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold tracking-wide text-slate-500">SELISIH PRESENSI</p>
                              <p className="mt-1 text-xs leading-relaxed text-slate-700">{s.absenceNote}</p>
                              {(s.specials || []).length > 0 ? (
                                <ul className="mt-2 space-y-1">
                                  {(s.specials || []).map((sp) => (
                                    <li key={sp.type} className="text-[11px] text-slate-600">
                                      <span className="font-bold text-slate-800">{sp.count} porsi {sp.type}</span>
                                      {' · '}{sp.note}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 text-[11px] text-slate-500">Tidak ada porsi khusus.</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold tracking-wide text-slate-500">KONTAK</p>
                              <p className="mt-1 text-xs text-slate-700">Kepsek: {s.principal}</p>
                              <p className="mt-1 text-xs text-slate-700">Validator: {s.validator}</p>
                              <p className="mt-1 font-mono text-[11px] text-slate-500">{s.validatorPhone}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {guideSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label={`Panduan drop-point ${guideSchool.name}`} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-1">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-slate-500">PANDUAN DROP-POINT</p>
                <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                  <MapPin className="h-4 w-4 text-[#23259C]" />
                  {guideSchool.name}
                </h2>
              </div>
              <button type="button" onClick={() => setGuideId(null)} aria-label="Tutup panduan" className={`rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 ${FOCUS}`}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
            <p className="text-xs leading-relaxed text-slate-700">{guideSchool.droppoint}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Kuota turun {packingQuota(guideSchool)} boks · Armada {guideSchool.fleet}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setPrintGuide(guideSchool.id); setGuideId(null) }} className={BTN}>
                <Printer className="h-4 w-4" />
                Cetak panduan
              </button>
              <button type="button" onClick={() => setGuideId(null)} className={`rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {contactSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div role="dialog" aria-modal="true" aria-label={`Hubungi ${contactSchool.name}`} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">HUBUNGI VALIDATOR</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
              <Phone className="h-4 w-4 text-[#23259C]" />
              {contactSchool.name}
            </h2>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Guru validator</dt>
                <dd className="font-semibold text-slate-900">{contactSchool.validator}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Telepon piket</dt>
                <dd className="font-mono text-[11px] font-bold text-slate-900">{contactSchool.validatorPhone}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Nomor masih placeholder di data sesi, jadi tombol panggil langsung nonaktif.
              Salin nomor untuk dihubungi manual setelah nomor resmi terdaftar.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${contactSchool.validator} ${contactSchool.name}: ${contactSchool.validatorPhone}`)
                    setCopied(true)
                  } catch {
                    setCopied(false)
                  }
                }}
                className={BTN}
              >
                {copied ? 'Tersalin' : 'Salin kontak'}
              </button>
              <button type="button" onClick={() => setContactId(null)} className={`rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="guide-print-sheet" aria-hidden="true">
        {printed && (
          <div style={{ color: '#000', background: '#fff', padding: 16, fontFamily: 'sans-serif' }}>
            <p style={{ fontSize: 18, fontWeight: 800 }}>PANDUAN DROP-POINT</p>
            <p style={{ fontSize: 12 }}>{SPPG_PROFILE.code} · 29 September 2026</p>
            <hr />
            <p style={{ fontSize: 14, fontWeight: 700 }}>{printed.name}</p>
            <p style={{ fontSize: 12 }}>{printed.address}</p>
            <p style={{ fontSize: 13 }}>{printed.droppoint}</p>
            <p style={{ fontSize: 13 }}>Kuota turun: {packingQuota(printed)} boks · Armada {printed.fleet}</p>
            <p style={{ fontSize: 12 }}>PIC: {printed.validator} · {printed.validatorPhone}</p>
          </div>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <School className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Alamat dan koordinat mengikuti data sesi dapur. Presensi dihitung dari jam update
        terhadap batas {ATTENDANCE_DEADLINE} WIB.
      </p>
    </div>
  )
}
