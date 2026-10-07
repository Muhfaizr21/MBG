import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { UserRole, UserProfile } from '../types/role';
import { MOCK_GURU_USER, MOCK_SISWA_USER } from '../data/mockValidatorData';
import { BackendUser } from '../lib/api';
import { useAuth } from './AuthContext';

interface RoleContextType {
  role: UserRole;
  user: UserProfile;
  isGuru: boolean;
  isSiswa: boolean;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export interface RoleProviderProps {
  children: ReactNode;
  initialRole?: UserRole;
}

/** Role backend → role tampilan mobile: validator bekerja sebagai mode guru. */
function mobileRoleOf(backendRole: string): UserRole | null {
  if (backendRole === 'validator') return 'guru';
  if (backendRole === 'siswa') return 'siswa';
  return null;
}

function toProfile(backendUser: BackendUser, role: UserRole): UserProfile {
  return {
    id: backendUser.id,
    name: backendUser.fullName,
    role,
    roleTitle: role === 'siswa' ? 'Siswa Penerima Manfaat' : 'Validator Lapangan (Guru & Staf)',
    schoolName: backendUser.schoolName || MOCK_GURU_USER.schoolName,
    npsn: backendUser.npsn || MOCK_GURU_USER.npsn,
    assignedSPPG: backendUser.sppgId || MOCK_GURU_USER.assignedSPPG,
  };
}

export function RoleProvider({ children, initialRole = 'guru' }: RoleProviderProps) {
  const { user: authUser } = useAuth();
  const authRole = authUser ? mobileRoleOf(authUser.role) : null;
  const authUserId = authUser?.id ?? null;

  // Pratinjau multi-role (toggle) hanya berlaku di atas role hasil login.
  // Disimpan bersama pemilik sesinya: saat sesi berganti, nilai lama otomatis
  // diabaikan (pola "reset state saat props berubah", tanpa effect).
  const [preview, setPreview] = useState<{ ownerId: string | null; role: UserRole | null }>({
    ownerId: null,
    role: null,
  });

  const previewRole = preview.ownerId === authUserId ? preview.role : null;
  const role = previewRole ?? authRole ?? initialRole;

  const authProfile = useMemo(
    () => (authUser && authRole ? toProfile(authUser, authRole) : null),
    [authUser, authRole],
  );

  const user: UserProfile =
    authProfile && role === authRole
      ? authProfile
      : role === 'guru'
        ? MOCK_GURU_USER
        : MOCK_SISWA_USER;

  const setRole = (newRole: UserRole) => {
    setPreview({ ownerId: authUserId, role: newRole });
  };

  const toggleRole = () => {
    const current = previewRole ?? authRole ?? initialRole;
    setPreview({ ownerId: authUserId, role: current === 'guru' ? 'siswa' : 'guru' });
  };

  const value: RoleContextType = {
    role,
    user,
    isGuru: role === 'guru',
    isSiswa: role === 'siswa',
    setRole,
    toggleRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useAuthRole(): RoleContextType {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useAuthRole must be used within a RoleProvider');
  }
  return context;
}
