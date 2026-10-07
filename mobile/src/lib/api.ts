// API client: Bearer access token (in-memory) + httpOnly refresh cookie.
// Base URL diturunkan dari host dev-server Expo (emulator/perangkat/web) sehingga
// satu build bisa mencapai backend tanpa konfigurasi tambahan.

import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiBase(): string {
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location?.hostname : '';
    return `http://${host || 'localhost'}:8080`;
  }
  // hostUri: "10.0.2.2:8081" (emulator), "192.168.x.x:8081" (perangkat), dsb.
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const host = hostUri.split(':')[0];
  if (!host) return 'http://localhost:8080';
  return `http://${host}:8080`;
}

export const API_BASE = resolveApiBase();

export interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  npsn?: string;
  schoolName?: string;
  sppgId?: string;
  status?: string;
  createdAt?: string;
}

export interface AuthPayload {
  accessToken?: string;
  expiresIn?: number;
  user: BackendUser;
  permissions?: string[];
}

let accessToken: string | null = null;
let refreshPromise: Promise<AuthPayload | null> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

async function tryRefresh(): Promise<AuthPayload | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return null;
        const body = await res.json().catch(() => null);
        if (!body?.success) return null;
        accessToken = body.data.accessToken;
        return body.data as AuthPayload;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function api(path: string, options: RequestInit = {}): Promise<any> {
  // FormData: jangan set Content-Type manual, biar runtime menentukan boundary.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });

  let res = await doFetch();
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await doFetch();
    }
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(body?.error || body?.message || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return body;
}

export async function loginRequest(email: string, password: string): Promise<AuthPayload> {
  const body = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  accessToken = body.data.accessToken;
  return body.data;
}

export interface RegisterRequestParams {
  fullName: string;
  email: string;
  password: string;
  role?: string;
  npsn: string;
  schoolName: string;
  sppgId: string;
}

/** Daftar akun baru (khusus validator; email wajib unik). */
export async function registerRequest(params: RegisterRequestParams): Promise<any> {
  return api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ role: 'validator', ...params }),
  });
}

export async function meRequest(): Promise<AuthPayload> {
  const body = await api('/api/auth/me');
  return body.data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } finally {
    accessToken = null;
  }
}

export interface ScanRequestParams {
  /** URI foto dari kamera (React Native). */
  uri?: string;
  /** Objek File/Blob dari web (dicatat lewat <input type=file>). */
  file?: Blob;
  name?: string;
  type?: string;
  qrToken?: string;
  boxId?: string;
  batchId?: string;
  holdingTempC?: number;
  releaseTempC?: number;
  /** Daftar bahan menu "Nama:gram,Nama2:gram" → makro dihitung dari dataset gizi. */
  items?: string;
}

/**
 * Kirim pemindaian boks (multipart) ke POST /api/scans.
 * Gateway Go meneruskan foto ke AI service Python lalu membalas kartu keputusan mutu.
 */
export async function scanRequest(params: ScanRequestParams): Promise<any> {
  const form = new FormData();
  const name = params.name ?? 'scan.jpg';
  const type = params.type ?? 'image/jpeg';

  if (params.file) {
    form.append('image', params.file, name);
  } else if (params.uri) {
    // React Native memahami { uri, name, type } pada FormData.
    form.append('image', { uri: params.uri, name, type } as any);
  }

  if (params.qrToken) form.append('qrToken', params.qrToken);
  if (params.boxId) form.append('boxId', params.boxId);
  if (params.batchId) form.append('batchId', params.batchId);
  if (params.holdingTempC !== undefined) form.append('holdingTempC', String(params.holdingTempC));
  if (params.releaseTempC !== undefined) form.append('releaseTempC', String(params.releaseTempC));
  if (params.items) form.append('items', params.items);

  return api('/api/scans', { method: 'POST', body: form });
}

/** Sesi diam-diam saat aplikasi dibuka: pakai token yang masih hidup, lalu refresh cookie. */
export async function bootstrapSession(): Promise<AuthPayload | null> {
  try {
    if (accessToken) {
      return await meRequest();
    }
    const refreshed = await tryRefresh();
    if (refreshed) {
      return await meRequest();
    }
  } catch {
    accessToken = null;
  }
  return null;
}
