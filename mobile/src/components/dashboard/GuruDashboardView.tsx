import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { DashboardHeader } from './DashboardHeader';
import { WeeklyCalendarStrip } from './WeeklyCalendarStrip';
import { HaccpCountdown } from './HaccpCountdown';
import { HeroMealCard } from './HeroMealCard';
import { QuickActionSection } from './QuickActionCard';
import { NutrientCapsuleSection } from './NutrientCapsuleSection';
import { MenuDetailSheet, ActionDetailSheet } from './DetailSheets';
import {
  MOCK_WEEKLY_DAYS,
  MOCK_HERO_MEAL_GURU,
  MOCK_QUICK_ACTIONS_GURU,
  MOCK_NUTRIENT_CAPSULES_GURU,
  MOCK_DASHBOARD_METRICS,
} from '../../data/mockValidatorData';
import { QuickActionItem } from '../../types/role';
import { useAuthRole } from '../../context/RoleContext';
import { getHaccpView } from '../../utils/haccp';

interface GuruDashboardViewProps {
  onTriggerScan?: () => void;
  onOpenHandover?: () => void;
  onOpenIncident?: () => void;
}

export const GuruDashboardView: React.FC<GuruDashboardViewProps> = ({
  onTriggerScan,
  onOpenHandover,
  onOpenIncident,
}) => {
  const [selectedDayId, setSelectedDayId] = useState<string>('d-4');
  const { user } = useAuthRole();
  const [activeAction, setActiveAction] = useState<QuickActionItem | null>(null);
  const [menuDetailVisible, setMenuDetailVisible] = useState(false);
  const [haccpMinutes, setHaccpMinutes] = useState(MOCK_HERO_MEAL_GURU.haccpRemainingMinutes);

  // Hitung mundur yang sama dengan ring: satu sumber angka, supaya kunci scan
  // tidak bisa berbeda dari angka yang tampil di layar.
  useEffect(() => {
    const timer = setInterval(() => {
      setHaccpMinutes((current) => (current > 0 ? current - 1 : 0));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const haccp = getHaccpView(haccpMinutes);
  const scanLocked = haccp.state === 'critical';

  const closeSheets = () => {
    setActiveAction(null);
    setMenuDetailVisible(false);
  };

  const handleSelectAction = (action: QuickActionItem) => {
    if (action.targetScreen === 'handover' && onOpenHandover) {
      onOpenHandover();
      return;
    }
    if (action.targetScreen === 'incident' && onOpenIncident) {
      onOpenIncident();
      return;
    }
    if (action.targetScreen === 'scanner' && onTriggerScan) {
      onTriggerScan();
      return;
    }
    setActiveAction(action);
  };

  const handleStartValidation = () => {
    if (scanLocked) return;
    if (onTriggerScan) {
      onTriggerScan();
      return;
    }
    setActiveAction(MOCK_QUICK_ACTIONS_GURU[0]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHeader user={user} />

      <WeeklyCalendarStrip
        days={MOCK_WEEKLY_DAYS}
        selectedDayId={selectedDayId}
        onSelectDay={(day) => setSelectedDayId(day.id)}
      />

      <HaccpCountdown minutes={haccpMinutes} />

      <HeroMealCard
        mealStatus={MOCK_HERO_MEAL_GURU}
        validatedCount={MOCK_DASHBOARD_METRICS.completedCount}
        onPressDetail={() => setMenuDetailVisible(true)}
        onPressSecondary={() =>
          Alert.alert(
            'Sesi Siang',
            'Jadwal sesi makan siang 12:30 WIB. Rincian menu sesi siang belum tersedia di prototipe ini.',
          )
        }
      />

      <QuickActionSection actions={MOCK_QUICK_ACTIONS_GURU} onSelectAction={handleSelectAction} />

      <NutrientCapsuleSection
        totalTarget={MOCK_DASHBOARD_METRICS.totalTarget}
        juniorTarget={MOCK_DASHBOARD_METRICS.juniorTarget}
        seniorTarget={MOCK_DASHBOARD_METRICS.seniorTarget}
        completedCount={MOCK_DASHBOARD_METRICS.completedCount}
        rejectedCount={MOCK_DASHBOARD_METRICS.rejectedCount}
        nutrients={MOCK_NUTRIENT_CAPSULES_GURU}
        onStartValidation={handleStartValidation}
        lockReason={
          scanLocked ? 'Jam aman konsumsi habis. Scan boks dikunci sampai batch ditarik.' : undefined
        }
      />

      <MenuDetailSheet
        visible={menuDetailVisible}
        onClose={closeSheets}
        meal={MOCK_HERO_MEAL_GURU}
        haccp={haccp}
      />

      <ActionDetailSheet
        visible={activeAction !== null}
        onClose={closeSheets}
        action={activeAction}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  contentContainer: {
    paddingBottom: 110,
  },
});
