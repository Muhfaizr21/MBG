/**
 * ============================================================================
 * PRIMITIF TABEL KONSOL
 * ----------------------------------------------------------------------------
 * Semua tabel di dasbor admin memakai primitif ini, supaya:
 *  - satu baris punya SATU status dominan, bukan lima chip berwarna
 *  - angka selalu rata kanan + tabular, supaya bisa dibandingkan sekilas
 *  - warna hanya muncul kalau mengubah keputusan pengguna
 *  - teks tabel tidak pernah di bawah 11px
 *
 * Aturan warna: sama seperti chart. Hue hanya untuk status.
 * ============================================================================
 */

/** Warna status. Satu-satunya tempat hue dipakai di tabel. */
export const TONE = {
  ok: { dot: 'bg-emerald-600', text: 'text-emerald-800', label: 'text-slate-900' },
  warn: { dot: 'bg-amber-600', text: 'text-amber-800', label: 'text-slate-900' },
  critical: { dot: 'bg-rose-600', text: 'text-rose-800', label: 'text-slate-900' },
  info: { dot: 'bg-blue-600', text: 'text-blue-800', label: 'text-slate-900' },
  idle: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'text-slate-900' },
}

/** Kelas header. Satu definisi supaya semua tabel terbaca sama. */
export const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap'
export const thRight = `${th} text-right`
export const thCenter = `${th} text-center`

/** Kelas sel. */
export const td = 'px-4 py-3 text-xs text-slate-700 align-top'
export const tdRight = `${td} text-right tabular-nums`

/** Pembungkus tabel: satu radius, satu border, tanpa bayangan tebal. */
export function TableCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

/**
 * Status sebagai titik + label, bukan pil.
 *
 * Kenapa bukan pil: lima pil berwarna dalam satu baris membuat tabel dibaca
 * seperti papan main. Satu titik dengan label teks sudah cukup, dan warna
 * hanya di tempat yang benar-benar mengubah keputusan.
 */
export function StatusDot({ tone = 'idle', children, className = '' }) {
  const t = TONE[tone] || TONE.idle
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${t.label} ${className}`}>
      <span className={`h-2 w-2 rounded-full shrink-0 ${t.dot}`} aria-hidden="true" />
      {children}
    </span>
  )
}

/** Label kecil di atas angka. Untuk metrik ringkas di dalam sel. */
export function Metric({ label, value, tone = 'idle', className = '' }) {
  const t = TONE[tone] || TONE.idle
  return (
    <span className={`inline-flex flex-col leading-tight ${className}`}>
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-xs font-semibold tabular-nums ${t.text}`}>{value}</span>
    </span>
  )
}

/**
 * Nilai utama + konteks. Untuk kolom yang jadi dasar keputusan.
 * `hint` tampil di bawah, Slate-500 (lolos AA), bukan 9px.
 */
export function Figure({ value, hint, tone = 'idle', mono = true, className = '' }) {
  const t = TONE[tone] || TONE.idle
  return (
    <span className={`flex flex-col gap-0.5 ${className}`}>
      <span className={`text-sm font-semibold ${mono ? 'font-mono tabular-nums' : ''} ${t.text}`}>
        {value}
      </span>
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </span>
  )
}

/** Badge netral untuk kode/ID. Bukan status, jadi tanpa warna status. */
export function Code({ children }) {
  return (
    <span className="font-mono text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
      {children}
    </span>
  )
}

/** Aksi baris: teks, tanpa filled pill. Outline hanya untuk aksi utama. */
export function RowAction({ children, onClick, tone = 'info', ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        tone === 'ok'
          ? 'text-emerald-800 hover:bg-emerald-50'
          : tone === 'warn'
          ? 'text-amber-800 hover:bg-amber-50'
          : tone === 'critical'
          ? 'text-rose-800 hover:bg-rose-50'
          : tone === 'idle'
          ? 'text-slate-600 hover:bg-slate-100'
          : 'text-blue-800 hover:bg-blue-50'
      }`}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Empty state: menyebut penyebab + satu aksi. */
export function EmptyState({ title, hint, action, onAction, colSpan = 1 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {action}
          </button>
        )}
      </td>
    </tr>
  )
}

/** Baris tabel. Dense/normal dikontrol panel lewat `paddingY`. */
export function tr({ tone, children, onClick, onKeyDown, label, className = '' }) {
  const base = tone === 'critical' ? 'bg-rose-50/40' : tone === 'warn' ? 'bg-amber-50/40' : ''
  return (
    <tr
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={label}
      tabIndex={onClick ? 0 : undefined}
      className={`transition-colors ${
        onClick ? 'cursor-pointer hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600' : ''
      } ${base} ${className}`}
    >
      {children}
    </tr>
  )
}

/* ========================================================================== */
/* KARTU                                                                      */
/* ========================================================================== */

/**
 * Wadah kartu. Tanpa bayangan: pada konsol dengan-io density tinggi, bayangan
 * di setiap kartu membuat seluruh halaman melayang dan kehilangan batas
 * daratan. Border saja sudah cukup memisahkan permukaan (R-12).
 */
export function Card({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`bg-white rounded-xl border border-slate-200 ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Kartu KPI.
 *
 * Kenapa labelnya sentence-case 11px, bukan `10px uppercase tracking-wider
 * font-mono`: itu kosplay terminal. Huruf kecil, sans-serif, dan
 * sentence-case lebih cepat dibaca dan terlihat seperti alat kerja, bukan
 * dekorasi.
 */
export function KpiCard({ label, value, unit, hint, tone = 'idle', children, className = '' }) {
  const t = TONE[tone] || TONE.idle
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span className={`text-2xl font-semibold tabular-nums tracking-tight ${t.text}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
      {children}
    </div>
  )
}

/** Judul seksi. Memisahkan blok tanpa membuat kartu di dalam kartu. */
export function SectionTitle({ children, hint, actions }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{children}</h2>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      </div>
      {actions}
    </div>
  )
}

/** Legenda ringkas: titik + label, tanpa pil. */
export function Key({ tone = 'idle', children }) {
  const t = TONE[tone] || TONE.idle
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
      <span className={`h-2 w-2 rounded-full shrink-0 ${t.dot}`} aria-hidden="true" />
      {children}
    </span>
  )
}

/** Batang proporsi. Tinggi tetap 6px supaya sejajar di semua kartu. */
export function Bar({ segments, className = '' }) {
  return (
    <div className={`flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      {segments.map((s, i) => (
        <div
          key={i}
          className={s.color}
          style={{ width: `${Math.max(0, Math.min(100, s.value))}%` }}
          title={s.title}
        />
      ))}
    </div>
  )
}
