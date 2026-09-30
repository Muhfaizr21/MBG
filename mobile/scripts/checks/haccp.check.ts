import { getHaccpState, getHaccpView, HACCP_TOTAL_MINUTES } from '../../src/utils/haccp.ts';

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
  if (actual !== expected) {
    throw new Error(`haccp check failed: ${label}, got ${String(actual)}`);
  }
};

assertEqual(getHaccpState(165), 'safe', '165 menit masih aman');
assertEqual(getHaccpState(91), 'safe', '91 menit masih aman');
assertEqual(getHaccpState(90), 'warning', '90 menit sudah waspada');
assertEqual(getHaccpState(30), 'warning', '30 menit masih waspada');
assertEqual(getHaccpState(0), 'critical', '0 menit kedaluwarsa');
assertEqual(getHaccpState(-5), 'critical', 'nilai negatif kedaluwarsa');

assertEqual(getHaccpView(HACCP_TOTAL_MINUTES + 60).minutes, HACCP_TOTAL_MINUTES, 'ratio tidak melewati total');
assertEqual(getHaccpView(-5).ratio, 0, 'ratio tidak negatif');
assertEqual(getHaccpView(HACCP_TOTAL_MINUTES).ratio, 100, 'ratio penuh');
assertEqual(getHaccpView(120).ratio, 50, 'ratio setengah');
assertEqual(getHaccpView(120).label, 'Aman', 'label aman');
assertEqual(getHaccpView(45).label, 'Waspada', 'label waspada');
assertEqual(getHaccpView(0).label, 'Kedaluwarsa', 'label kedaluwarsa');
assertEqual(getHaccpView(0).guidance.includes('Kunci scan'), true, 'panduan menyebut kunci scan');

console.log('haccp check: OK');
