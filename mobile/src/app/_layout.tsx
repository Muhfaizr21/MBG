import React, { useEffect } from 'react';
import { DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RoleProvider } from '../context/RoleContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F9F8F6',
    card: '#FFFFFF',
    text: '#1E293B',
    primary: '#EBA338',
  },
};

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen smoothly on mount
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={AppTheme}>
        <RoleProvider initialRole="guru">
          <StatusBar style="dark" />
          <Slot />
        </RoleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
