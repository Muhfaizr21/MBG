import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgDashboardPanel } from '../../components/sppg/SppgDashboardPanel'

export function SppgDashboardPage() {
  return (
    <SppgLayout activeMenu="dashboard" title="Cockpit Operasional Dapur">
      <SppgDashboardPanel />
    </SppgLayout>
  )
}
