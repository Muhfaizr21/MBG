import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DashboardHeader } from './DashboardHeader';
import { useAuthRole } from '../../context/RoleContext';
import { MOCK_MACRO_ESTIMATE, SCAN_GRADE_BAND } from '../../data/mockScannerData';
import { readMacros } from '../../utils/nutrition';

const HEADLINE_MACROS = ['energi', 'protein', 'serat'] as const;

interface SiswaDashboardViewProps {
  onOpenProfile?: () => void;
}

// Role siswa tidak punya tombol ganti role sendiri: badge role di header sudah
// cukup untuk itu. Dua kontrol untuk hal yang sama bikin ragu.
export const SiswaDashboardView: React.FC<SiswaDashboardViewProps> = ({ onOpenProfile }) => {
  const { user } = useAuthRole();
  const macros = useMemo(() => readMacros(SCAN_GRADE_BAND, MOCK_MACRO_ESTIMATE), []);
  const headline = macros.filter((macro) =>
    (HEADLINE_MACROS as readonly string[]).includes(macro.key),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHeader user={user} onOpenProfile={onOpenProfile} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Menu hari ini</Text>
        <Text style={styles.cardSubtitle}>
          Paket A: Nasi Ayam Panggang Madu, Tahu Organik, Capcay Brokoli Wortel, Pisang
          Cavendish, dan Susu UHT 125ml
        </Text>

        <View style={styles.metricRow}>
          {headline.map((macro, index) => (
            <React.Fragment key={macro.key}>
              {index > 0 && <View style={styles.metricDivider} />}
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {macro.estimated} {macro.unit}
                </Text>
                <Text style={styles.metricLabel}>{macro.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.dataNote}>
          Angka gizi di atas adalah estimasi dari data bahan Dapur SPPG, bukan hasil
          penimbangan di sekolah.
        </Text>
      </View>

      <View style={styles.allergenBox}>
        <Text style={styles.allergenTitle}>Alergen menu</Text>
        <Text style={styles.allergenText}>
          Mengandung susu sapi, kedelai, dan telur. Sampaikan ke wali kelas bila ada
          riwayat alergi.
        </Text>
      </View>
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
  card: {
    margin: 16,
    marginBottom: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E9EC',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginTop: 6,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F9F8F6',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 20,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E7E9EC',
  },
  dataNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 14,
  },
  allergenBox: {
    margin: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FEF3E2',
  },
  allergenTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C4A03',
  },
  allergenText: {
    fontSize: 13,
    color: '#7C4A03',
    lineHeight: 19,
    marginTop: 4,
  },
});
