import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Bell, UtensilsCrossed } from 'lucide-react-native';
import { UserProfile } from '../../types/role';
import { ProfileAvatarButton } from './ProfileAvatarButton';

interface DashboardHeaderProps {
  user?: UserProfile;
  onOpenProfile?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onOpenProfile }) => {
  const handleBellPress = () => {
    Alert.alert(
      'Pemberitahuan MBG',
      'Armada B-9281-KBA dari SPPG Menteng dijadwalkan tiba pukul 07:10 WIB untuk serah terima porsi hari ini.',
      [{ text: 'Tutup', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Left Side: App Logo & Stylized Brand Title */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <UtensilsCrossed size={18} color="#1E293B" strokeWidth={2.5} />
        </View>
        <Text style={styles.brandTitle}>
          Kawan<Text style={styles.brandTitleAccent}>Gizi</Text>
        </Text>
      </View>

      {/* Right Side: Notification Bell + Profile Avatar */}
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={handleBellPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Pemberitahuan"
        >
          <Bell size={20} color="#1E293B" />
          <View style={styles.bellBadgeDot} />
        </TouchableOpacity>

        {/* Interactive Profile Avatar Button with Dropdown */}
        <ProfileAvatarButton onOpenProfile={onOpenProfile} size={40} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 100,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EBA338',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: '#D97706',
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
