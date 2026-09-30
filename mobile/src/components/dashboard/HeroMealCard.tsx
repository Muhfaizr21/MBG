import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { HeroMealStatus, ArmadaStatus } from '../../types/role';

// Warna status di sini adalah versi gelap karena labelnya duduk di atas kartu
// amber, bukan di atas putih. Versi terang (#15803D, #B45309, #B91C1C) hanya
// aman di permukaan putih dan dipakai di ring HACCP.
const ARMADA_STATUS: Record<ArmadaStatus, { label: string; color: string }> = {
  en_route: { label: 'Menuju Sekolah', color: '#7C4A03' },
  arrived: { label: 'Tiba di Gerbang', color: '#14532D' },
  delayed: { label: 'Tertunda', color: '#7F1D1D' },
};

interface HeroMealCardProps {
  mealStatus: HeroMealStatus;
  validatedCount: number;
  onPressDetail?: () => void;
  onPressSecondary?: () => void;
}

export const HeroMealCard: React.FC<HeroMealCardProps> = ({
  mealStatus,
  validatedCount,
  onPressDetail,
  onPressSecondary,
}) => {
  const status = ARMADA_STATUS[mealStatus.armadaStatus];
  const validatedRatio = mealStatus.totalPortions ? validatedCount / mealStatus.totalPortions : 0;

  const handleCallDriver = () => {
    if (!mealStatus.driverPhone) return;
    Linking.openURL(`tel:${mealStatus.driverPhone}`).catch(() => {
      Alert.alert('Gagal membuka dialer', 'Nomor sopir tidak dapat dipanggil dari perangkat ini.');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sesi Hari Ini</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleCallDriver}
            disabled={!mealStatus.driverPhone}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              mealStatus.driverPhone
                ? `Panggil ${mealStatus.driverName} lewat telepon`
                : 'Panggil sopir belum tersedia, nomor belum terdaftar'
            }
          >
            <Text style={[styles.headerActionText, !mealStatus.driverPhone && styles.headerActionTextDisabled]}>
              {mealStatus.driverPhone ? 'Panggil sopir' : 'Nomor sopir belum ada'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={onPressDetail}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Lihat rincian menu dan alokasi porsi"
          >
            <Text style={styles.headerActionText}>Rincian menu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardsRow}>
        {/* Kartu ini satu-satunya elemen di layar yang boleh memakai glow amber:
            ia focal point, menyatakan status pengiriman hari ini (R-13). */}
        <TouchableOpacity
          style={styles.mainCard}
          onPress={onPressDetail}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`${mealStatus.sessionTitle}. Status armada ${status.label}. ${validatedCount} dari ${mealStatus.totalPortions} porsi tervalidasi. Buka rincian menu.`}
        >
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
            <Text style={styles.etaText}>Tiba {mealStatus.etaDelivery}</Text>
          </View>

          <View style={styles.cardTextContainer}>
            <Text style={styles.cardGreetingTitle}>{mealStatus.sessionTitle}</Text>
            <Text style={styles.cardSubtitle}>
              {mealStatus.fleetPlate} · {mealStatus.driverName}
            </Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressValue}>
                {validatedCount} dari {mealStatus.totalPortions} porsi
              </Text>
              <Text style={styles.progressCaption}>tervalidasi · data contoh</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${Math.round(validatedRatio * 100)}%` }]}
              />
            </View>
          </View>

          {/* Motif identitas: cakrawala matahari pagi, bukan ilustrasi stok (R-22).
              Ilustrasi ikut flow, bukan absolute, supaya tidak pernah menimpa
              teks atau progress bar pada ukuran layar apa pun. */}
          <View style={styles.illustrationWrapper} accessibilityElementsHidden>
            <Svg width="100%" height="56" viewBox="0 0 240 110" preserveAspectRatio="xMidYMax slice">
              <Path
                d="M30 40 Q35 34 40 40 Q45 34 50 40"
                stroke="#1E293B"
                strokeWidth="1.2"
                fill="none"
                opacity={0.35}
              />
              <Path
                d="M190 35 Q194 30 198 35 Q202 30 206 35"
                stroke="#1E293B"
                strokeWidth="1.2"
                fill="none"
                opacity={0.35}
              />

              <G transform="translate(120, 58)">
                <Circle r="24" fill="#FBBF24" opacity={0.35} />
                <Circle r="17" fill="#F5A524" />
                <Path d="M-5 0 Q0 7 5 0" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </G>

              <Path d="M-20 110 Q50 68 120 86 Q190 100 260 72 L260 110 Z" fill="#FDE68A" opacity={0.55} />
              <Path d="M-20 110 Q40 86 100 96 Q170 82 260 90 L260 110 Z" fill="#3F6212" />
            </Svg>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.companionCard}
          onPress={onPressSecondary}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sesi makan siang pukul 12:30. Belum ada rincian."
        >
          <Text style={styles.companionLabel}>Sesi Siang</Text>
          <Text style={styles.companionTime}>12:30</Text>
          <Text style={styles.companionHint}>Belum ada rincian</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerAction: {
    paddingVertical: 8,
  },
  headerActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  headerActionTextDisabled: {
    // Status nonaktif: tetap harus terbaca (R-25), jadi warna sama, hanya
    // tetap harus terbaca (R-25), jadi warna sama, hanya weight yang turun.
    // Tidak diberi warna redup yang tidak terbaca.
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mainCard: {
    flex: 1,
    height: 210,
    backgroundColor: '#F8B546',
    borderRadius: 20,
    paddingTop: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 'auto',
  },
  cardTextContainer: {
    zIndex: 2,
  },
  cardGreetingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
    opacity: 0.75,
    lineHeight: 16,
  },
  progressBlock: {
    zIndex: 2,
    marginBottom: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
    opacity: 0.7,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(30, 41, 59, 0.15)',
    marginTop: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
  },
  illustrationWrapper: {
    height: 56,
    marginTop: 8,
    marginHorizontal: -16,
    zIndex: 1,
  },
  companionCard: {
    width: 92,
    height: 210,
    backgroundColor: '#EDEFF3',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  companionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  companionTime: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  companionHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
});
