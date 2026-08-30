import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, AuthResponse, SignupPayload, LoginPayload } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authView: 'none' | 'login' | 'signup' | 'verify-email' | 'forgot-password' | 'reset-password' | 'account';
  setAuthView: (view: 'none' | 'login' | 'signup' | 'verify-email' | 'forgot-password' | 'reset-password' | 'account') => void;
  pendingEmailForVerification: string | null;
  setPendingEmailForVerification: (email: string | null) => void;
  pendingResetToken: string | null;
  setPendingResetToken: (token: string | null) => void;
  signup: (payload: SignupPayload) => Promise<AuthResponse>;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  verifyEmail: (token: string, email?: string) => Promise<AuthResponse>;
  resendVerification: (email: string) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (payload: { token: string; email?: string; newPassword: string; confirmPassword: string }) => Promise<AuthResponse>;
  updateUserPreferences: (prefs: any) => Promise<void>;
  saveUserHistoryItem: (item: { type: 'document' | 'medicine'; title: string; summary: string; metadata?: any }) => Promise<void>;
  fetchUserData: () => Promise<{ user: UserProfile; history: any[] } | null>;
  userHistory: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem('sightline_session_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'none' | 'login' | 'signup' | 'verify-email' | 'forgot-password' | 'reset-password' | 'account'>('none');
  const [pendingEmailForVerification, setPendingEmailForVerification] = useState<string | null>(null);
  const [pendingResetToken, setPendingResetToken] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);

  // Check URL query parameters for email verification or password reset on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verifyToken') || params.get('token');
    const verifyEmailParam = params.get('email');
    const resetTokenParam = params.get('resetToken');

    if (window.location.pathname === '/verify-email' || (verifyToken && !resetTokenParam)) {
      if (verifyToken) {
        setAuthView('verify-email');
        if (verifyEmailParam) setPendingEmailForVerification(verifyEmailParam);
      }
    } else if (window.location.pathname === '/reset-password' || resetTokenParam) {
      if (resetTokenParam || verifyToken) {
        setPendingResetToken(resetTokenParam || verifyToken);
        if (verifyEmailParam) setPendingEmailForVerification(verifyEmailParam);
        setAuthView('reset-password');
      }
    } else if (window.location.pathname === '/login') {
      setAuthView('login');
    } else if (window.location.pathname === '/signup') {
      setAuthView('signup');
    } else if (window.location.pathname === '/account') {
      setAuthView('account');
    }
  }, []);

  // Validate session on load
  useEffect(() => {
    async function checkSession() {
      const storedToken = localStorage.getItem('sightline_session_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const data = await res.json();

        if (res.ok && data.authenticated && data.user) {
          setUser(data.user);
          setSessionToken(storedToken);
          fetchUserDataInternal(storedToken);
        } else {
          localStorage.removeItem('sightline_session_token');
          setUser(null);
          setSessionToken(null);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, []);

  const fetchUserDataInternal = async (token: string) => {
    try {
      const res = await fetch('/api/auth/user-data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.history) setUserHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load user history:', err);
    }
  };

  const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }
      setPendingEmailForVerification(payload.email);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          setPendingEmailForVerification(payload.email);
          return { success: false, error: data.error, requiresVerification: true, demoVerificationUrl: data.demoVerificationUrl };
        }
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.sessionToken && data.user) {
        localStorage.setItem('sightline_session_token', data.sessionToken);
        setSessionToken(data.sessionToken);
        setUser(data.user);
        fetchUserDataInternal(data.sessionToken);
        setAuthView('none');
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during sign in' };
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('sightline_session_token');
      setUser(null);
      setSessionToken(null);
      setUserHistory([]);
      setAuthView('none');
    }
  };

  const verifyEmail = async (token: string, email?: string): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      if (data.sessionToken && data.user) {
        localStorage.setItem('sightline_session_token', data.sessionToken);
        setSessionToken(data.sessionToken);
        setUser(data.user);
        fetchUserDataInternal(data.sessionToken);
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification error' };
    }
  };

  const resendVerification = async (email: string): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to resend email' };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Resend error' };
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Forgot password request error' };
    }
  };

  const resetPassword = async (payload: { token: string; email?: string; newPassword: string; confirmPassword: string }): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Reset failed' };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Reset password error' };
    }
  };

  const updateUserPreferences = async (prefs: any) => {
    if (!sessionToken) return;
    try {
      await fetch('/api/auth/update-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(prefs),
      });
      if (user) {
        setUser({ ...user, preferences: { ...user.preferences, ...prefs } });
      }
    } catch (err) {
      console.error('Failed to sync preferences:', err);
    }
  };

  const saveUserHistoryItem = async (item: { type: 'document' | 'medicine'; title: string; summary: string; metadata?: any }) => {
    if (!sessionToken) return;
    try {
      const res = await fetch('/api/auth/save-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setUserHistory(prev => [data.item, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to record history:', err);
    }
  };

  const fetchUserData = async () => {
    if (!sessionToken) return null;
    try {
      const res = await fetch('/api/auth/user-data', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('fetchUserData error:', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isAuthenticated: !!user,
        isLoading,
        authView,
        setAuthView,
        pendingEmailForVerification,
        setPendingEmailForVerification,
        pendingResetToken,
        setPendingResetToken,
        signup,
        login,
        logout,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        updateUserPreferences,
        saveUserHistoryItem,
        fetchUserData,
        userHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
