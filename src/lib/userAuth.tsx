import { createContext, useContext, useState, ReactNode } from 'react';
import { loginWithBiometrics, getBiometricsSupport, BiometricsSupport } from './biometrics';
import { readJson } from './api';

interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface UserAuthState {
  token: string | null;
  user: UserInfo | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPasskey: (username: string) => Promise<{ success: boolean; error?: string }>;
  biometricsSupport: BiometricsSupport | null;
  logout: () => void;
}

const UserAuthContext = createContext<UserAuthState | null>(null);

const TOKEN_KEY = 'lazydrop_user_token';
const USER_KEY = 'lazydrop_user_info';

function persistSession(token: string, user: UserInfo) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserInfo | null>(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });
  const [biometricsSupport, setBiometricsSupport] = useState<BiometricsSupport | null>(null);

  useState(() => {
    getBiometricsSupport().then(setBiometricsSupport).catch(() => setBiometricsSupport({ supported: false, platformAvailable: false }));
  });

  async function login(username: string, password: string) {
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await readJson(res);
      if (data.success) {
        persistSession(data.token, data.user);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async function register(username: string, email: string, password: string) {
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await readJson(res);
      if (data.success) {
        persistSession(data.token, data.user);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async function loginWithPasskey(username: string) {
    try {
      const result = await loginWithBiometrics(username);
      if (result.success && result.token && result.user) {
        persistSession(result.token, result.user);
        setToken(result.token);
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error || 'Passkey login failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <UserAuthContext.Provider value={{ token, user, login, register, loginWithPasskey, biometricsSupport, logout }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth(): UserAuthState {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
}
