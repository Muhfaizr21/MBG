import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgQualityPanel } from '../../components/sppg/SppgQualityPanel'

export function SppgQualityPage() {
  return (
    <SppgLayout activeMenu="quality" title="Kontrol Mutu HACCP">
      <SppgQualityPanel />
    </SppgLayout>
  )
}
