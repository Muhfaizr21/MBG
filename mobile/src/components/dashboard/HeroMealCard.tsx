import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { HeroMealStatus } from '../../types/role';

interface HeroMealCardProps {
  mealStatus: HeroMealStatus;
  onPressDetail?: () => void;
  onPressSecondary?: () => void;
}

export const HeroMealCard: React.FC<HeroMealCardProps> = ({
  mealStatus,
  onPressDetail,
  onPressSecondary,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sesi Hari Ini</Text>
        <TouchableOpacity onPress={onPressDetail} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>Detail menu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsRow}>
        {/* Main Hero Card (Sun & Hills) */}
        <TouchableOpacity
          style={styles.mainCard}
          onPress={onPressDetail}
          activeOpacity={0.9}
        >
          {/* Text Content */}
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardGreetingTitle}>Makan Pagi Bergizi</Text>
            <Text style={styles.cardSubtitle}>
              {mealStatus.greeting}
            </Text>
            
            <View style={styles.deliveryBadge}>
              <Text style={styles.deliveryBadgeText}>
                🚚 {mealStatus.etaDelivery} • {mealStatus.fleetPlate}
              </Text>
            </View>
          </View>

          {/* Cheerful Vector Illustration: Sun, Hills & Trees */}
          <View style={styles.illustrationWrapper}>
            <Svg width="100%" height="110" viewBox="0 0 240 110">
              {/* Soft sky horizon */}
              <Rect x="0" y="0" width="240" height="110" fill="transparent" />

              {/* Distant Birds */}
              <Path
                d="M30 40 Q35 34 40 40 Q45 34 50 40"
                stroke="#6B7280"
                strokeWidth="1.2"
                fill="none"
                opacity={0.6}
              />
              <Path
                d="M190 35 Q194 30 198 35 Q202 30 206 35"
                stroke="#6B7280"
                strokeWidth="1.2"
                fill="none"
                opacity={0.6}
              />

              {/* Smiling Happy Sun */}
              <G transform="translate(120, 60)">
                {/* Sun Glow */}
                <Circle r="24" fill="#FBBF24" opacity={0.3} />
                {/* Sun Body */}
                <Circle r="18" fill="#F97316" />
                {/* Eyes */}
                <Circle cx="-6" cy="-2" r="2" fill="#1E293B" />
                <Circle cx="6" cy="-2" r="2" fill="#1E293B" />
                {/* Blushing Cheeks */}
                <Circle cx="-10" cy="4" r="2.5" fill="#EF4444" opacity={0.6} />
                <Circle cx="10" cy="4" r="2.5" fill="#EF4444" opacity={0.6} />
                {/* Smile */}
                <Path
                  d="M-4 3 Q0 8 4 3"
                  stroke="#1E293B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </G>

              {/* Rolling Hills (Back layer) */}
              <Path
                d="M-20 110 Q50 65 120 85 Q190 100 260 70 L260 110 Z"
                fill="#FDE68A"
                opacity={0.6}
              />

              {/* Rolling Hills (Front layer - lush green) */}
              <Path
                d="M-20 110 Q40 85 100 95 Q170 80 260 90 L260 110 Z"
                fill="#346849"
              />

              {/* Pine Trees Left */}
              <G transform="translate(10, 60)">
                <Path d="M10 50 L16 35 L4 35 L12 25 L6 25 L10 16 L14 25 L8 25 L16 35 L10 50 Z" fill="#204E35" />
                <Path d="M24 50 L28 40 L18 40 L25 30 L20 30 L24 22 L28 30 L23 30 L29 40 L24 50 Z" fill="#2A5C3F" />
              </G>

              {/* Pine Trees Right */}
              <G transform="translate(195, 62)">
                <Path d="M12 48 L18 36 L7 36 L14 26 L9 26 L12 18 L15 26 L10 26 L17 36 L12 48 Z" fill="#204E35" />
                <Path d="M24 48 L28 38 L19 38 L25 29 L21 29 L24 20 L27 29 L23 29 L29 38 L24 48 Z" fill="#1C452E" />
              </G>
            </Svg>
          </View>
        </TouchableOpacity>

        {/* Companion Right Card (Matches 'Evening' card in reference) */}
        <TouchableOpacity
          style={styles.companionCard}
          onPress={onPressSecondary}
          activeOpacity={0.8}
        >
          <View style={styles.companionInner}>
            <View style={styles.companionDot} />
            <Text style={styles.companionVerticalText}>Sesi Siang</Text>
            <Text style={styles.companionSubText}>12:30</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mainCard: {
    flex: 1,
    height: 200,
    backgroundColor: '#F8B546', // Warm golden yellow
    borderRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTextContainer: {
    zIndex: 2,
  },
  cardGreetingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 16,
  },
  deliveryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  deliveryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
  },
  illustrationWrapper: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: 110,
    zIndex: 1,
  },
  companionCard: {
    width: 68,
    height: 200,
    backgroundColor: '#D1C8B8', // Soft warm taupe/greige matching reference
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  companionInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8C8270',
  },
  companionVerticalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A4335',
    transform: [{ rotate: '-90deg' }],
    width: 90,
    textAlign: 'center',
  },
  companionSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B6252',
  },
});
