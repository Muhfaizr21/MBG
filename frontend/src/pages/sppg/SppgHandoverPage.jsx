import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgHandoverPanel } from '../../components/sppg/SppgHandoverPanel'

export function SppgHandoverPage() {
  return (
    <SppgLayout activeMenu="handover" title="Serah Terima BAST">
      <SppgHandoverPanel />
    </SppgLayout>
  )
}
