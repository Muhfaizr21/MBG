import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, Compass, Plus, FileText, User } from 'lucide-react-native';

export type TabKey = 'home' | 'explore' | 'action' | 'journey' | 'profile';

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
    <View style={styles.outerContainer}>
      <View style={styles.barContainer}>
        {/* Tab 1: Home */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onTabPress('home')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, activeTab === 'home' && styles.iconActivePill]}>
            <Home
              size={22}
              color={activeTab === 'home' ? '#1E293B' : '#94A3B8'}
              strokeWidth={activeTab === 'home' ? 2.5 : 2}
            />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Explore / Validasi */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onTabPress('explore')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, activeTab === 'explore' && styles.iconActivePill]}>
            <Compass
              size={22}
              color={activeTab === 'explore' ? '#1E293B' : '#94A3B8'}
              strokeWidth={activeTab === 'explore' ? 2.5 : 2}
            />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'explore' && styles.tabLabelActive]}>
            Explore
          </Text>
        </TouchableOpacity>

        {/* Center Floating Elevated Action Button (+) */}
        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity
            style={styles.centerActionButton}
            onPress={onCenterActionPress}
            activeOpacity={0.85}
          >
            <Plus size={26} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Tab 4: Journey / BAST */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onTabPress('journey')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, activeTab === 'journey' && styles.iconActivePill]}>
            <FileText
              size={22}
              color={activeTab === 'journey' ? '#1E293B' : '#94A3B8'}
              strokeWidth={activeTab === 'journey' ? 2.5 : 2}
            />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'journey' && styles.tabLabelActive]}>
            Journey
          </Text>
        </TouchableOpacity>

        {/* Tab 5: Profile */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onTabPress('profile')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, activeTab === 'profile' && styles.iconActivePill]}>
            <User
              size={22}
              color={activeTab === 'profile' ? '#1E293B' : '#94A3B8'}
              strokeWidth={activeTab === 'profile' ? 2.5 : 2}
            />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    borderRadius: 36,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 16,
  },
  iconActivePill: {
    backgroundColor: '#F1F5F9',
  },
  tabLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
    width: 60,
  },
  centerActionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EBA338', // Golden amber matching reference
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});
