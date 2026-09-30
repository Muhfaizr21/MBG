import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { DashboardHeader } from './DashboardHeader';
import { WeeklyCalendarStrip } from './WeeklyCalendarStrip';
import { HeroMealCard } from './HeroMealCard';
import { QuickActionSection } from './QuickActionCard';
import { NutrientCapsuleSection } from './NutrientCapsuleSection';
import {
  MOCK_GURU_USER,
  MOCK_WEEKLY_DAYS,
  MOCK_HERO_MEAL_GURU,
  MOCK_QUICK_ACTIONS_GURU,
  MOCK_NUTRIENT_CAPSULES_GURU,
  MOCK_DASHBOARD_METRICS,
} from '../../data/mockValidatorData';
import { DayItem, QuickActionItem } from '../../types/role';

interface GuruDashboardViewProps {
  onTriggerScan?: () => void;
}

export const GuruDashboardView: React.FC<GuruDashboardViewProps> = ({ onTriggerScan }) => {
  const [days, setDays] = useState<DayItem[]>(MOCK_WEEKLY_DAYS);
  const [selectedDayId, setSelectedDayId] = useState<string>('d-4'); // Default Thursday (10)
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleSelectDay = (day: DayItem) => {
    setSelectedDayId(day.id);
  };

  const handleSelectAction = (action: QuickActionItem) => {
    setActiveModal(action.title);
  };

  const handleStartValidation = () => {
    if (onTriggerScan) {
      onTriggerScan();
    } else {
      setActiveModal('Pindai Boks AI 📦');
    }
  };

  const selectedDay = days.find((d) => d.id === selectedDayId) || days[3];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header (Hi, Jose Maria / Hi, Ibu Siti Aminah) */}
      <DashboardHeader user={MOCK_GURU_USER} />

      {/* 2. Weekly Calendar Strip (Mon 7 ... Thu 10 ... Sun 13) */}
      <WeeklyCalendarStrip
        days={days}
        selectedDayId={selectedDayId}
        onSelectDay={handleSelectDay}
      />

      {/* 3. Hero Meal Status Card (Morning Sun Illustration + Evening Pill) */}
      <HeroMealCard
        mealStatus={MOCK_HERO_MEAL_GURU}
        onPressDetail={() => setActiveModal('Rincian Menu & Alokasi')}
        onPressSecondary={() =>
          Alert.alert('Sesi Siang', 'Sesi makan siang dijadwalkan pukul 12:30 WIB.')
        }
      />

      {/* 4. Quick Actions (Pastel Cards Carousel) */}
      <QuickActionSection
        actions={MOCK_QUICK_ACTIONS_GURU}
        onSelectAction={handleSelectAction}
        onSeeAll={() => setActiveModal('Daftar Seluruh Prosedur')}
      />

      {/* 5. Nutrient Capsule Section (Matches Screen 2 of Reference) */}
      <NutrientCapsuleSection
        totalTarget={MOCK_DASHBOARD_METRICS.totalTarget}
        completedCount={MOCK_DASHBOARD_METRICS.completedCount}
        nutrients={MOCK_NUTRIENT_CAPSULES_GURU}
        onStartValidation={handleStartValidation}
      />

      {/* Interactive Detail Modal for Fast Testing */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{activeModal}</Text>
            <Text style={styles.modalBody}>
              Fitur validasi terintegrasi dengan SPPG Dapur #04 Menteng. Seluruh data tervalidasi akan dikirim secara real-time ke Command Center MBG Nasional.
            </Text>

            <View style={styles.modalInfoBox}>
              <Text style={styles.modalInfoTitle}>Ringkasan Boks Hari Ini:</Text>
              <Text style={styles.modalInfoText}>• Target: 650 Porsi Siswa (13 Master Totes)</Text>
              <Text style={styles.modalInfoText}>• Suhu Saat Tiba: 65.4°C (Batas Aman &gt; 60°C)</Text>
              <Text style={styles.modalInfoText}>• Waktu HACCP Tersisa: 165 Menit</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6', // Soft warm background matching reference
  },
  contentContainer: {
    paddingBottom: 110, // Avoid bottom tab bar
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 4,
  },
  modalInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalInfoText: {
    fontSize: 12,
    color: '#475569',
  },
  modalCloseButton: {
    backgroundColor: '#EBA338',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
