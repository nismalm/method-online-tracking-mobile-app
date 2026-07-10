import React, {createContext, useState, useEffect, useContext, useCallback, useRef} from 'react';
import {Alert, AppState} from 'react-native';
import * as AuthService from '../services/authService';
import * as TokenStorage from '../services/tokenStorage';
import {apiClient, setOnUnauthenticatedHandler} from '../services/apiClient';
import {PROFILE_POLL_INTERVAL_MS} from '../config/env';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {throw new Error('useAuth must be used within AuthProvider');}
  return ctx;
};

const normalizeProfile = (raw) => ({
  ...raw,
  uid: raw.id,
  mobile: raw.phone,
  role: raw.role === 'SUPER_ADMIN' ? 'SuperAdmin' : 'Trainer',
  status: (raw.status || '').toLowerCase(),
  trainerProfileId: raw.trainerProfileId ?? null,
});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const previousStatusRef = useRef(null);
  const isAlertShowingRef = useRef(false);
  const pollRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const showAccountDeactivated = useCallback(() => {
    if (isAlertShowingRef.current) {return;}
    isAlertShowingRef.current = true;
    Alert.alert(
      'Account Deactivated',
      'Your account has been deactivated by the administrator. Please contact support for assistance.',
      [{text: 'OK', onPress: async () => {
        isAlertShowingRef.current = false;
        await AuthService.signOut();
        setUser(null);
        setUserProfile(null);
        previousStatusRef.current = null;
      }}],
      {onDismiss: () => {isAlertShowingRef.current = false;}},
    );
  }, []);

  const showAccountDeleted = useCallback(() => {
    if (isAlertShowingRef.current) {return;}
    isAlertShowingRef.current = true;
    Alert.alert(
      'Account Deleted',
      'Your account has been deleted. Please contact administrator for assistance.',
      [{text: 'OK', onPress: async () => {
        isAlertShowingRef.current = false;
        await AuthService.signOut();
        setUser(null);
        setUserProfile(null);
        previousStatusRef.current = null;
      }}],
      {onDismiss: () => {isAlertShowingRef.current = false;}},
    );
  }, []);

  const hydrate = useCallback(async () => {
    try {
      const {data} = await apiClient.get('/users/me');
      const profile = normalizeProfile(data);

      if (
        previousStatusRef.current === 'active' &&
        profile.status !== 'active' &&
        profile.role !== 'SuperAdmin'
      ) {
        showAccountDeactivated();
        return;
      }
      previousStatusRef.current = profile.status;
      setUser(profile);
      setUserProfile(profile);

      // Upload FCM token best-effort after hydration
      uploadFcmToken();
    } catch (err) {
      if (err?.response?.status === 404) {
        showAccountDeleted();
      }
      // 401 or any network/server error: interceptor already cleared tokens and user state.
      // Stay silent - App.js will render LoginScreen since user is null.
    }
  }, [showAccountDeactivated, showAccountDeleted]);

  const uploadFcmToken = async () => {
    try {
      const messaging = require('@react-native-firebase/messaging').default;
      const token = await messaging().getToken();
      if (token) {
        await apiClient.patch('/auth/fcm-token', {fcmToken: token}).catch(() => {});
      }
    } catch {
      // FCM not available or permission denied, ignore
    }
  };

  useEffect(() => {
    setOnUnauthenticatedHandler(() => {
      setUser(null);
      setUserProfile(null);
      previousStatusRef.current = null;
    });

    (async () => {
      try {
        const tokens = await TokenStorage.loadTokens();
        if (tokens?.accessToken) {
          await hydrate();
        }
      } catch {
        // Keychain unavailable or token corrupt - proceed to login screen
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrate]);

  useEffect(() => {
    if (!user?.uid) {return undefined;}

    const start = () => {
      if (pollRef.current) {return;}
      pollRef.current = setInterval(() => {hydrate();}, PROFILE_POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (pollRef.current) {clearInterval(pollRef.current); pollRef.current = null;}
    };

    start();
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        hydrate();
        start();
      } else if (next.match(/inactive|background/)) {
        stop();
      }
      appStateRef.current = next;
    });

    return () => {stop(); sub.remove();};
  }, [user?.uid, hydrate]);

  // Also refresh FCM token on token refresh
  useEffect(() => {
    let unsubscribe;
    try {
      const messaging = require('@react-native-firebase/messaging').default;
      unsubscribe = messaging().onTokenRefresh((token) => {
        if (token && user?.uid) {
          apiClient.patch('/auth/fcm-token', {fcmToken: token}).catch(() => {});
        }
      });
    } catch {
      // messaging not available
    }
    return () => {
      if (unsubscribe) {unsubscribe();}
    };
  }, [user?.uid]);

  const signOut = useCallback(async () => {
    await AuthService.signOut();
    setUser(null);
    setUserProfile(null);
    setError(null);
    previousStatusRef.current = null;
    return {success: true};
  }, []);

  const isSuperAdmin = useCallback(() => userProfile?.role === 'SuperAdmin', [userProfile?.role]);
  const isTrainer = useCallback(() => userProfile?.role === 'Trainer', [userProfile?.role]);

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      isSuperAdmin,
      isTrainer,
      signOut,
      refreshUserProfile: hydrate,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
