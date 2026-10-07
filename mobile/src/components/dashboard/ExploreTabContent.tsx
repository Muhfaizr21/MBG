import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { CheckCircle2, Clock, ChevronRight } from 'lucide-react-native';

export const ExploreTabContent: React.FC = () => {
  const totes = [
    { id: 'TOTE-01', class: 'Kelas 1A', count: 32, status: 'validated', temp: '65.2°C' },
    { id: 'TOTE-02', class: 'Kelas 1B', count: 32, status: 'validated', temp: '65.0°C' },
    { id: 'TOTE-03', class: 'Kelas 2A', count: 30, status: 'validated', temp: '64.8°C' },
    { id: 'TOTE-04', class: 'Kelas 2B', count: 31, status: 'validated', temp: '65.5°C' },
    { id: 'TOTE-05', class: 'Kelas 3A', count: 33, status: 'pending', temp: '64.5°C' },
    { id: 'TOTE-06', class: 'Kelas 3B', count: 32, status: 'pending', temp: '64.2°C' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Daftar Master Boks MBG</Text>
        <Text style={styles.subtitle}>Verifikasi distribusi per kelas & suhu organoleptik</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>13</Text>
          <Text style={styles.summaryLbl}>Total Boks</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: '#10B981' }]}>4</Text>
          <Text style={styles.summaryLbl}>Tervalidasi</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>9</Text>
          <Text style={styles.summaryLbl}>Menunggu</Text>
        </View>
      </View>

      <View style={styles.listSection}>
        {totes.map((tote) => (
          <TouchableOpacity key={tote.id} style={styles.toteCard} activeOpacity={0.7}>
            <View style={styles.toteLeft}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: tote.status === 'validated' ? '#DCFCE7' : '#FEF3C7' },
                ]}
              >
                {tote.status === 'validated' ? (
                  <CheckCircle2 size={18} color="#10B981" />
                ) : (
                  <Clock size={18} color="#F59E0B" />
                )}
              </View>
              <View>
                <Text style={styles.toteId}>{tote.id} • {tote.class}</Text>
                <Text style={styles.toteMeta}>
                  {tote.count} Porsi • Suhu: {tote.temp}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  summaryLbl: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  listSection: {
    gap: 10,
  },
  toteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  toteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toteId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  toteMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
