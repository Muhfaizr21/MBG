import { Severity } from './incident';

export interface ScanLogEntry {
  id: string;
  scannedAt: Date;
  batchCode: string;
  portions: number;
  score: number;
  severity: 'layak' | 'waspada' | 'ditolak';
}

/** Log pindaian boks MBG dengan data awal pengantaran hari ini. */
let entries: ScanLogEntry[] = [];
let counter = 0;

const initDefaultEntries = () => {
  const now = new Date();
  entries = [
    {
      id: 'scan-init-1',
      scannedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 5),
      batchCode: 'MBG-20261010-01A',
      portions: 28,
      score: 98,
      severity: 'layak',
    },
    {
      id: 'scan-init-2',
      scannedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 12),
      batchCode: 'MBG-20261010-01B',
      portions: 30,
      score: 97,
      severity: 'layak',
    },
    {
      id: 'scan-init-3',
      scannedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 18),
      batchCode: 'MBG-20261010-02A',
      portions: 29,
      score: 99,
      severity: 'layak',
    },
    {
      id: 'scan-init-4',
      scannedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 24),
      batchCode: 'MBG-20261010-02B',
      portions: 31,
      score: 96,
      severity: 'layak',
    },
    {
      id: 'scan-init-5',
      scannedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 30),
      batchCode: 'MBG-20261010-03B',
      portions: 33,
      score: 98,
      severity: 'layak',
    },
  ];
  counter = 5;
};

export const addScanLogEntry = (entry: Omit<ScanLogEntry, 'id'>): ScanLogEntry => {
  counter += 1;
  const created: ScanLogEntry = { ...entry, id: `scan-${counter}` };
  entries = [created, ...entries];
  return created;
};

export const getScanLog = (): ScanLogEntry[] => {
  if (entries.length === 0) {
    initDefaultEntries();
  }
  return entries;
};

export const clearScanLog = () => {
  entries = [];
  counter = 0;
};

export type HistoryRange = 'hari_ini' | 'tujuh_hari' | 'bulan_ini';

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const filterByRange = (log: ScanLogEntry[], range: HistoryRange, now = new Date()): ScanLogEntry[] => {
  const today = startOfDay(now);
  const days = range === 'hari_ini' ? 0 : range === 'tujuh_hari' ? 6 : 29;
  const from = today - days * 24 * 60 * 60 * 1000;
  return log.filter((entry) => startOfDay(entry.scannedAt) >= from);
};

export const searchBatch = (log: ScanLogEntry[], query: string): ScanLogEntry[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return log;
  return log.filter((entry) => entry.batchCode.toLowerCase().includes(needle));
};

export const formatClock = (date: Date): string =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} WIB`;

export const SEVERITY_LABEL: Record<ScanLogEntry['severity'], string> = {
  layak: 'Lolos Verifikasi AI',
  waspada: 'Lolos (Perlu Hasten)',
  ditolak: 'Ditolak / Rusak',
};

export const SEVERITY_COLOR: Record<ScanLogEntry['severity'], string> = {
  layak: '#10B981',
  waspada: '#F59E0B',
  ditolak: '#EF4444',
};

export const SEVERITY_BG: Record<ScanLogEntry['severity'], string> = {
  layak: '#ECFDF5',
  waspada: '#FFFBEB',
  ditolak: '#FEF2F2',
};

/** Porsi berstatus ditolak tidak boleh dibagikan, jadi dihitung terpisah dari
 *  porsi sisa yang masih aman. */
export const isDistributed = (severity: Severity | ScanLogEntry['severity']): boolean =>
  severity === 'layak' || severity === 'waspada';
