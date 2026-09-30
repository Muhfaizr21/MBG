import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { HeroMealStatus, QuickActionItem } from '../../types/role';
import { HaccpView } from '../../utils/haccp';

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

interface MenuDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  meal: HeroMealStatus;
  haccp: HaccpView;
}

export const MenuDetailSheet: React.FC<MenuDetailSheetProps> = ({
  visible,
  onClose,
  meal,
  haccp,
}) => (
  <BottomSheet
    visible={visible}
    onClose={onClose}
    title="Rincian Menu Hari Ini"
    subtitle={meal.menuName}
  >
    <DetailRow label="Lauk" value={meal.sideDish} />
    <DetailRow label="Buah & minuman" value={meal.fruitAndDrink} />
    <DetailRow
      label="Alokasi"
      value={`${meal.totalPortions} porsi dalam ${meal.masterTotes} master tote`}
    />
    <DetailRow
      label="Pengantar"
      value={`${meal.fleetPlate}, ${meal.driverName}, tiba ${meal.etaDelivery}`}
    />
    <DetailRow
      label="Batas aman konsumsi"
      value={`${haccp.minutes} menit, ${haccp.label.toLowerCase()}`}
    />

    {/* Kotak satu-satunya di sheet ini yang berwarna: alergen adalah peringatan
        nyata untuk wali kelas, bukan hiasan (R-01, R-31). */}
    <View style={styles.allergenBox}>
      <Text style={styles.allergenTitle}>Alergen menu</Text>
      <Text style={styles.allergenText}>
        Mengandung {meal.allergens.join(', ')}. Sampaikan ke wali kelas sebelum boks
        dibagikan ke ruang kelas.
      </Text>
    </View>

    <Text style={styles.footnote}>Angka pada prototipe ini adalah data contoh.</Text>
  </BottomSheet>
);

interface ActionDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  action: QuickActionItem | null;
}

export const ActionDetailSheet: React.FC<ActionDetailSheetProps> = ({
  visible,
  onClose,
  action,
}) => (
  <BottomSheet
    visible={visible}
    onClose={onClose}
    title={action?.title ?? ''}
    subtitle={action?.subtitle}
  >
    <View style={styles.statusBox}>
      <Text style={styles.statusLabel}>Status modul</Text>
      <Text style={styles.statusValue}>
        Belum terhubung ke server SPPG. Langkah di bawah adalah alur kerja yang harus
        diikuti guru, bukan hasil validasi.
      </Text>
    </View>

    {action?.flow.map((step, index) => (
      <View key={step} style={styles.stepRow}>
        <View style={styles.stepIndex}>
          <Text style={styles.stepIndexText}>{index + 1}</Text>
        </View>
        <Text style={styles.stepText}>{step}</Text>
      </View>
    ))}
  </BottomSheet>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F3',
  },
  rowLabel: {
    fontSize: 13,
    color: '#64748B',
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
    lineHeight: 19,
  },
  allergenBox: {
    backgroundColor: '#FEF3E2',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  allergenTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C4A03',
  },
  allergenText: {
    fontSize: 13,
    color: '#7C4A03',
    lineHeight: 19,
    marginTop: 4,
  },
  footnote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 14,
  },
  statusBox: {
    backgroundColor: '#F9F8F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    padding: 14,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  statusValue: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDEBC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C4A03',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
});
