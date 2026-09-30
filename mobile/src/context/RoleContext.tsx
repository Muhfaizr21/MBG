import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, UserProfile } from '../types/role';
import { MOCK_GURU_USER, MOCK_SISWA_USER } from '../data/mockValidatorData';

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

export function RoleProvider({ children, initialRole = 'guru' }: RoleProviderProps) {
  const [role, setRoleState] = useState<UserRole>(initialRole);

  const user = role === 'guru' ? MOCK_GURU_USER : MOCK_SISWA_USER;

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const toggleRole = () => {
    setRoleState((prev) => (prev === 'guru' ? 'siswa' : 'guru'));
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
