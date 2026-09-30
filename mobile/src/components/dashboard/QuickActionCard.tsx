import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { QuickActionItem } from '../../types/role';

interface QuickActionCardProps {
  item: QuickActionItem;
  onPress: (item: QuickActionItem) => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.backgroundColor }]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{item.title}</Text>
        </View>

        <Text style={styles.subtitleText} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.tagLeftText}>{item.tagLeft}</Text>
        <View style={styles.tagRightPill}>
          <Text style={[styles.tagRightText, { color: item.accentColor }]}>
            {item.tagRight}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface QuickActionSectionProps {
  actions: QuickActionItem[];
  onSelectAction: (item: QuickActionItem) => void;
  onSeeAll?: () => void;
}

export const QuickActionSection: React.FC<QuickActionSectionProps> = ({
  actions,
  onSelectAction,
  onSeeAll,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Aksi Cepat Validasi</Text>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>Semua aksi</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <QuickActionCard
            key={action.id}
            item={action}
            onPress={onSelectAction}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    width: 175,
    height: 145,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitleText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tagLeftText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tagRightPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagRightText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
