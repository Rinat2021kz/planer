import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';

// Auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }
  return context;
};

// Auth provider props
type AuthContextProviderProps = {
  children: ReactNode;
};

// Auth provider component
export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send email verification (Firebase will use default page)
    await sendEmailVerification(userCredential.user);
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      // Allow user to stay logged in but they'll see verification screen
      console.log('Email not verified yet');
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      // Send email verification (Firebase will use default page)
      await sendEmailVerification(user);
    } else {
      throw new Error('User not found or already verified');
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    // Use Firebase default reset page
    await sendPasswordResetEmail(auth, email);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('firebaseToken');
  };

  // Get ID token
  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      localStorage.setItem('firebaseToken', token);
      return token;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Check if token exists in localStorage
      const storedToken = localStorage.getItem('firebaseToken');
      
      // If user is logged in but token is missing, force logout
      if (currentUser && !storedToken) {
        console.log('Token missing from localStorage, logging out...');
        try {
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error during forced logout:', error);
        }
      }
      
      setUser(currentUser);
      
      // Get and store token when user logs in
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem('firebaseToken', token);
        } catch (error) {
          console.error('Error getting token on auth state change:', error);
        }
      } else {
        localStorage.removeItem('firebaseToken');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh token periodically (every 50 minutes, tokens expire after 1 hour)
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      // Check if token still exists in localStorage
      const storedToken = localStorage.getItem('firebaseToken');
      
      if (!storedToken) {
        console.log('Token removed from localStorage, logging out...');
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Error during logout:', error);
        }
        return;
      }
      
      try {
        const token = await user.getIdToken(true); // force refresh
        localStorage.setItem('firebaseToken', token);
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(intervalId);
  }, [user]);

  // Check token on window focus (e.g., when switching tabs)
  useEffect(() => {
    if (!user) return;

    const handleFocus = async () => {
      const storedToken = localStorage.getItem('firebaseToken');
      
      if (!storedToken) {
        console.log('Token removed from localStorage (on focus), logging out...');
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Error during logout on focus:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    signup,
    login,
    logout,
    getIdToken,
    resendVerificationEmail,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

