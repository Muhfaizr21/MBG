import { SppgLayout } from '../../components/sppg/SppgLayout'
import { SppgRecipesPanel } from '../../components/sppg/SppgRecipesPanel'

export function SppgRecipesPage() {
  return (
    <SppgLayout activeMenu="recipes" title="Rencana Menu & Resep Standar TKPI">
      <SppgRecipesPanel />
    </SppgLayout>
  )
}
