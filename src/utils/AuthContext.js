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
    // Check for existing session in AsyncStorage or similar
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // For now, we'll use a simple approach
      // In a real app, you'd store the session in AsyncStorage
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      setLoading(false);
    }
  };

  const DEMO_USERS = {
    'admin@school.com': { password: 'admin123', role: 'admin' },
    'teacher@school.com': { password: 'teacher123', role: 'teacher' },
    'parent@school.com': { password: 'parent123', role: 'parent' },
    'student@school.com': { password: 'student123', role: 'student' },
  };

  const signIn = async (email, password, selectedRole) => {
    try {
      setLoading(true);
      // Only allow login with hardcoded demo credentials
      if (
        DEMO_USERS[email] &&
        DEMO_USERS[email].password === password &&
        DEMO_USERS[email].role === selectedRole
      ) {
        // Return a mock user object
        const user = {
          id: email, // use email as id for demo
          email,
          role: selectedRole,
          linked_id: null
        };
        setUser(user);
        setUserType(selectedRole);
        return { data: user, error: null };
      } else {
        return { data: null, error: { message: 'Invalid credentials' } };
      }
    } catch (error) {
      return { data: null, error };
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
        linked_id: userData.linked_id || null
      };
      const { data, error } = await dbHelpers.createUser(newUserData);
      if (error) {
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
      setUserType(null);
      return { error: null };
    } catch (error) {
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