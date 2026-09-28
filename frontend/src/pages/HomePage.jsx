import { HeroSection } from '../components/home/HeroSection'
import { OverviewSection } from '../components/home/OverviewSection'
import { DistributionMapSection } from '../components/home/DistributionMapSection'
import { RoleShowcase } from '../components/home/RoleShowcase'
import { QualityArchitecture } from '../components/home/QualityArchitecture'
import { FlowSection } from '../components/home/FlowSection'
import { FaqSection } from '../components/home/FaqSection'
import { BottomCta } from '../components/home/BottomCta'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <OverviewSection />
      <DistributionMapSection />
      <RoleShowcase />
      <QualityArchitecture />
      <FlowSection />
      <FaqSection />
      <BottomCta />
    </>
  )
}
