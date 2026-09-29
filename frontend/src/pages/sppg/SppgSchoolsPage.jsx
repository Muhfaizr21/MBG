import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgSchoolsPanel } from '../../components/sppg/SppgSchoolsPanel'

export function SppgSchoolsPage() {
  return (
    <SppgLayout activeMenu="schools" title="Sekolah Binaan">
      <SppgSchoolsPanel />
    </SppgLayout>
  )
}
