import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { findRegisterSppg, REGISTER_SPPG_OPTIONS } from '../data/registerData';
import { registerRequest } from '../lib/api';

interface PickerOption {
  id: string;
  label: string;
}

function PickerField({
  label,
  placeholder,
  disabledPlaceholder,
  options,
  selectedId,
  disabled,
  onSelect,
}: {
  label: string;
  placeholder: string;
  disabledPlaceholder?: string;
  options: PickerOption[];
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === selectedId);

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, disabled && styles.inputDisabled]}
        disabled={disabled}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}>
        {selected ? (
          <Text style={styles.pickerValueText} numberOfLines={1}>
            {selected.label}
          </Text>
        ) : (
          <Text style={styles.pickerPlaceholderText} numberOfLines={1}>
            {disabled ? disabledPlaceholder : placeholder}
          </Text>
        )}
        <Text style={styles.pickerChevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && !disabled && (
        <View style={styles.pickerOptionsBox}>
          {options.map((o) => (
            <TouchableOpacity
              key={o.id}
              style={[styles.pickerOption, o.id === selectedId && styles.pickerOptionActive]}
              onPress={() => {
                onSelect(o.id);
                setOpen(false);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Pilih ${o.label}`}>
              <Text
                style={[styles.pickerOptionText, o.id === selectedId && styles.pickerOptionTextActive]}
                numberOfLines={1}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sppgId, setSppgId] = useState('');
  const [kecamatanId, setKecamatanId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sppg = useMemo(() => findRegisterSppg(sppgId), [sppgId]);
  const kecamatan = useMemo(
    () => sppg?.kecamatanOptions.find((k) => k.id === kecamatanId) ?? null,
    [sppg, kecamatanId]
  );
  const school = useMemo(
    () => kecamatan?.schools.find((s) => s.id === schoolId) ?? null,
    [kecamatan, schoolId]
  );

  const onSelectSppg = (id: string) => {
    setSppgId(id);
    setKecamatanId('');
    setSchoolId('');
    setError(null);
  };
  const onSelectKecamatan = (id: string) => {
    setKecamatanId(id);
    setSchoolId('');
    setError(null);
  };
  const onSelectSchool = (id: string) => {
    setSchoolId(id);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Isi nama dan email terlebih dahulu.');
      return;
    }
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.');
      return;
    }
    if (!sppg || !kecamatan || !school) {
      setError('Pilih dapur SPPG, kecamatan, dan sekolah terlebih dahulu.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitted(true);
    try {
      await registerRequest({
        fullName: name.trim(),
        email: email.trim(),
        password,
        npsn: school.npsn,
        schoolName: school.name,
        sppgId: sppg.id,
      });
      setSuccess('Akun berhasil dibuat! Anda sudah bisa masuk.');
      setTimeout(() => router.replace('/login'), 1200);
    } catch (err) {
      setSubmitted(false);
      setError(err instanceof Error ? err.message : 'Gagal membuat akun, coba lagi.');
    }
  };

  const kecamatanOptions: PickerOption[] = (sppg?.kecamatanOptions ?? []).map((k) => ({
    id: k.id,
    label: k.name,
  }));
  const schoolOptions: PickerOption[] = (kecamatan?.schools ?? []).map((s) => ({
    id: s.id,
    label: `${s.name} (${s.level} · NPSN ${s.npsn})`,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>KG</Text>
          </View>
          <Text style={styles.title}>Buat Akun</Text>
          <Text style={styles.subtitle}>Daftar sesuai dapur SPPG dan sekolah tujuan Anda</Text>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Nama lengkap</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(null);
              }}
              placeholder="Nama lengkap dan gelar"
              placeholderTextColor="#94A3B8"
              editable={!submitted}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              placeholder="nama@instansi.go.id"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!submitted}
            />

            <Text style={styles.inputLabel}>Kata sandi</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              placeholder="Minimal 8 karakter"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              editable={!submitted}
            />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Penempatan Anda</Text>

            <PickerField
              label="Dapur SPPG"
              placeholder="Pilih dapur SPPG…"
              options={REGISTER_SPPG_OPTIONS.map((s) => ({ id: s.id, label: `${s.name} — ${s.city}` }))}
              selectedId={sppgId}
              disabled={false}
              onSelect={onSelectSppg}
            />

            <PickerField
              label="Kecamatan"
              placeholder="Pilih kecamatan…"
              disabledPlaceholder="Pilih dapur SPPG dahulu"
              options={kecamatanOptions}
              selectedId={kecamatanId}
              disabled={!sppg}
              onSelect={onSelectKecamatan}
            />

            <PickerField
              label="Sekolah"
              placeholder="Pilih sekolah…"
              disabledPlaceholder={sppg ? 'Pilih kecamatan dahulu' : 'Pilih dapur SPPG dahulu'}
              options={schoolOptions}
              selectedId={schoolId}
              disabled={!kecamatan}
              onSelect={onSelectSchool}
            />

            {sppg && kecamatan && school && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText} numberOfLines={2}>
                  Anda terdaftar di <Text style={styles.summaryStrong}>{sppg.name}</Text> ·{' '}
                  {kecamatan.name} — {school.name}
                </Text>
              </View>
            )}

            {success && <Text style={styles.successText}>{success}</Text>}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitButton, submitted && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitted}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Buat Akun">
              <Text style={styles.submitText}>{submitted ? 'Membuka halaman masuk…' : 'Buat Akun'}</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Akun Anda menunggu verifikasi data penempatan oleh pengelola.
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Sudah punya akun?</Text>
            <Link href="/login" style={styles.footerLink}>
              Masuk
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EBA338',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
  },
  pickerValueText: {
    fontSize: 15,
    color: '#1E293B',
    flex: 1,
  },
  pickerPlaceholderText: {
    fontSize: 15,
    color: '#94A3B8',
    flex: 1,
  },
  pickerChevron: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 8,
  },
  pickerOptionsBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  pickerOptionActive: {
    backgroundColor: '#FFF7E6',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerOptionTextActive: {
    color: '#7C4A03',
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryBox: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryText: {
    fontSize: 12,
    color: '#57534E',
    lineHeight: 17,
  },
  summaryStrong: {
    fontWeight: '700',
    color: '#1E293B',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 12,
  },
  successText: {
    fontSize: 12,
    color: '#047857',
    marginTop: 12,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#EBA338',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  disclaimer: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C4A03',
    textDecorationLine: 'underline',
  },
});