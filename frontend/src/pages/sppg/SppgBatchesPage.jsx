import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgBatchesPanel } from '../../components/sppg/SppgBatchesPanel'

export function SppgBatchesPage() {
  return (
    <SppgLayout activeMenu="batches" title="Batch & Label QR">
      <SppgBatchesPanel />
    </SppgLayout>
  )
}
