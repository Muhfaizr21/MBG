import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthRole } from '../context/RoleContext';
import { GuruDashboardView } from '../components/dashboard/GuruDashboardView';
import { SiswaDashboardView } from '../components/dashboard/SiswaDashboardView';
import { ExploreTabContent } from '../components/dashboard/ExploreTabContent';
import { JourneyTabContent } from '../components/dashboard/JourneyTabContent';
import { ProfileTabContent } from '../components/dashboard/ProfileTabContent';
import { CustomBottomTabBar, TabKey } from '../components/dashboard/CustomBottomTabBar';
import { ScanModal } from '../components/dashboard/ScanModal';

export default function MobileAppEntry() {
  const { role } = useAuthRole();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const handleCenterAction = () => {
    setScanModalVisible(true);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return role === 'guru' ? (
          <GuruDashboardView onTriggerScan={handleCenterAction} />
        ) : (
          <SiswaDashboardView />
        );
      case 'explore':
        return <ExploreTabContent />;
      case 'journey':
        return <JourneyTabContent />;
      case 'profile':
        return <ProfileTabContent />;
      default:
        return <GuruDashboardView onTriggerScan={handleCenterAction} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.mainContent}>
        {renderActiveScreen()}
      </View>

      {/* Floating Bottom Tab Bar matching Reference */}
      <CustomBottomTabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        onCenterActionPress={handleCenterAction}
      />

      {/* AI Box Scan Modal */}
      <ScanModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  mainContent: {
    flex: 1,
  },
});
