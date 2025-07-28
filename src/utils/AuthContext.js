import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, authHelpers, dbHelpers } from './supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin', 'teacher', 'student', 'parent'

  useEffect(() => {
    // Check for existing session
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await handleAuthChange(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserType(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await handleAuthChange(currentUser);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthChange = async (authUser) => {
    try {
      // Get user profile from users table
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      const userData = {
        id: authUser.id,
        email: authUser.email,
        role: userProfile.role,
        linked_id: userProfile.linked_id,
        ...userProfile
      };

      setUser(userData);
      setUserType(userProfile.role);
    } catch (error) {
      console.error('Error handling auth change:', error);
    }
  };

  const signIn = async (email, password, selectedRole) => {
    try {
      setLoading(true);
      
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await authHelpers.signIn(email, password);
      
      if (authError) {
        return { data: null, error: authError };
      }

      if (!authData || !authData.user) {
        return { data: null, error: { message: 'Authentication failed' } };
      }

      // Get user profile to verify role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) {
        return { data: null, error: { message: 'User profile not found' } };
      }

      // Verify role matches selected role
      if (userProfile.role !== selectedRole) {
        return { data: null, error: { message: 'Invalid role for this user' } };
      }

      const userData = {
        id: authData.user.id,
        email: authData.user.email,
        role: userProfile.role,
        linked_id: userProfile.linked_id,
        ...userProfile
      };

      setUser(userData);
      setUserType(userProfile.role);
      
      return { data: userData, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: { message: 'Sign in failed' } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      
      // Use Supabase Auth for signup
      const { data: authData, error: authError } = await authHelpers.signUp(email, password, userData);
      
      if (authError || !authData || !authData.user) {
        return { data: null, error: { message: authError?.message || 'Signup failed' } };
      }

      // Add user profile to users table
      const newUserData = {
        email,
        role: userData.role,
        linked_id: userData.linked_id || null,
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        created_at: new Date().toISOString()
      };

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert(newUserData)
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.signOut();
        return { data: null, error: profileError };
      }

      const completeUserData = {
        id: authData.user.id,
        email: authData.user.email,
        role: userData.role,
        linked_id: userData.linked_id,
        ...profileData
      };

      setUser(completeUserData);
      setUserType(userData.role);
      
      return { data: completeUserData, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: { message: 'Signup failed' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await authHelpers.signOut();
      if (error) {
        return { error };
      }
      setUser(null);
      setUserType(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userType,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 