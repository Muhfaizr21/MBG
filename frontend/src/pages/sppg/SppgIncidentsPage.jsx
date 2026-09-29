import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgIncidentsPanel } from '../../components/sppg/SppgIncidentsPanel'

export function SppgIncidentsPage() {
  return (
    <SppgLayout activeMenu="incidents" title="Insiden & Aduan">
      <SppgIncidentsPanel />
    </SppgLayout>
  )
}
