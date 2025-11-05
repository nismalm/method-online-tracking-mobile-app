import auth, {getAuth} from '@react-native-firebase/auth';
import firestore, {getFirestore} from '@react-native-firebase/firestore';
import {getApp, initializeApp} from '@react-native-firebase/app';

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Result with user data
 */
export const signIn = async (email, password) => {
  try {
    const result = await getAuth().signInWithEmailAndPassword(email, password);

    // Check user status in Firestore
    const userDoc = await getFirestore().collection('users').doc(result.user.uid).get();

    if (!userDoc.exists) {
      // User exists in Auth but not in Firestore - should not happen
      await getAuth().signOut();
      return {success: false, error: 'User profile not found. Please contact support.'};
    }

    const userData = userDoc.data();

    // Check if user status is active (SuperAdmin always allowed)
    if (userData.status !== 'active' && userData.role !== 'SuperAdmin') {
      // Sign out inactive user
      await getAuth().signOut();
      return {success: false, error: 'Your account has been deactivated. Please contact administrator.'};
    }

    return {success: true, user: result.user};
  } catch (error) {
    return {success: false, error: getErrorMessage(error.code)};
  }
};

/**
 * Sign up new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} username - Username
 * @param {string} role - User role
 * @returns {Promise<Object>} Result
 */
