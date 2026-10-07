import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { WelcomeScreen } from '../components/welcome/WelcomeScreen';

export default function WelcomeRoute() {
  const { user, loading } = useAuth();

  // Bila sudah terautentikasi, langsung arahkan ke Dashboard utama
  if (!loading && user) {
    return <Redirect href="/" />;
  }

  return <WelcomeScreen />;
}
