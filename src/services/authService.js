import {apiClient, extractError} from './apiClient';
import * as TokenStorage from './tokenStorage';

export const signIn = async (email, password) => {
  try {
    const {data} = await apiClient.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    if (data.mustChangePassword) {
      return {success: false, error: 'This account requires setup in the client app.'};
    }
    await TokenStorage.saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return {success: true, user: data.user};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const signOut = async () => {
  try {
    await apiClient.delete('/auth/logout').catch(() => {});
    await TokenStorage.clearTokens();
    return {success: true};
  } catch (err) {
    await TokenStorage.clearTokens();
    return {success: false, error: extractError(err)};
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    await apiClient.patch('/auth/update-password', {currentPassword, newPassword});
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const resetPassword = async (email) => {
  try {
    await apiClient.post('/auth/forgot-password', {email: email.trim().toLowerCase()});
    return {success: true};
  } catch {
    return {success: true};
  }
};

export const getUserProfile = async () => {
  try {
    const {data} = await apiClient.get('/users/me');
    return {success: true, profile: data};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const updateUserProfile = async (updates) => {
  try {
    const {data} = await apiClient.patch('/users/me/trainer', updates);
    return {success: true, profile: data};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const createTrainer = async (name, email, mobile) => {
  try {
    const {data} = await apiClient.post('/trainers', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: mobile.trim(),
    });
    return {
      success: true,
      trainerId: data.trainer?.id,
      password: data.tempPassword,
    };
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getAllTrainers = async () => {
  try {
    const {data} = await apiClient.get('/trainers');
    const trainers = (Array.isArray(data) ? data : []).map(normalizeTrainer);
    return {success: true, trainers};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const updateTrainerStatus = async (trainerId, statusLower) => {
  try {
    await apiClient.patch(`/trainers/${trainerId}`, {
      status: statusLower.toUpperCase(),
    });
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const updateTrainer = async (trainerId, name, email, mobile) => {
  try {
    await apiClient.patch(`/trainers/${trainerId}`, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: mobile.trim(),
    });
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const deleteTrainer = async (trainerId) => {
  try {
    await apiClient.delete(`/trainers/${trainerId}`);
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

const normalizeTrainer = (t) => ({
  uid: t.id,
  userId: t.userId,
  name: t.name,
  email: t.email,
  mobile: t.phone,
  status: (t.status || '').toLowerCase(),
  role: 'Trainer',
  createdAt: t.createdAt,
});
