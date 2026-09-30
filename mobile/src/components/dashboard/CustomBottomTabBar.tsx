import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, Compass, FileText, User, Plus, LucideIcon } from 'lucide-react-native';

export type TabKey = 'home' | 'explore' | 'action' | 'journey' | 'profile';

interface TabDefinition {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  hint: string;
}

const TABS: TabDefinition[] = [
  { key: 'home', label: 'Beranda', icon: Home, hint: 'Beranda dan kuota porsi hari ini' },
  { key: 'explore', label: 'Distribusi', icon: Compass, hint: 'Verifikasi distribusi per kelas' },
  { key: 'journey', label: 'Riwayat', icon: FileText, hint: 'Riwayat BAST dan serah terima' },
  { key: 'profile', label: 'Profil', icon: User, hint: 'Akun sekolah dan preferensi' },
];

const INACTIVE = '#64748B';

interface CustomBottomTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  onCenterActionPress: () => void;
}

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  activeTab,
  onTabPress,
  onCenterActionPress,
}) => {
  return (
    <View style={styles.outerContainer} accessibilityRole="tablist">
      <View style={styles.barContainer}>
        {TABS.slice(0, 2).map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
          />
        ))}

        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity
            style={styles.centerActionButton}
            onPress={onCenterActionPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Pindai boks"
            accessibilityHint="Membuka pemindai QR boks"
          >
            {/* Ikon gelap di atas amber: putih di atas amber hanya 2:1 (R-25).
                Tanpa glow, karena glow amber milik kartu hero (R-13). */}
            <Plus size={26} color="#1E293B" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {TABS.slice(2).map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
          />
        ))}
      </View>
    </View>
  );
};

interface TabButtonProps {
  tab: TabDefinition;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onPress }) => {
  const Icon = tab.icon;

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
      accessibilityHint={tab.hint}
    >
      {/* Pill amber hanya untuk tab aktif: satu aksen, satu status nyata. */}
      <View style={[styles.iconWrapper, isActive && styles.iconActivePill]}>
        <Icon
          size={22}
          color={isActive ? '#7C4A03' : INACTIVE}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </View>
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 14,
  },
  iconActivePill: {
    backgroundColor: '#FDEBC8',
  },
  tabLabel: {
    fontSize: 11,
    color: INACTIVE,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#7C4A03',
    fontWeight: '700',
  },
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
    width: 60,
  },
  centerActionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EBA338',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
