import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Link, Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Validator', email: 'validator@sdn01menteng.sch.id', password: 'Validator123!' },
];

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Redirect href="/" />;
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal, coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

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
          <Text style={styles.title}>Masuk ke KawanGizi</Text>
          <Text style={styles.subtitle}>
            Akun validator sekolah (Guru & Staf)
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              placeholder="nama@sekolah.sch.id"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!submitting}
            />

            <Text style={styles.inputLabel}>Kata Sandi</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              editable={!submitting}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Masuk">
              {submitting ? (
                <ActivityIndicator color="#1E293B" />
              ) : (
                <Text style={styles.submitText}>Masuk</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Akun demo</Text>
            {DEMO_ACCOUNTS.map((account) => (
              <TouchableOpacity
                key={account.email}
                style={styles.demoRow}
                onPress={() => fillDemo(account)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Isi akun demo ${account.label}`}>
                <Text style={styles.demoLabel}>{account.label}</Text>
                <Text style={styles.demoEmail}>{account.email}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Belum punya akun?</Text>
            <Link href="/register" style={styles.footerLink}>
              Daftar
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
  errorText: {
    fontSize: 12,
    color: '#DC2626',
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
  demoCard: {
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  demoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C4A03',
  },
  demoEmail: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
    textAlign: 'right',
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
