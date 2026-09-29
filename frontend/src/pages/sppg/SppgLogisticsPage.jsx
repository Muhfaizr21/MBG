import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgLogisticsPanel } from '../../components/sppg/SppgLogisticsPanel'

export function SppgLogisticsPage() {
  return (
    <SppgLayout activeMenu="logistics" title="Armada & Logistik">
      <SppgLogisticsPanel />
    </SppgLayout>
  )
}
