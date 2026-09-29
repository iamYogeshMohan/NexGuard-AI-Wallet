/**
 * NexGuard Secure Wallet — Frontend API & WebSocket Client
 * Automatically resolves server hostname for local LAN multi-device access.
 */

export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8000`;
  }
  return 'http://localhost:8000';
}

export function getWsBase(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${host}:8000`;
  }
  return 'ws://localhost:8000';
}

export function getWsUrl(path: string = '/ws/soc'): string {
  const base = getWsBase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export const API_BASE = getApiBase();

/** Dynamically resolves WebSocket URL so phone browsers never connect to phone's localhost */
export const WS_URL = typeof window !== 'undefined' 
  ? `${getWsBase()}/ws/soc` 
  : 'ws://localhost:8000/ws/soc';
export const WS_SOC_URL = typeof window !== 'undefined' 
  ? `${getWsBase()}/ws/soc` 
  : 'ws://localhost:8000/ws/soc';

export function getMobileWsUrl(deviceId: string): string {
  return `${getWsBase()}/ws/mobile/${deviceId}`;
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('nexguard_token');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nexguard_token', token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nexguard_token');
  }
}

export async function api(path: string, options: RequestInit = {}) {
  const base = getApiBase();
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!normalizedPath.startsWith('/api') && normalizedPath !== '/health') {
    normalizedPath = `/api${normalizedPath}`;
  }
  const url = `${base}${normalizedPath}`;

  const token = getAuthToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      let errorDetail = 'API Request Failed';
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || JSON.stringify(errJson);
      } catch {
        errorDetail = await res.text();
      }
      throw new Error(errorDetail);
    }
    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new Error('Connection timed out');
    }
    throw err;
  }
}
