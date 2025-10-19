import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

class AuthService {
  async signIn(email, password) {
    try {
      const result = await auth().signInWithEmailAndPassword(email, password);
      return {success: true, user: result.user};
    } catch (error) {
      return {success: false, error: this.getErrorMessage(error.code)};
    }
  }

  async signUp(email, password, username, role) {
    try {
      const result = await auth().createUserWithEmailAndPassword(email, password);
      await firestore().collection('users').doc(result.user.uid).set({
        uid: result.user.uid,
        email,
        username,
        role,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      return {success: true};
    } catch (error) {
      return {success: false, error: this.getErrorMessage(error.code)};
    }
  }

  async resetPassword(email) {
    try {
      await auth().sendPasswordResetEmail(email);
      return {success: true};
    } catch (error) {
      return {success: false, error: this.getErrorMessage(error.code)};
    }
  }

  async signOut() {
    try {
      await auth().signOut();
      return {success: true};
    } catch (error) {
      return {success: false, error: error.message};
    }
  }

  onAuthStateChanged(callback) {
    return auth().onAuthStateChanged(callback);
  }

  getCurrentUser() {
    return auth().currentUser;
  }

  getErrorMessage(code) {
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
        return 'Invalid email or password';
      default:
        return 'Authentication error';
    }
  }
}

export default new AuthService();
