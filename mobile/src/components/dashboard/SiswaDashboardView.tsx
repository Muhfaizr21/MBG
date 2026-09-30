import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DashboardHeader } from './DashboardHeader';
import { MOCK_SISWA_USER } from '../../data/mockValidatorData';
import { useAuthRole } from '../../context/RoleContext';

export const SiswaDashboardView: React.FC = () => {
  const { toggleRole } = useAuthRole();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHeader user={MOCK_SISWA_USER} />

      <View style={styles.card}>
        <Text style={styles.cardBadge}>🎒 Role Siswa (Penerima Manfaat)</Text>
        <Text style={styles.cardTitle}>Menu Makan Siangmu Hari Ini</Text>
        <Text style={styles.cardSubtitle}>
          Nasi Ayam Panggang Madu, Capcay Brokoli, Pisang Cavendish, & Susu UHT 125ml
        </Text>

        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>545</Text>
            <Text style={styles.metricLbl}>Total Kalori</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>34g</Text>
            <Text style={styles.metricLbl}>Protein</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>100%</Text>
            <Text style={styles.metricLbl}>Kenyang & Bergizi</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.switchBackButton} onPress={toggleRole}>
          <Text style={styles.switchBackText}>← Kembali ke Dashboard Guru (Validator)</Text>
        </TouchableOpacity>
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
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 14,
    marginBottom: 24,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  metricLbl: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  switchBackButton: {
    backgroundColor: '#EBA338',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  switchBackText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
