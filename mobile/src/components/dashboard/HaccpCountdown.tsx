import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getHaccpView } from '../../utils/haccp';

const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface HaccpCountdownProps {
  /** Sisa menit aman konsumsi. Dipasok parent supaya ring dan kunci scan
      memakai angka yang sama. */
  minutes: number;
}

export const HaccpCountdown: React.FC<HaccpCountdownProps> = ({ minutes }) => {
  const view = getHaccpView(minutes);
  const dashOffset = CIRCUMFERENCE * (1 - view.ratio / 100);

  return (
    <View style={styles.container}>
      <View
        style={styles.ringWrapper}
        accessible
        accessibilityLabel={`Sisa waktu aman konsumsi ${view.minutes} menit, status ${view.label}. ${view.guidance}`}
      >
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#E7E9EC"
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={view.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            // Mulai dari atas, bukan dari jam 3 seperti default SVG.
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter} accessibilityElementsHidden>
          <Text style={styles.minutes}>{view.minutes}</Text>
          <Text style={styles.minutesUnit}>menit</Text>
        </View>
      </View>

      <View style={styles.copy}>
        {/* Titik + label status: warna di sini menyatakan kondisi nyata
            (aman / waspada / kedaluwarsa), bukan hiasan (R-31). */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: view.color }]} />
          <Text style={[styles.statusLabel, { color: view.color }]}>{view.label}</Text>
        </View>
        <Text style={styles.title}>Batas aman konsumsi</Text>
        <Text style={styles.guidance}>{view.guidance}</Text>
        <Text style={styles.footnote}>Hitung mundur 4 jam sejak makanan selesai dimasak · data contoh</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    gap: 16,
  },
  ringWrapper: {
    width: SIZE,
    height: SIZE,
  },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutes: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -1,
  },
  minutesUnit: {
    fontSize: 11,
    color: '#64748B',
  },
  copy: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  guidance: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginTop: 4,
  },
  footnote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
  },
});
