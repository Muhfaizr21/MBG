import { SiswaLayout } from '../../components/layout/SiswaLayout'
import { SiswaBerandaTab } from '../../components/siswa/SiswaBerandaTab'

/**
 * ==============================================================================
 * PORTAL SISWA: BERANDA (dashboard utama)
 * URL: /siswa — default portal, guard roles ['siswa','superadmin'].
 * ==============================================================================
 */
export function SiswaDashboardPage() {
  return (
    <SiswaLayout activeMenu="dashboard" title="Beranda Saya" badge="PORTAL SISWA">
      <SiswaBerandaTab />
    </SiswaLayout>
  )
}

export default SiswaDashboardPage
