import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthState {
  token: string | null;
  username: string | null;
  login: (username: string, password: string, totp?: string) => Promise<{ success: boolean; requiresTotp?: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'admin_token';
const USERNAME_KEY = 'lazydrop_admin_username';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem(USERNAME_KEY);
  });

  async function login(user: string, pass: string, totp?: string): Promise<{ success: boolean; requiresTotp?: boolean }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass, totp }),
      });
      const data = await res.json();
      if (data.requiresTotp) {
        return { success: false, requiresTotp: true };
      }
      if (data.success) {
        const sessionToken = data.token || pass;
        localStorage.setItem(STORAGE_KEY, sessionToken);
        localStorage.setItem(USERNAME_KEY, user);
        setToken(sessionToken);
        setUsername(user);
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setToken(null);
    setUsername(null);
  }

  return (
    <AuthContext.Provider value={{ token, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
