// Data tetap untuk halaman serah terima. Tidak ada backend di prototipe ini,
// jadi angka kuota dan identitas pengantar adalah data contoh yang diberi label
// di layar (R-17, R-38).
import { ContainerKind, PORTIONS_PER_TOTE } from '../utils/handover';

export const HANDOVER_SCHOOL = {
  name: 'SDN Menteng 01 Pagi',
  npsn: '20101234',
  npsnSuffix: 'SDN01P',
  cityCode: 'JKT',
};

export const HANDOVER_SHIPMENT = {
  kitchen: 'SPPG Menteng Jaya (Dapur #04)',
  fleetPlate: 'Armada B-9281-KBA',
  driverName: 'Bpk. Mulyono',
  orderedPortions: 650,
  portionsPerTote: PORTIONS_PER_TOTE,
  expectedTotes: 13,
  containerKind: 'hangat' as ContainerKind,
};

export const HANDOVER_ORGANOLEPTIC_PROMPT =
  'Uji organoleptik: rasa, aroma, dan tekstur sampel. Wajib dicatat bila ada tote di bawah 55°C.';
