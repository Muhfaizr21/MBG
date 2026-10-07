import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { User, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/initials';

interface ProfileAvatarButtonProps {
  onOpenProfile?: () => void;
  size?: number;
}

export const ProfileAvatarButton: React.FC<ProfileAvatarButtonProps> = ({
  onOpenProfile,
  size = 40,
}) => {
  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useAuthRole();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const avatarRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 68, right: 20 });

  const handleAvatarPress = () => {
    if (isProfileMenuOpen) {
      setIsProfileMenuOpen(false);
      return;
    }

    if (avatarRef.current && typeof avatarRef.current.measureInWindow === 'function') {
      avatarRef.current.measureInWindow((x, y, width, height) => {
        if (typeof y === 'number' && typeof height === 'number') {
          const windowWidth = Dimensions.get('window').width;
          const right = Math.max(16, windowWidth - (x + width));
          setMenuPosition({
            top: y + height + 6,
            right,
          });
        }
        setIsProfileMenuOpen(true);
      });
    } else {
      setIsProfileMenuOpen(true);
    }
  };

  const handleSelectProfile = () => {
    setIsProfileMenuOpen(false);
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      router.push('/' as any);
    }
  };

  const handleSelectLogout = () => {
    setIsProfileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutConfirm(false);
      router.replace('/welcome' as any);
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const borderRadius = size / 2;

  return (
    <>
      <TouchableOpacity
        ref={avatarRef}
        onPress={handleAvatarPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Menu akun pengguna ${user.name}`}
        accessibilityHint="Buka opsi profil dan keluar"
        style={[styles.avatarButton, { borderRadius }]}
      >
        <View
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius },
            isProfileMenuOpen && styles.avatarActive,
          ]}
        >
          <Text style={[styles.avatarText, { fontSize: size > 36 ? 14 : 12 }]}>
            {getInitials(user.name)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Dropdown Menu Popover */}
      <Modal
        visible={isProfileMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProfileMenuOpen(false)}
      >
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => setIsProfileMenuOpen(false)}
        >
          <View
            style={[
              styles.menuContainer,
              { top: menuPosition.top, right: menuPosition.right },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Header Mini Info Pengguna */}
              <View style={styles.menuHeader}>
                <Text style={styles.menuHeaderName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.menuHeaderRole} numberOfLines={1}>
                  Guru Validator · {user.schoolName}
                </Text>
              </View>

              <View style={styles.menuDivider} />

              {/* Opsi 1: Profil */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={handleSelectProfile}
                accessibilityRole="button"
                accessibilityLabel="Lihat Profil"
              >
                <User size={18} color="#475569" />
                <Text style={styles.menuItemTextProfil}>Profil</Text>
              </Pressable>

              <View style={styles.menuDivider} />

              {/* Opsi 2: Keluar */}
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={handleSelectLogout}
                accessibilityRole="button"
                accessibilityLabel="Keluar dari Akun"
              >
                <LogOut size={18} color="#EF4444" />
                <Text style={styles.menuItemTextKeluar}>Keluar</Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Dialog Konfirmasi Logout */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setShowLogoutConfirm(false);
        }}
      >
        <Pressable
          style={styles.dialogBackdrop}
          onPress={() => {
            if (!isLoggingOut) setShowLogoutConfirm(false);
          }}
        >
          <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.logoutIconWrapper}>
              <LogOut size={26} color="#EF4444" />
            </View>
            <Text style={styles.dialogTitle}>Keluar dari Aplikasi</Text>
            <Text style={styles.dialogSubtitle}>
              Apakah Anda yakin ingin mengakhiri sesi akun ini? Anda harus masuk kembali untuk menggunakan aplikasi.
            </Text>

            <View style={styles.dialogButtonsRow}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                onPress={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogDestructiveButton, isLoggingOut && styles.buttonDisabled]}
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
                activeOpacity={0.85}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogDestructiveText}>Ya, Keluar</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  avatarButton: {
    overflow: 'hidden',
  },
  avatar: {
    backgroundColor: '#EBA338',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarActive: {
    borderColor: '#7C4A03',
    transform: [{ scale: 1.05 }],
  },
  avatarText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 190,
    overflow: 'hidden',
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  menuHeaderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuHeaderRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  menuItemPressed: {
    backgroundColor: '#F1F5F9',
  },
  menuItemTextProfil: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuItemTextKeluar: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  logoutIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  dialogDestructiveButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogDestructiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
