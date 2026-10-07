import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Bell } from 'lucide-react-native';
import { ProfileAvatarButton } from './ProfileAvatarButton';

export interface FeatureHeaderProps {
  title: string;
  onOpenProfile?: () => void;
  onNotificationPress?: () => void;
}

export const FeatureHeader: React.FC<FeatureHeaderProps> = ({
  title,
  onOpenProfile,
  onNotificationPress,
}) => {
  const handleBellPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      Alert.alert(
        'Pemberitahuan MBG',
        'Armada B-9281-KBA dari SPPG Menteng dijadwalkan tiba pukul 07:10 WIB untuk serah terima porsi hari ini.',
        [{ text: 'Tutup', style: 'default' }]
      );
    }
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Right Actions: Notification Bell + Profile Avatar */}
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

        <ProfileAvatarButton onOpenProfile={onOpenProfile} size={40} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
    flex: 1,
    marginRight: 12,
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