export const signUp = async (email, password, username, role) => {
  try {
    const result = await getAuth().createUserWithEmailAndPassword(email, password);
    await getFirestore().collection('users').doc(result.user.uid).set({
      uid: result.user.uid,
      email,
      username,
      role,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return {success: true};
  } catch (error) {
    return {success: false, error: getErrorMessage(error.code)};
  }
};

/**
 * Generate random password for trainers
 * @returns {string} Generated password
 */
export const generateTrainerPassword = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `Method${randomDigits}`;
};

/**
 * Create trainer account (SuperAdmin only)
 * Uses secondary Firebase app instance to avoid signing out SuperAdmin
 * @param {string} name - Trainer name
 * @param {string} email - Trainer email
 * @param {string} mobile - Trainer mobile
 * @param {string} createdByUid - UID of creating SuperAdmin
 * @returns {Promise<Object>} Result with trainer ID and password
 */
export const createTrainer = async (name, email, mobile, createdByUid) => {
  let secondaryApp = null;

  try {
    // Generate password
    const password = generateTrainerPassword();

    // Get or create a secondary Firebase app instance
    // This prevents interfering with the main auth session
    try {
      secondaryApp = getApp('secondary');
    } catch (e) {
      // Secondary app doesn't exist, create it
      const config = getApp().options;

      // Add databaseURL if not present (required for secondary app)
      const secondaryConfig = {
        ...config,
        databaseURL: config.databaseURL || `https://${config.projectId}.firebaseio.com`,
      };

      secondaryApp = await initializeApp(secondaryConfig, 'secondary');
    }

    // Create user using the secondary app instance
    const secondaryAuth = getAuth(secondaryApp);
    const result = await secondaryAuth.createUserWithEmailAndPassword(
      email.trim().toLowerCase(),
      password
    );

    const newTrainerId = result.user.uid;

    // Create Firestore document (using main instance)
    await getFirestore().collection('users').doc(newTrainerId).set({
      uid: newTrainerId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      username: name.trim(),
      mobile: mobile.trim(),
      role: 'Trainer',
      status: 'active',
      createdBy: createdByUid,
      createdAt: firestore.FieldValue.serverTimestamp(),
      mustChangePassword: true,
    });

    // Sign out from secondary app
    await secondaryAuth.signOut();

    // Send password reset email (using main auth)
    await getAuth().sendPasswordResetEmail(email.trim().toLowerCase());

    return {
      success: true,
      trainerId: newTrainerId,
      password: password,
      message: 'Trainer created successfully',
    };
  } catch (error) {
    console.error('Create trainer error:', error);

    // Clean up secondary app session if it exists
    if (secondaryApp) {
      try {
        await secondaryApp.getAuth().signOut();
      } catch (e) {
        console.error('Secondary auth signout error:', e);
      }
    }

    return {success: false, error: getErrorMessage(error.code)};
  }
};

/**
 * Get user profile from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Result with profile data
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getFirestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      return {success: true, profile: userDoc.data()};
    } else {
      return {success: false, error: 'User profile not found'};
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Result
 */
export const updateUserProfile = async (uid, data) => {
  try {
    await getFirestore().collection('users').doc(uid).update(data);
    return {success: true};
  } catch (error) {
    console.error('Update profile error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = getAuth().currentUser;
    if (!user || !user.email) {
      return {success: false, error: 'No user logged in'};
    }

    // Re-authenticate user before changing password
    const credential = auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await user.reauthenticateWithCredential(credential);

    // Update password
    await user.updatePassword(newPassword);

    // Update mustChangePassword flag if it exists
    await getFirestore().collection('users').doc(user.uid).update({
      mustChangePassword: false,
    });

    return {success: true};
  } catch (error) {
    console.error('Change password error:', error);
    return {success: false, error: getErrorMessage(error.code)};
  }
};

/**
 * Reset password via email
 * @param {string} email - User email
 * @returns {Promise<Object>} Result
 */
export const resetPassword = async (email) => {
  try {
    await getAuth().sendPasswordResetEmail(email);
    return {success: true};
  } catch (error) {
    return {success: false, error: getErrorMessage(error.code)};
  }
};

/**
 * Sign out current user
 * @returns {Promise<Object>} Result
 */
export const signOut = async () => {
  try {
    await getAuth().signOut();
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

/**
 * Register auth state change listener
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChanged = (callback) => {
  return getAuth().onAuthStateChanged(callback);
};

/**
 * Get current user
 * @returns {Object|null} Current user or null
 */
export const getCurrentUser = () => {
  return getAuth().currentUser;
};

/**
 * Get all trainers (SuperAdmin only)
 * @returns {Promise<Object>} Result with trainers array
 */
export const getAllTrainers = async () => {
  try {
    const snapshot = await getFirestore()
      .collection('users')
      .where('role', '==', 'Trainer')
      .get();

    // Sort manually in JavaScript to avoid index issues
    const trainers = snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        if (!a.createdAt) {
          return 1;
        }
        if (!b.createdAt) {
          return -1;
        }
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

    return {success: true, trainers};
  } catch (error) {
    console.error('Get trainers error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Update trainer status (SuperAdmin only)
 * @param {string} trainerId - Trainer ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Result
 */
export const updateTrainerStatus = async (trainerId, status) => {
  try {
    await getFirestore().collection('users').doc(trainerId).update({
      status,
    });
    return {success: true};
  } catch (error) {
    console.error('Update trainer status error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Update trainer details (SuperAdmin only)
 * @param {string} trainerId - Trainer ID
 * @param {string} name - Trainer name
 * @param {string} email - Trainer email
 * @param {string} mobile - Trainer mobile
 * @returns {Promise<Object>} Result
 */
export const updateTrainer = async (trainerId, name, email, mobile) => {
  try {
    await getFirestore().collection('users').doc(trainerId).update({
      name: name.trim(),
      username: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
    });
    return {success: true};
  } catch (error) {
    console.error('Update trainer error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Delete trainer (SuperAdmin only)
 * @param {string} trainerId - Trainer ID
 * @returns {Promise<Object>} Result
 */
export const deleteTrainer = async (trainerId) => {
  try {
    // Delete from Firestore
    await getFirestore().collection('users').doc(trainerId).delete();

    // Note: We cannot delete from Firebase Auth using client SDK
    // The user will still exist in Authentication but not in Firestore
    // They won't be able to login because profile check will fail
    // For complete deletion, would need Cloud Functions with Admin SDK

    return {success: true};
  } catch (error) {
    console.error('Delete trainer error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Get error message from error code
 * @param {string} code - Error code
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (code) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'Account disabled';
    case 'auth/user-not-found':
      return 'No account with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'Email already registered';
    case 'auth/weak-password':
      return 'Password too weak (min 6 characters)';
    case 'auth/network-request-failed':
      return 'Network error';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later';
    case 'auth/invalid-credential':
      return 'Invalid Credentials';
    case 'auth/requires-recent-login':
      return 'Please log in again to change password';
    default:
      return 'Authentication error';
  }
};
