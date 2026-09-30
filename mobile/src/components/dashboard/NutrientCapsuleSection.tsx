import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NutrientCapsuleItem } from '../../types/role';

interface NutrientCapsuleSectionProps {
  totalTarget: number;
  completedCount: number;
  nutrients: NutrientCapsuleItem[];
  onStartValidation?: () => void;
}

export const NutrientCapsuleSection: React.FC<NutrientCapsuleSectionProps> = ({
  totalTarget,
  completedCount,
  nutrients,
  onStartValidation,
}) => {
  return (
    <View style={styles.container}>
      {/* Big Hero Metric (Matching Screen 2 of Reference) */}
      <View style={styles.heroMetricContainer}>
        <Text style={styles.bigHeroNumber}>{completedCount}</Text>
        <Text style={styles.heroSubtitle}>
          Porsi tervalidasi dari {totalTarget} target penerima manfaat hari ini.
        </Text>
      </View>

      {/* White Card with Rounded Capsules */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Standar Gizi & Kualitas</Text>
          <Text style={styles.cardSubtitle}>
            4 parameter utama kecukupan nutrisi standar Kemenkes RI
          </Text>
        </View>

        {/* 4 Vertical Capsule Bars */}
        <View style={styles.capsulesRow}>
          {nutrients.map((item) => {
            return (
              <View key={item.id} style={styles.capsuleColumn}>
                {/* Capsule Track */}
                <View style={styles.capsuleTrack}>
                  {/* Fill from bottom */}
                  <View
                    style={[
                      styles.capsuleFill,
                      {
                        height: `${Math.min(Math.max(item.percentage, 20), 100)}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  >
                    <Text style={styles.percentageText}>{item.percentage}%</Text>
                  </View>
                </View>

                {/* Capsule Label below */}
                <Text style={styles.capsuleLabel}>{item.name}</Text>
                <Text style={styles.capsuleAmount}>{item.amount}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Bottom Action Pill Button (Matching Reference) */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onStartValidation}
        activeOpacity={0.88}
      >
        <Text style={styles.actionButtonText}>Mulai Validasi Porsi Kelas</Text>
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
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
    color: '#94A3B8',
    fontWeight: '400',
    marginTop: 4,
  },
  capsulesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  capsuleColumn: {
    alignItems: 'center',
    width: 64,
  },
  capsuleTrack: {
    width: 58,
    height: 180,
    backgroundColor: '#ECEEEF', // Smooth light grey track matching reference
    borderRadius: 29,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  capsuleFill: {
    width: '100%',
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  capsuleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  capsuleAmount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#EBA338', // Golden amber matching reference
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
