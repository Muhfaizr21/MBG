/**
 * ============================================================================
 * SISTEM TOKEN VISUALISASI DATA
 * ----------------------------------------------------------------------------
 * Satu sumber kebenaran untuk seluruh chart di konsol ini.
 *
 * Prinsip:
 *  1. Hue hanya untuk STATUS. Data kategorikal hanya memakai satu ramp.
 *  2. Data yang TERURUT (fast -> slow, muda -> tua) memakai ramp satu hue,
 *     karena urutannya sudah dikomunikasikan oleh posisi, tidak perlu warna.
 *  3. Tidak ada ungu, indigo, atau pink sebagai warna data. Palet itu
 *     mengomunikasikan "AI-generated", bukan informasi.
 *  4. Semua mark data harus >= 3:1 terhadap background (WCAG, non-text).
 *  5. Sumbu, grid, dan tooltip identik di semua chart supaya mata pembaca
 *     tidak perlu menyesuaikan setiap kali pindah panel.
 * ============================================================================
 */

/** Aksen tunggal. Dipakai untuk data kategori utama dan state fokus. */
export const ACCENT = '#1d4ed8'; // blue-700
export const ACCENT_SOFT = '#60a5fa'; // blue-400, untuk gradient/overlay

/**
 * Ramp kategorikal-safe untuk data TERURUT.
 * Urutan kiri ke kanan = nilai kecil ke besar.
 * Satu hue, berubahiator hanya luminans -> mata membaca "derajat", bukan
 * "kategori berbeda".
 */
export const SEQUENTIAL_BLUE = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'];

/**
 * Warna status. Ini satu-satunya tempat hue dipakai, dan hanya karena
 * warna sudah punya makna universal di konsol pengawasan.
 * Dipakai 600-level supaya kontrasnya cukup di atas background putih.
 */
export const STATUS = {
  ok: '#047857', // emerald-700   - sesuai / lolos / aktif
  warn: '#b45309', // amber-700    - perlu perhatian / terlambat
  critical: '#b91c1c', // red-700     - gagal / anomali / dibekukan
  info: ACCENT, // biru          - netral, dalam proses
  idle: '#64748b', // slate-500    - tidak berlaku / belum ada data
};

/** Derajat Sequential: dipakai saat data itu derajat, bukan kategori. */
export const SEVERITY_3 = [STATUS.ok, STATUS.warn, STATUS.critical];
export const SEVERITY_4 = [STATUS.ok, '#0891b2', STATUS.warn, STATUS.critical];

/** Netral. */
export const NEUTRAL = {
  data: '#64748b', // slate-500  - mark data tanpa makna status
  axis: '#64748b', // slate-500  - label sumbu (4.76:1 di putih)
  grid: '#e2e8f0', // slate-200  - garis bantu
  track: '#f1f5f9', // slate-100  - bar track
  surface: '#ffffff',
  tooltipBorder: '#cbd5e1', // slate-300
  cursor: '#cbd5e1', // slate-300
};

/** Tick sumbu. Semua chart memakai ini. */
export const axisTick = { fontSize: 11, fill: NEUTRAL.axis };

/** Garis bantu horizontal saja. Sumbu vertikal di chart padat = gangguan. */
export const gridHorizontal = {
  stroke: NEUTRAL.grid,
  strokeWidth: 1,
  vertical: false,
};

/** Tooltip: satu gaya untuk semua chart. */
export const tooltipStyle = {
  backgroundColor: NEUTRAL.surface,
  border: `1px solid ${NEUTRAL.tooltipBorder}`,
  borderRadius: 8,
  fontSize: 12,
  padding: '8px 10px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
};

export const tooltipCursor = { stroke: NEUTRAL.cursor, strokeWidth: 1 };

/** Isi bar yang dipesan. */
export const barCursor = { fill: 'rgba(15, 23, 42, 0.04)' };

/** Ketebalan garis. 2px cukup terbaca; 3px membuat chart terasa berlebihan. */
export const STROKE_WIDTH = 2;

/** Isi area tanpa gradient: warna solid berkontras rendah lebih tenang dan lebih cepat. */
export const AREA_FILL = 'rgba(29, 78, 216, 0.10)';

/**
 * Ambil warna dari ramp sesuai posisi, aman untuk index di luar jangkauan.
 * Dipakai untuk data yang sudah terurut, bukan untuk kategori bebas.
 */
export const sequential = (index, length) => {
  if (length <= 1) return ACCENT
  const step = (index / (length - 1)) * (SEQUENTIAL_BLUE.length - 1)
  return SEQUENTIAL_BLUE[Math.round(step)]
}

/**
 * Tooltip bersama. Semua chart memakainya, jadi bentuk dan tipografi
 * tidak berubah saat pengguna pindah panel.
 */
export function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[180px] z-50 pointer-events-none select-none">
      {label != null && (
        <p className="mb-1.5 border-b border-slate-100 pb-1.5 font-bold text-slate-900 leading-snug">{label}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={`${entry.dataKey}-${i}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
              <span
                className="h-2 w-2 rounded-xs shrink-0"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              {entry.name}
            </span>
            <span className="tabular-nums font-bold text-slate-900 font-mono text-[11px]">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('id-ID') : entry.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
