import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'mentor' | 'participant';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'mentor' | 'participant') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, handle gracefully
          setUser(null);
          return;
        }
        throw error;
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (authUser) {
      await fetchUserProfile(authUser.id);
    }
  }

  async function signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'mentor' | 'participant'
  ) {
    const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;
    if (!authUser?.id) throw new Error('No user ID returned from sign up');

    // Create the user profile
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authUser.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
      },
    ]);

    if (profileError) throw profileError;
    await fetchUserProfile(authUser.id);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}