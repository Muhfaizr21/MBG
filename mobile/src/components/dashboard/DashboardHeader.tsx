import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { UserProfile } from '../../types/role';
import { useAuthRole } from '../../context/RoleContext';

interface DashboardHeaderProps {
  user: UserProfile;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  const { role, toggleRole } = useAuthRole();

  const handleRoleToggle = () => {
    Alert.alert(
      'Ganti Role (Pratinjau Multi-Role)',
      `Saat ini Anda berada di role "${role === 'guru' ? 'Guru (Validator)' : 'Siswa'}". Apakah ingin beralih ke role "${role === 'guru' ? 'Siswa (Penerima Manfaat)' : 'Guru'}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Ganti Role', onPress: toggleRole },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>Hi, {user.name}</Text>
        </View>
        <View style={styles.subtitleRow}>
          <Text style={styles.schoolText}>{user.schoolName}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <TouchableOpacity 
            style={[
              styles.roleBadge, 
              role === 'guru' ? styles.guruBadge : styles.siswaBadge
            ]}
            onPress={handleRoleToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.roleBadgeText}>
              {role === 'guru' ? '👨‍🏫 Guru' : '🎒 Siswa'} ⇄
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.avatarContainer} 
        onPress={handleRoleToggle}
        activeOpacity={0.8}
      >
        <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
        <View style={styles.onlineBadge} />
      </TouchableOpacity>
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
    paddingBottom: 16,
  },
  leftColumn: {
    flex: 1,
    marginRight: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  schoolText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  dotSeparator: {
    color: '#94A3B8',
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  guruBadge: {
    backgroundColor: '#FEF3C7',
  },
  siswaBadge: {
    backgroundColor: '#E0E7FF',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  avatarContainer: {
    position: 'relative',
    padding: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
