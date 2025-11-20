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
    
    // Configure action code settings for email verification
    const actionCodeSettings = {
      url: 'https://planer.gassimov2014.workers.dev/',
      handleCodeInApp: false,
    };
    
    // Send email verification with redirect URL
    await sendEmailVerification(userCredential.user, actionCodeSettings);
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
      // Configure action code settings for email verification
      const actionCodeSettings = {
        url: 'https://planer.gassimov2014.workers.dev/',
        handleCodeInApp: false,
      };
      
      await sendEmailVerification(user, actionCodeSettings);
    } else {
      throw new Error('User not found or already verified');
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const actionCodeSettings = {
      url: 'https://planer.gassimov2014.workers.dev/',
      handleCodeInApp: false,
    };
    
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
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

