import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProfileAvatarButton } from './ProfileAvatarButton';

export interface FeatureHeaderProps {
  title: string;
  onOpenProfile?: () => void;
}

export const FeatureHeader: React.FC<FeatureHeaderProps> = ({ title, onOpenProfile }) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <ProfileAvatarButton onOpenProfile={onOpenProfile} size={40} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
    flex: 1,
    marginRight: 12,
  },
});
