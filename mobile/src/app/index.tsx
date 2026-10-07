import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { GuruDashboardView } from '../components/dashboard/GuruDashboardView';
import { HistoryScreen } from '../components/dashboard/HistoryScreen';
import { CommunityTabContent } from '../components/dashboard/CommunityTabContent';
import { ProfileTabContent } from '../components/dashboard/ProfileTabContent';
import { CustomBottomTabBar, TabKey } from '../components/dashboard/CustomBottomTabBar';
import { ScannerScreen } from '../components/dashboard/ScannerScreen';
import { HandoverScreen } from '../components/dashboard/HandoverScreen';
import { IncidentScreen } from '../components/dashboard/IncidentScreen';

export default function MobileAppEntry() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [flowScreen, setFlowScreen] = useState<'handover' | 'incident' | null>(null);

  // Sesi masih dipulihkan: tahan render utama supaya tidak kedip ke layar login.
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EBA338" />
      </View>
    );
  }

  // Belum login (atau role bukan akun mobile): paksa ke layar welcome awal.
  if (!user) {
    return <Redirect href="/welcome" />;
  }

  const handleCenterAction = () => {
    setFlowScreen(null);
    setActiveTab('action');
  };

  const handleExitFlow = () => {
    setFlowScreen(null);
    setActiveTab('home');
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <GuruDashboardView
            onTriggerScan={handleCenterAction}
            onOpenHandover={() => setFlowScreen('handover')}
            onOpenIncident={() => setFlowScreen('incident')}
            onOpenProfile={() => setActiveTab('profile')}
          />
        );
      case 'action':
        return (
          <ScannerScreen
            onExit={handleExitFlow}
            onOpenProfile={() => setActiveTab('profile')}
          />
        );
      case 'journey':
        return (
          <HistoryScreen
            onOpenScanner={handleCenterAction}
            onOpenProfile={() => setActiveTab('profile')}
          />
        );
      case 'community':
        return <CommunityTabContent onOpenProfile={() => setActiveTab('profile')} />;
      case 'profile':
        return <ProfileTabContent onBack={() => setActiveTab('home')} />;
      default:
        return <GuruDashboardView onTriggerScan={handleCenterAction} />;
    }
  };

  // Layar alur (serah terima) menutupi tab bar: ini satu pekerjaan penuh,
  // bukan perpindahan antar tab.
  if (flowScreen !== null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {flowScreen === 'handover' ? (
          <HandoverScreen onExit={handleExitFlow} />
        ) : (
          <IncidentScreen onExit={handleExitFlow} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" translucent={false} />
      <View style={styles.mainContent}>
        {renderActiveScreen()}
      </View>

      <CustomBottomTabBar
        activeTab={activeTab}
        onTabPress={(tab) => {
          setFlowScreen(null);
          setActiveTab(tab);
        }}
        onCenterActionPress={handleCenterAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9F8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
});
