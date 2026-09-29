import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgCompliancePanel } from '../../components/sppg/SppgCompliancePanel'

export function SppgCompliancePage() {
  return (
    <SppgLayout activeMenu="compliance" title="Sertifikasi Sanitasi">
      <SppgCompliancePanel />
    </SppgLayout>
  )
}
