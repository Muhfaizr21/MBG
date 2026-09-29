import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgBillingPanel } from '../../components/sppg/SppgBillingPanel'

export function SppgBillingPage() {
  return (
    <SppgLayout activeMenu="billing" title="Klaim & Tagihan">
      <SppgBillingPanel />
    </SppgLayout>
  )
}
