import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { UserCheck, Shield, School, ArrowRightLeft, LogOut } from 'lucide-react-native';
import { useAuthRole } from '../../context/RoleContext';
import { getInitials } from '../../utils/initials';

export const ProfileTabContent: React.FC = () => {
  const { user, role, toggleRole } = useAuthRole();

  const handleRoleToggle = () => {
    Alert.alert(
      'Ganti Role Aplikasi',
      `Beralih ke role "${role === 'guru' ? 'Siswa (Penerima Manfaat)' : 'Guru (Validator)'}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ganti Sekarang', onPress: toggleRole },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profil Pengguna</Text>
        <Text style={styles.subtitle}>Kelola akun & preferensi validasi MBG</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.roleTitle}>{user.roleTitle}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {role === 'guru' ? 'Mode Guru / Validator' : 'Mode Siswa'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Informasi Penugasan</Text>

        <View style={styles.itemRow}>
          <School size={18} color="#64748B" />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemLabel}>Sekolah Induk</Text>
            <Text style={styles.itemValue}>{user.schoolName}</Text>
          </View>
        </View>

        <View style={styles.itemRow}>
          <Shield size={18} color="#64748B" />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemLabel}>NPSN</Text>
            <Text style={styles.itemValue}>{user.npsn}</Text>
          </View>
        </View>

        <View style={styles.itemRow}>
          <UserCheck size={18} color="#64748B" />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemLabel}>Dapur SPPG Mitra</Text>
            <Text style={styles.itemValue}>{user.assignedSPPG}</Text>
          </View>
        </View>
      </View>

      {/* SOLID Multi-Role Switcher */}
      <TouchableOpacity
        style={styles.switchRoleButton}
        onPress={handleRoleToggle}
        activeOpacity={0.85}
      >
        <ArrowRightLeft size={18} color="#FFFFFF" />
        <Text style={styles.switchRoleText}>
          Beralih ke Role {role === 'guru' ? 'Siswa' : 'Guru'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => Alert.alert('Keluar', 'Sesi Anda telah aman.')}
        activeOpacity={0.7}
      >
        <LogOut size={16} color="#EF4444" />
        <Text style={styles.logoutText}>Keluar dari Aplikasi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: '#EBA338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 10,
  },
  roleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 1,
  },
  switchRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EBA338',
    borderRadius: 20,
    paddingVertical: 14,
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  switchRoleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
});
