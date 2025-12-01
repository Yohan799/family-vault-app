import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { updateActivityTimestamp } from '@/lib/activityTracking';
import { createSession } from '@/services/sessionService';
import { logActivity } from '@/services/activityLogService';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  profile_image_url: string | null;
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
  backup_frequency: string;
  auto_lock_minutes: number | null;
  app_lock_type: string | null;
  app_pin_hash: string | null;
  additional_emails: string[] | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      // Cast additional_emails from Json to string[]
      setProfile({
        ...data,
        additional_emails: (data.additional_emails as string[]) || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile when user signs in
        if (session?.user) {
          // Create session on login
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              createSession(session.user.id).catch(err => 
                console.error('Failed to create session:', err)
              );
              logActivity(session.user.id, 'auth.login', 'user', session.user.id).catch(err =>
                console.error('Failed to log activity:', err)
              );
            }, 0);
          }

          // Use setTimeout to defer Supabase calls
          setTimeout(() => {
            fetchProfile(session.user.id);
            updateActivityTimestamp(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        updateActivityTimestamp(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      await logActivity(data.user.id, 'auth.signup', 'user', data.user.id);
    }
    
    // Mark as first login for feature tour
    localStorage.setItem('isFirstLogin', 'true');
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Note: 2FA check happens in SignIn component via navigation
    if (data.user) {
      try {
        await createSession(data.user.id);
        await logActivity(data.user.id, 'auth.login', 'user', data.user.id);

        // Update last_login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      } catch (err) {
        console.error('Error in post-signin operations:', err);
      }
    }
  };

  const signInWithGoogle = async () => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // Native Android/iOS flow using SocialLogin plugin
      try {
        const response = await SocialLogin.login({
          provider: 'google',
          options: {
            scopes: ['profile', 'email'],
          }
        });
        
        if (response.provider === 'google' && response.result) {
          // Extract token from response (structure varies by platform)
          const result = response.result as any;
          const token = result.idToken || result.authentication?.idToken || result.accessToken;
          
          if (!token) {
            throw new Error('No authentication token received from Google');
          }
          
          // Use the ID token to sign in with Supabase
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: token,
          });
          
          if (error) throw error;
          
          if (data.user) {
            await createSession(data.user.id);
            await logActivity(data.user.id, 'auth.login', 'user', data.user.id);
          }
          
          localStorage.setItem('isFirstLogin', 'true');
        }
      } catch (error) {
        console.error('Native Google Sign-In error:', error);
        throw error;
      }
    } else {
      // Web flow using OAuth redirect
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) throw error;
      
      localStorage.setItem('isFirstLogin', 'true');
    }
  };

  const signOut = async () => {
    if (user) {
      try {
        await logActivity(user.id, 'auth.logout', 'user', user.id);
      } catch (err) {
        console.error('Error logging signout:', err);
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    // Update local profile state
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    if (user) {
      await logActivity(user.id, 'auth.password_change', 'user', user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAuthenticated: !!user,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
