import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthRole } from '../context/RoleContext';
import { GuruDashboardView } from '../components/dashboard/GuruDashboardView';
import { SiswaDashboardView } from '../components/dashboard/SiswaDashboardView';
import { ExploreTabContent } from '../components/dashboard/ExploreTabContent';
import { HistoryScreen } from '../components/dashboard/HistoryScreen';
import { ProfileTabContent } from '../components/dashboard/ProfileTabContent';
import { CustomBottomTabBar, TabKey } from '../components/dashboard/CustomBottomTabBar';
import { ScannerScreen } from '../components/dashboard/ScannerScreen';
import { HandoverScreen } from '../components/dashboard/HandoverScreen';
import { IncidentScreen } from '../components/dashboard/IncidentScreen';

export default function MobileAppEntry() {
  const { role } = useAuthRole();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [flowScreen, setFlowScreen] = useState<'handover' | 'incident' | null>(null);

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
        return role === 'guru' ? (
          <GuruDashboardView
            onTriggerScan={handleCenterAction}
            onOpenHandover={() => setFlowScreen('handover')}
            onOpenIncident={() => setFlowScreen('incident')}
          />
        ) : (
          <SiswaDashboardView />
        );
      case 'explore':
        return <ExploreTabContent />;
      case 'journey':
        return <HistoryScreen onOpenScanner={handleCenterAction} />;
      case 'profile':
        return <ProfileTabContent />;
      case 'action':
        return <ScannerScreen onExit={handleExitFlow} />;
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
  mainContent: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
});
