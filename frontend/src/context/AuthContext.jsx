import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err.message);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, fullName) => {
    const trimmedEmail = email.trim();
    const redirectUrl = `${window.location.origin}/auth`;

    try {
      // 1. Try standard Supabase Auth client signup
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim()
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName.trim(),
            role: 'student'
          });
        } catch (profileErr) {
          console.warn('Profile auto-upsert warning:', profileErr.message);
        }
      }

      return data;
    } catch (clientErr) {
      const errMsg = clientErr.message || '';
      // If error is about invalid email deliverability or SMTP rate limits, fall back to backend register API
      if (
        errMsg.toLowerCase().includes('invalid') ||
        errMsg.toLowerCase().includes('rate limit') ||
        errMsg.toLowerCase().includes('over_email_send_rate_limit')
      ) {
        console.info('Client signup blocked by SMTP validation/limits. Using backend registration API...');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password, fullName: fullName.trim() })
        });
        const backendData = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(backendData.error || backendData.message || clientErr.message);
        }

        // Successfully registered via backend Admin API, now sign in to get active session!
        const loginData = await signIn(trimmedEmail, password);
        return { user: loginData.user, session: loginData.session, directLogin: true };
      }

      throw clientErr;
    }
  };

  const resendVerificationEmail = async (email) => {
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    if (error) throw error;
  };

  const resetPasswordForEmail = async (email) => {
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setIsRecoveryMode(false);
  };

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';

  const value = {
    user,
    profile,
    loading,
    isRecoveryMode,
    setIsRecoveryMode,
    signIn,
    signUp,
    resendVerificationEmail,
    resetPasswordForEmail,
    updatePassword,
    signOut,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
