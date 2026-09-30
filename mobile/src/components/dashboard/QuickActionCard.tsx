import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { QuickActionItem, Tone } from '../../types/role';

// Tag kanan memakai warna hanya jika menyatakan status nyata (mendesak, aman,
// peringatan). Netral berarti tidak ada status yang perlu fanfare (R-29).
const TAG_BY_TONE: Record<Tone, string> = {
  neutral: '#475569',
  urgent: '#B91C1C',
  safe: '#15803D',
  warning: '#B45309',
};

interface QuickActionCardProps {
  item: QuickActionItem;
  onPress: (item: QuickActionItem) => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle}. ${item.tagRight}`}
    >
      <View style={styles.main}>
        <View style={styles.content}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text style={styles.subtitleText} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </View>
        <ChevronRight size={20} color="#94A3B8" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.tagLeftText}>{item.tagLeft}</Text>
        <Text style={[styles.tagRightText, { color: TAG_BY_TONE[item.tone] }]}>
          {item.tagRight}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

interface QuickActionSectionProps {
  actions: QuickActionItem[];
  onSelectAction: (item: QuickActionItem) => void;
}

export const QuickActionSection: React.FC<QuickActionSectionProps> = ({
  actions,
  onSelectAction,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Aksi Validasi</Text>

      {actions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum ada aksi untuk hari ini</Text>
          <Text style={styles.emptyBody}>
            Aksi muncul setelah Dapur SPPG mengirim jadwal pengantaran. Tarik ke bawah
            untuk mencoba lagi.
          </Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          {actions.map((action) => (
            <QuickActionCard key={action.id} item={action} onPress={onSelectAction} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: '100%',
    minHeight: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    padding: 14,
    gap: 10,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 4,
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
  tagRightText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyBody: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
});
