import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { UserProfile } from '../../types/role';
import { useAuthRole } from '../../context/RoleContext';
import { getInitials } from '../../utils/initials';

interface DashboardHeaderProps {
  user: UserProfile;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  const { role, toggleRole } = useAuthRole();
  const isGuru = role === 'guru';

  const handleRoleToggle = () => {
    Alert.alert(
      'Ganti Role (Pratinjau Multi-Role)',
      `Saat ini Anda berada di role "${isGuru ? 'Guru (Validator)' : 'Siswa'}". Beralih ke role "${isGuru ? 'Siswa (Penerima Manfaat)' : 'Guru'}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Ganti Role', onPress: toggleRole },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <Text style={styles.greetingText}>Halo, {user.name}</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.schoolText}>{user.schoolName}</Text>
          <Text style={styles.dotSeparator}>·</Text>
          {/* Label role adalah status nyata (role aktif) sekaligus satu-satunya
              kontrol ganti role, jadi badge ini berfungsi, bukan hiasan (R-09). */}
          <TouchableOpacity
            style={[styles.roleBadge, isGuru ? styles.guruBadge : styles.siswaBadge]}
            onPress={handleRoleToggle}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Role aktif: ${isGuru ? 'Guru Validator' : 'Siswa'}`}
            accessibilityHint="Ganti role pratinjau"
          >
            <Text style={styles.roleBadgeText}>{isGuru ? 'Guru Validator' : 'Siswa'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar inisial, bukan foto orang: belum ada sumber foto pengguna
          yang terverifikasi (R-18, R-23). */}
      <View
        style={styles.avatar}
        accessible
        accessibilityLabel={`Pengguna ${user.name}, ${user.roleTitle}`}
      >
        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
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
    paddingBottom: 16,
  },
  leftColumn: {
    flex: 1,
    marginRight: 16,
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
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  schoolText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  dotSeparator: {
    color: '#64748B',
    fontSize: 13,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guruBadge: {
    backgroundColor: '#FDEBC8',
  },
  siswaBadge: {
    backgroundColor: '#EDEFF3',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C4A03',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBA338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
});
