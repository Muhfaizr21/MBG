import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FileCheck, ShieldCheck, Truck, Download } from 'lucide-react-native';

export const JourneyTabContent: React.FC = () => {
  const bastHistory = [
    {
      id: 'BAST-20261010-001',
      date: 'Kamis, 10 Okt 2026 • 07:15 WIB',
      driver: 'Bpk. Mulyono (Armada B-9281-KBA)',
      portions: '650 Porsi (13 Totes)',
      status: 'Ditandatangani Digital',
      kitchen: 'Dapur SPPG Menteng Jaya #04',
    },
    {
      id: 'BAST-20261009-001',
      date: 'Rabu, 09 Okt 2026 • 07:12 WIB',
      driver: 'Bpk. Supriadi (Armada B-9142-TXA)',
      portions: '650 Porsi (13 Totes)',
      status: 'Selesai & Sah',
      kitchen: 'Dapur SPPG Menteng Jaya #04',
    },
    {
      id: 'BAST-20261008-001',
      date: 'Selasa, 08 Okt 2026 • 07:10 WIB',
      driver: 'Bpk. Mulyono (Armada B-9281-KBA)',
      portions: '650 Porsi (13 Totes)',
      status: 'Selesai & Sah',
      kitchen: 'Dapur SPPG Menteng Jaya #04',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat BAST & Serah Terima</Text>
        <Text style={styles.subtitle}>Bukti Acara Serah Terima Dapur SPPG ke Sekolah</Text>
      </View>

      <View style={styles.noticeCard}>
        <ShieldCheck size={24} color="#10B981" />
        <View style={styles.noticeTextContainer}>
          <Text style={styles.noticeTitle}>Integritas BAST Terjamin</Text>
          <Text style={styles.noticeDesc}>
            Setiap dokumen BAST tersertifikasi digital dan tersinkronisasi otomatis dengan Satgas MBG Pusat.
          </Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        {bastHistory.map((item) => (
          <View key={item.id} style={styles.bastCard}>
            <View style={styles.bastHeader}>
              <View style={styles.bastIdRow}>
                <FileCheck size={16} color="#EBA338" />
                <Text style={styles.bastIdText}>{item.id}</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.bastDate}>{item.date}</Text>

            <View style={styles.bastDetails}>
              <Text style={styles.detailRow}>🚚 {item.driver}</Text>
              <Text style={styles.detailRow}>🍱 {item.portions}</Text>
              <Text style={styles.detailRow}>🏢 {item.kitchen}</Text>
            </View>

            <TouchableOpacity style={styles.downloadButton} activeOpacity={0.7}>
              <Download size={14} color="#EBA338" />
              <Text style={styles.downloadText}>Unduh PDF BAST</Text>
            </TouchableOpacity>
          </View>
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
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  noticeDesc: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  listContainer: {
    gap: 14,
  },
  bastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  bastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bastIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bastIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  badgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  bastDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  bastDetails: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    gap: 4,
    marginBottom: 12,
  },
  detailRow: {
    fontSize: 12,
    color: '#475569',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBA338',
  },
  downloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EBA338',
  },
});
