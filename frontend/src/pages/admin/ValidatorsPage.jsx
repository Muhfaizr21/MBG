import { useMemo, useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { ValidatorPanel } from '../../components/dashboard/ValidatorPanel'
import { fetchValidators } from '../../lib/api'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: PROFIL & AUDIT INTEGRITAS VALIDATOR LAPANGAN
 * URL: /admin/validators
 * Menggunakan Clean Code Architecture: AdminLayout + ValidatorPanel
 * ==============================================================================
 */

export function ValidatorsPage() {
  const { user } = useAuth()
  const initialValidators = useMemo(
    () => [
      {
        id: 'v-1',
        satgasId: 'BGN-VLD-0042',
        name: 'Dr. Hendra Prasetyo',
        degree: 'M.Ed (Pendidikan Dasar)',
        nip: '19840312 200801 1 003',
        npsn: '33.210.130',
        role: 'Guru Kelas 1 & Penanggung Jawab MBG',
        school: 'SDN 01 Menteng Pagi',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        cluster: 'Kluster Sentral A - DKI Jakarta',
        schoolAccreditation: 'A (Unggul)',
        studentBeneficiaries: '420 Siswa',
        dapodikVerified: true,
        device: 'iPhone 15 Pro',
        deviceId: 'dev-ios-001',
        deviceUuid: 'a8f2-9bc1-4402-e891',
        osVersion: 'iOS 18.2 (22C152)',
        appVersion: 'v2.4.1-rc3 (Build 890)',
        battery: '88%',
        network: 'Telkomsel 5G (Ping 16ms)',
        gpsCoords: '-6.1944, 106.8229',
        geoDistance: '8m dari Titik Distribusi',
        geoStatus: 'valid',
        attestationStatus: 'Apple Secure Enclave (Level 3 Validated)',
        lastScan: '08:15 WIB',
        lastScanTimestamp: '08:15:22 WIB',
        avgDuration: 0.8,
        scansToday: 42,
        quotaToday: 45,
        certification: 'Sertifikasi Higienitas Dasar (BNSP)',
        certNumber: 'BNSP/HIG-MBG/2026/0491',
        certDate: '15 Jan 2026',
        certExpiry: '15 Jan 2028',
        status: 'active',
        anomalies: 0,
        scanLogs: [
          { time: '08:15:22', boxId: 'BX-042', menu: 'Nasi Pulen, Ayam Woku, Sayur Bayam, Jeruk', temp: '58.4°C', duration: 0.82, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
          { time: '08:14:40', boxId: 'BX-041', menu: 'Nasi Pulen, Ayam Woku, Sayur Bayam, Jeruk', temp: '59.1°C', duration: 0.78, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
          { time: '08:13:58', boxId: 'BX-040', menu: 'Nasi Pulen, Ayam Woku, Sayur Bayam, Jeruk', temp: '58.0°C', duration: 0.85, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
          { time: '08:12:15', boxId: 'BX-039', menu: 'Nasi Pulen, Ayam Woku, Sayur Bayam, Jeruk', temp: '60.2°C', duration: 0.81, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
        ],
      },
      {
        id: 'v-2',
        satgasId: 'BGN-VLD-0056',
        name: 'Siti Nurhaliza, S.Pd',
        degree: 'S.Pd (Administrasi Pendidikan)',
        nip: '19890914 201402 2 004',
        npsn: '33.210.131',
        role: 'Staf Administrasi & Operator Gizi',
        school: 'SMPN 2 Bandung Wetan',
        city: 'Kota Bandung',
        province: 'Jawa Barat',
        cluster: 'Kluster Bandung Raya B-02',
        schoolAccreditation: 'A (Unggul)',
        studentBeneficiaries: '580 Siswa',
        dapodikVerified: true,
        device: 'iPhone 15',
        deviceId: 'dev-ios-002',
        deviceUuid: 'c391-4402-9bc1-e891',
        osVersion: 'iOS 18.1.1 (22B91)',
        appVersion: 'v2.4.1-rc3 (Build 890)',
        battery: '74%',
        network: 'XL Axiata 4G+ (Ping 24ms)',
        gpsCoords: '-6.9147, 107.6098',
        geoDistance: '14m dari Titik Distribusi',
        geoStatus: 'valid',
        attestationStatus: 'Apple Secure Enclave (Level 3 Validated)',
        lastScan: '08:22 WIB',
        lastScanTimestamp: '08:22:10 WIB',
        avgDuration: 0.5,
        scansToday: 38,
        quotaToday: 40,
        certification: 'Sertifikasi Higienitas Dasar (BNSP)',
        certNumber: 'BNSP/HIG-MBG/2026/0498',
        certDate: '10 Jan 2026',
        certExpiry: '10 Jan 2028',
        status: 'active',
        anomalies: 0,
        scanLogs: [
          { time: '08:22:10', boxId: 'BX-038', menu: 'Nasi Merah, Ikan Kembung Bakar, Sayur Asem', temp: '56.8°C', duration: 0.51, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
          { time: '08:21:30', boxId: 'BX-037', menu: 'Nasi Merah, Ikan Kembung Bakar, Sayur Asem', temp: '57.2°C', duration: 0.50, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
          { time: '08:20:45', boxId: 'BX-036', menu: 'Nasi Merah, Ikan Kembung Bakar, Sayur Asem', temp: '57.0°C', duration: 0.53, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
        ],
      },
      {
        id: 'v-3',
        satgasId: 'BGN-VLD-0089',
        name: 'Ahmad Fauzi, M.Pd',
        degree: 'M.Pd (Evaluasi Pendidikan)',
        nip: '19790518 200501 1 007',
        npsn: '33.210.132',
        role: 'Wali Kelas VI & Tim Penerimaan MBG',
        school: 'SDN Percobaan 1 Sleman',
        city: 'D.I. Yogyakarta',
        province: 'D.I. Yogyakarta',
        cluster: 'Kluster Sleman-Yogyakarta',
        schoolAccreditation: 'A (Unggul)',
        studentBeneficiaries: '350 Siswa',
        dapodikVerified: true,
        device: 'Pixel 8',
        deviceId: 'dev-android-001',
        deviceUuid: 'ff83-20a1-9481-c309',
        osVersion: 'Android 15 (AP2A.240805.005)',
        appVersion: 'v2.4.1-rc3 (Build 890)',
        battery: '64%',
        network: 'Indosat Ooredoo 4G (Ping 34ms)',
        gpsCoords: '-7.7681, 110.3842',
        geoDistance: '480m dari Gerbang Sekolah',
        geoStatus: 'warning',
        attestationStatus: 'Android Play Integrity (Strong Attestation)',
        lastScan: '08:30 WIB',
        lastScanTimestamp: '08:30:12 WIB',
        avgDuration: 0.15,
        scansToday: 45,
        quotaToday: 45,
        certification: 'Sertifikasi Higienitas Dasar (BNSP)',
        certNumber: 'BNSP/HIG-MBG/2026/0512',
        certDate: '01 Feb 2026',
        certExpiry: '01 Feb 2028',
        status: 'flagged',
        anomalies: 3,
        anomalyNotice: 'Pindai Kilat <0.2s: Terdeteksi 3 boks dipindai beruntun dalam 450ms. Tidak memenuhi ambang batas inspeksi visual makanan (0.50s) Pasal 14 Juknis MBG.',
        scanLogs: [
          { time: '08:30:12', boxId: 'BX-045', menu: 'Nasi Kuning, Empal Gepuk, Buncis Wortel', temp: '42.1°C', duration: 0.14, status: 'anomalous', note: 'ANOMALI KRITIS: Durasi 140ms (<200ms threshold)' },
          { time: '08:30:10', boxId: 'BX-044', menu: 'Nasi Kuning, Empal Gepuk, Buncis Wortel', temp: '42.0°C', duration: 0.15, status: 'anomalous', note: 'ANOMALI KRITIS: Durasi 150ms (<200ms threshold)' },
          { time: '08:30:08', boxId: 'BX-043', menu: 'Nasi Kuning, Empal Gepuk, Buncis Wortel', temp: '42.5°C', duration: 0.16, status: 'anomalous', note: 'ANOMALI KRITIS: Durasi 160ms (<200ms threshold)' },
          { time: '08:29:45', boxId: 'BX-042', menu: 'Nasi Kuning, Empal Gepuk, Buncis Wortel', temp: '44.8°C', duration: 0.52, status: 'valid', note: 'Pindai Normal' },
        ],
      },
      {
        id: 'v-4',
        satgasId: 'BGN-VLD-0094',
        name: 'Dewi Lestari, S.Kom',
        degree: 'S.Kom, M.T.I (Sistem Informasi)',
        nip: '19820415 200604 2 011',
        npsn: '33.210.133',
        role: 'Kepala Sekolah & Penanggung Jawab Mutu',
        school: 'SMPN 1 Surabaya Pusat',
        city: 'Kota Surabaya',
        province: 'Jawa Timur',
        cluster: 'Kluster Surabaya Sentral',
        schoolAccreditation: 'A (Unggul)',
        studentBeneficiaries: '650 Siswa',
        dapodikVerified: true,
        device: 'iPhone 15',
        deviceId: 'dev-ios-003',
        deviceUuid: 'b712-4402-9bc1-e891',
        osVersion: 'iOS 18.2 (22C152)',
        appVersion: 'v2.4.1-rc3 (Build 890)',
        battery: '91%',
        network: 'Telkomsel 5G (Ping 14ms)',
        gpsCoords: '-7.2575, 112.7521',
        geoDistance: '6m dari Titik Distribusi',
        geoStatus: 'valid',
        attestationStatus: 'Apple Secure Enclave (Level 3 Validated)',
        lastScan: '08:45 WIB',
        lastScanTimestamp: '08:45:04 WIB',
        avgDuration: 1.2,
        scansToday: 35,
        quotaToday: 35,
        certification: 'Sertifikasi Higienitas Lanjutan (Auditor HACCP)',
        certNumber: 'BNSP/HACCP-MBG/2025/0129',
        certDate: '20 Nov 2025',
        certExpiry: '20 Nov 2028',
        status: 'active',
        anomalies: 0,
        scanLogs: [
          { time: '08:45:04', boxId: 'BX-035', menu: 'Nasi Liwet, Ayam Bakar Madu, Sayur Lalap, Pisang', temp: '61.5°C', duration: 1.25, status: 'valid', note: 'Audit HACCP Fisik Lengkap' },
          { time: '08:43:20', boxId: 'BX-034', menu: 'Nasi Liwet, Ayam Bakar Madu, Sayur Lalap, Pisang', temp: '61.0°C', duration: 1.18, status: 'valid', note: 'Audit HACCP Fisik Lengkap' },
          { time: '08:41:45', boxId: 'BX-033', menu: 'Nasi Liwet, Ayam Bakar Madu, Sayur Lalap, Pisang', temp: '62.0°C', duration: 1.22, status: 'valid', note: 'Audit HACCP Fisik Lengkap' },
        ],
      },
      {
        id: 'v-5',
        satgasId: 'BGN-VLD-0112',
        name: 'Budi Santoso, S.Pd',
        degree: 'S.Pd (Pendidikan Fisika)',
        nip: '19871103 201101 1 005',
        npsn: '33.210.134',
        role: 'Guru Fisika & Satgas Distribusi',
        school: 'SDN Kompleks IKIP Makassar',
        city: 'Kota Makassar',
        province: 'Sulawesi Selatan',
        cluster: 'Kluster Makassar Timur',
        schoolAccreditation: 'A (Unggul)',
        studentBeneficiaries: '320 Siswa',
        dapodikVerified: true,
        device: 'Pixel 8',
        deviceId: 'dev-android-002',
        deviceUuid: 'dd44-20a1-9481-c309',
        osVersion: 'Android 15 (AP2A.240805.005)',
        appVersion: 'v2.4.1-rc3 (Build 890)',
        battery: '79%',
        network: 'Telkomsel 4G+ (Ping 22ms)',
        gpsCoords: '-5.1477, 119.4327',
        geoDistance: '12m dari Titik Distribusi',
        geoStatus: 'valid',
        attestationStatus: 'Android Play Integrity (Strong Attestation)',
        lastScan: '08:52 WIB',
        lastScanTimestamp: '08:52:18 WIB',
        avgDuration: 0.6,
        scansToday: 40,
        quotaToday: 40,
        certification: 'Sertifikasi Higienitas Dasar (BNSP)',
        certNumber: 'BNSP/HIG-MBG/2026/0540',
        certDate: '25 Jan 2026',
        certExpiry: '25 Jan 2028',
        status: 'active',
        anomalies: 0,
        scanLogs: [
          { time: '08:52:18', boxId: 'BX-040', menu: 'Nasi Putih, Coto Daging, Tempe Mendoan, Semangka', temp: '59.2°C', duration: 0.62, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
          { time: '08:51:10', boxId: 'BX-039', menu: 'Nasi Putih, Coto Daging, Tempe Mendoan, Semangka', temp: '59.8°C', duration: 0.58, status: 'valid', note: 'Inspeksi Fisik Sesuai SOP' },
        ],
      },
      {
        id: 'v-6',
        satgasId: 'BGN-VLD-0145',
        name: 'Rina Wulandari, S.Gz',
        degree: 'S.Gz (Ilmu Gizi Klinis)',
        nip: '19920824 201903 2 008',
        npsn: '33.210.135',
        role: 'Wali Kelas & Tenaga Pendamping Gizi',
        school: 'SD Inpres Kotaraja',
        city: 'Kota Jayapura',
        province: 'Papua',
        cluster: 'Kluster Jayapura Wilayah 1',
        schoolAccreditation: 'B (Baik)',
        studentBeneficiaries: '290 Siswa',
        dapodikVerified: true,
        device: 'iPhone 15',
        deviceId: 'dev-ios-004',
        deviceUuid: 'ee55-4402-9bc1-e891',
        osVersion: 'iOS 18.0 (22A3354)',
        appVersion: 'v2.3.9 (Build 820) - Perlu Update',
        battery: '52%',
        network: 'Telkomsel 4G (Ping 48ms)',
        gpsCoords: '-2.5916, 140.6690',
        geoDistance: '18m dari Titik Distribusi',
        geoStatus: 'valid',
        attestationStatus: 'Apple Secure Enclave (Level 3 Validated)',
        lastScan: '08:58 WIB',
        lastScanTimestamp: '08:58:30 WIB',
        avgDuration: 0.9,
        scansToday: 30,
        quotaToday: 45,
        certification: 'Belum Tersertifikasi (Masa Dispensasi)',
        certNumber: 'PENDING-REG/2026/089',
        certDate: '-',
        certExpiry: 'Masa Dispensasi s/d 15 April 2026',
        status: 'inactive',
        anomalies: 1,
        anomalyNotice: 'Akun Nonaktif Sementara: Menunggu penyelesaian modul e-learning Higienitas Sanitasi Makanan Kemenkes RI.',
        scanLogs: [
          { time: '08:58:30', boxId: 'BX-030', menu: 'Nasi Kuning, Ikan Mujair Bakar, Sayur Kangkung', temp: '55.0°C', duration: 0.92, status: 'valid', note: 'Scan Uji Coba Lapangan' },
          { time: '08:56:15', boxId: 'BX-029', menu: 'Nasi Kuning, Ikan Mujair Bakar, Sayur Kangkung', temp: '55.4°C', duration: 0.88, status: 'valid', note: 'Scan Uji Coba Lapangan' },
        ],
      },
    ],
    []
  )

  const [validators, setValidators] = useState(initialValidators)

  useEffect(() => {
    let isMounted = true
    fetchValidators()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setValidators((prev) =>
            prev.map((v) => {
              const live = data.find(
                (d) => d.nip === v.nip || d.npsn === v.npsn || d.name === v.name
              )
              return live ? { ...v, ...live } : v
            })
          )
        }
      })
      .catch((err) => console.warn('Fallback validators:', err))

    return () => {
      isMounted = false
    }
  }, [])

  const handleSuperadminAction = (action, validator) => {
    const res = guardAdminAction(user, 'Validators', action, validator)
    if (!res.allowed) setToast(res.message)
    return res
  }

  // Toast is owned here because ValidatorPanel has no visual channel of its own:
  // the panel calls showToast for export/print/confirmation results.
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <AdminLayout
      activeMenu="validator"
      title="Profil Validator"
      badge="POSTGRESQL LIVE"
      showSearch={false}
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <p className="leading-relaxed">{toast}</p>
        </div>
      )}

      <ValidatorPanel
        validators={validators}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}
export default ValidatorsPage
