import React, {createContext, useState, useEffect, useContext, useCallback, useRef} from 'react';
import {Alert} from 'react-native';
import AuthService from '../services/authService';
import firestore from '@react-native-firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use ref to track previous status to avoid infinite loop
  const previousStatusRef = useRef(null);
  // Track if an alert is currently showing to prevent alert stacking
  const isAlertShowingRef = useRef(false);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();

      if (userDoc.exists) {
        const profile = userDoc.data();
        setUserProfile(profile);
        return profile;
      } else {
        console.error('User profile not found in Firestore');
        setError('User profile not found');
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message);
      return null;
    }
  };

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await fetchUserProfile(authUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen to real-time profile updates from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          // Document doesn't exist (user was deleted from Firestore)
          if (!doc.exists) {
            console.log('User profile deleted. Logging out...');

            // Prevent alert stacking
            if (isAlertShowingRef.current) return;
            isAlertShowingRef.current = true;

            Alert.alert(
              'Account Deleted',
              'Your account has been deleted. Please contact administrator for assistance.',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    isAlertShowingRef.current = false;
                    await AuthService.signOut();
                    setUser(null);
                    setUserProfile(null);
                    previousStatusRef.current = null;
                  },
                },
              ],
              { onDismiss: () => { isAlertShowingRef.current = false; } }
            );
            return;
          }

          const profile = doc.data();

          // Additional safety check
          if (!profile) {
            console.log('Profile data is null. Logging out...');

            // Prevent alert stacking
            if (isAlertShowingRef.current) return;
            isAlertShowingRef.current = true;

            Alert.alert(
              'Account Error',
              'Unable to load account data. Please contact administrator.',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    isAlertShowingRef.current = false;
                    await AuthService.signOut();
                    setUser(null);
                    setUserProfile(null);
                    previousStatusRef.current = null;
                  },
                },
              ],
              { onDismiss: () => { isAlertShowingRef.current = false; } }
            );
            return;
          }

          // Check if status CHANGED from active to inactive
          // Only show alert if status actually changed (not on initial load)
          if (
            previousStatusRef.current === 'active' &&
            profile.status !== 'active' &&
            profile.role !== 'SuperAdmin'
          ) {
            console.log('User status changed to inactive. Logging out...');

            // Prevent alert stacking
            if (isAlertShowingRef.current) return;
            isAlertShowingRef.current = true;

            Alert.alert(
              'Account Deactivated',
              'Your account has been deactivated by the administrator. Please contact support for assistance.',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    isAlertShowingRef.current = false;
                    await AuthService.signOut();
                    setUser(null);
                    setUserProfile(null);
                    previousStatusRef.current = null;
                  },
                },
              ],
              { onDismiss: () => { isAlertShowingRef.current = false; } }
            );
            return;
          }

          // Update previous status for next comparison (using ref to avoid re-render)
          previousStatusRef.current = profile.status;
          setUserProfile(profile);
        },
        (err) => {
          console.error('Error listening to user profile changes:', err);
        }
      );

    return unsubscribe;
  }, [user?.uid]); // FIXED: Removed previousStatus from dependencies

  // Refresh user profile manually
  const refreshUserProfile = useCallback(async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid);
    }
  }, [user?.uid]);

  // Check if user is SuperAdmin (memoized to prevent re-renders)
  const isSuperAdmin = useCallback(() => {
    return userProfile?.role === 'SuperAdmin';
  }, [userProfile?.role]);

  // Check if user is Trainer (memoized to prevent re-renders)
  const isTrainer = useCallback(() => {
    return userProfile?.role === 'Trainer';
  }, [userProfile?.role]);

  // Sign out (memoized)
  const signOut = useCallback(async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      setUserProfile(null);
      setError(null);
      previousStatusRef.current = null;
      return {success: true};
    } catch (err) {
      console.error('Sign out error:', err);
      return {success: false, error: err.message};
    }
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    isSuperAdmin,
    isTrainer,
    refreshUserProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
