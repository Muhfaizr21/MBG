import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { UserRole, UserProfile } from '../types/role';
import { MOCK_GURU_USER } from '../data/mockValidatorData';
import { BackendUser } from '../lib/api';
import { useAuth } from './AuthContext';

interface RoleContextType {
  role: UserRole;
  user: UserProfile;
  isGuru: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export interface RoleProviderProps {
  children: ReactNode;
}

function toProfile(backendUser: BackendUser): UserProfile {
  const isGuest = backendUser.role === 'guest';
  if (isGuest) {
    return {
      id: backendUser.id,
      name: 'Mode Tamu',
      role: 'guru',
      roleTitle: 'Pratinjau Publik (Mode Tamu)',
      schoolName: 'Pratinjau Terbatas MBG',
      npsn: '-',
      assignedSPPG: '-',
    };
  }
  return {
    id: backendUser.id,
    name: backendUser.fullName,
    role: 'guru',
    roleTitle: 'Validator Lapangan (Guru & Staf)',
    schoolName: backendUser.schoolName || MOCK_GURU_USER.schoolName,
    npsn: backendUser.npsn || MOCK_GURU_USER.npsn,
    assignedSPPG: backendUser.sppgId || MOCK_GURU_USER.assignedSPPG,
  };
}

export function RoleProvider({ children }: RoleProviderProps) {
  const { user: authUser } = useAuth();

  const user: UserProfile = useMemo(() => {
    if (authUser) {
      return toProfile(authUser);
    }
    return MOCK_GURU_USER;
  }, [authUser]);

  const value: RoleContextType = useMemo(
    () => ({
      role: 'guru',
      user,
      isGuru: true,
    }),
    [user],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useAuthRole(): RoleContextType {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useAuthRole must be used within a RoleProvider');
  }
  return context;
}
