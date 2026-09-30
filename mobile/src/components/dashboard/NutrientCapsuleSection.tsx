import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NutrientCapsuleItem } from '../../types/role';

// Warna bar mengikuti status, bukan identitas parameter: protein dan karbo
// tidak boleh terbaca sebagai "berbeda prioritas", hanya tinggi bar yang
// berbeda (R-29, R-31).
const FILL_BY_STATUS: Record<NutrientCapsuleItem['status'], string> = {
  optimal: '#B45309',
  warning: '#A16207',
  alert: '#B91C1C',
};

const STATUS_LABEL: Record<NutrientCapsuleItem['status'], string> = {
  optimal: 'terpenuhi',
  warning: 'perlu perhatian',
  alert: 'di bawah batas',
};

interface NutrientCapsuleSectionProps {
  totalTarget: number;
  completedCount: number;
  juniorTarget: number;
  seniorTarget: number;
  rejectedCount: number;
  nutrients: NutrientCapsuleItem[];
  onStartValidation?: () => void;
  /** Alasan tombol validasi dikunci, mis. karena HACCP kedaluwarsa. */
  lockReason?: string;
}

export const NutrientCapsuleSection: React.FC<NutrientCapsuleSectionProps> = ({
  totalTarget,
  completedCount,
  juniorTarget,
  seniorTarget,
  rejectedCount,
  nutrients,
  onStartValidation,
  lockReason,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.heroMetricContainer}>
        <Text style={styles.bigHeroNumber}>{completedCount}</Text>
        <Text style={styles.heroSubtitle}>
          porsi tervalidasi dari {totalTarget} target hari ini · data contoh
        </Text>
        <Text style={styles.quotaSplitText}>
          Target {totalTarget} porsi: {juniorTarget} SD bawah + {seniorTarget} SD atas
        </Text>
        <Text style={styles.rejectedText}>
          {rejectedCount} porsi ditolak atau diisolate
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Estimasi gizi per porsi</Text>
          <Text style={styles.cardSubtitle}>
            Nilai estimasi dibanding target AKG kelompok SD atas
          </Text>
        </View>

        <View style={styles.capsulesRow}>
          {nutrients.map((item) => {
            const clamped = Math.min(Math.max(item.percentage, 4), 100);
            return (
              <View
                key={item.id}
                style={styles.capsuleColumn}
                accessible
                accessibilityLabel={`${item.name} ${item.amount}, ${item.percentage} persen dari batas AKG, ${STATUS_LABEL[item.status]}`}
              >
                <View style={styles.capsuleTrack}>
                  <View
                    style={[
                      styles.capsuleFill,
                      { height: `${clamped}%`, backgroundColor: FILL_BY_STATUS[item.status] },
                    ]}
                  />
                </View>

                <Text style={styles.capsuleLabel}>{item.name}</Text>
                <Text style={styles.capsuleAmount}>
                  {item.percentage}% · {item.amount}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {lockReason && (
        <View style={styles.lockNotice}>
          <Text style={styles.lockNoticeText}>{lockReason}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionButton, lockReason && styles.actionButtonLocked]}
        onPress={lockReason ? undefined : onStartValidation}
        disabled={Boolean(lockReason)}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(lockReason) }}
        accessibilityLabel="Mulai validasi porsi kelas"
        accessibilityHint={lockReason ?? 'Membuka pemindai boks'}
      >
        <Text style={styles.actionButtonText}>
          {lockReason ? 'Validasi Terkunci' : 'Mulai Validasi Porsi Kelas'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 28,
    marginBottom: 24,
  },
  heroMetricContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bigHeroNumber: {
    fontSize: 54,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  quotaSplitText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  rejectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 4,
  },
  lockNotice: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  lockNoticeText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  capsulesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  capsuleColumn: {
    alignItems: 'center',
    width: 64,
  },
  capsuleTrack: {
    width: 44,
    height: 168,
    backgroundColor: '#EDEFF3',
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  capsuleFill: {
    width: '100%',
    borderRadius: 22,
  },
  capsuleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  capsuleAmount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#EBA338',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  actionButtonLocked: {
    backgroundColor: '#E7E9EC',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
});
