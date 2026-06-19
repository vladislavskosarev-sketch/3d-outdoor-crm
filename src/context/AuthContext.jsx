import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
   const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(!!supabase);

  const fetchProfile = async (userId) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setProfileError(error.message || JSON.stringify(error));
        return null;
      }
      setProfileError(null);
      return data;
    } catch (err) {
      console.error('Failed to get user profile details:', err);
      setProfileError(err.message || String(err));
      return null;
    }
  };

  // Helper to re-evaluate connection state
  const checkConnection = () => {
    const connected = !!supabase;
    setIsConnected(connected);
    return connected;
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    // Get current session with error safety
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id)
            .then((prof) => {
              if (active) {
                setProfile(prof);
                setLoading(false);
              }
            })
            .catch((err) => {
              console.error('Profile fetch error during init:', err);
              if (active) setLoading(false);
            });
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Session fetch error during init:', err);
        if (active) {
          setLoading(false);
        }
      });

    // Listen for auth changes with try-catch
    let subscription;
    try {
      const res = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!active) return;
          try {
            if (session) {
              setUser(session.user);
              const prof = await fetchProfile(session.user.id);
              setProfile(prof);
            } else {
              setUser(null);
              setProfile(null);
            }
          } catch (err) {
            console.error('Auth state change handler error:', err);
          } finally {
            if (active) setLoading(false);
          }
        }
      );
      subscription = res.data?.subscription;
    } catch (err) {
      console.error('Failed to subscribe to auth state changes:', err);
      setLoading(false);
    }

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isConnected]);

  const login = async (email, password) => {
    if (!supabase) throw new Error('Database connection is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, fullName) => {
    if (!supabase) throw new Error('Database connection is not configured.');
    
    // We sign up the user. This triggers public.handle_new_user() in DB
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  };

  const value = {
    user,
    profile,
    profileError,
    loading,
    isConnected,
    checkConnection,
    login,
    signup,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
