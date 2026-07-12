import {apiClient, extractError} from './apiClient';
import {BLOOD_FROM_API, GENDER_FROM_API} from './mappers';

const normalizeIntake = (raw) => ({
  id: raw.id,
  name: raw.name || '',
  mobile: raw.mobile || '',
  email: raw.email || '',
  age: raw.age,
  gender: GENDER_FROM_API[raw.gender] || raw.gender || '',
  bloodGroup: BLOOD_FROM_API[raw.bloodGroup] || raw.bloodGroup || '',
  height: raw.height,
  weight: raw.weight,
  timezone: raw.timezone,
  submittedAt: raw.submittedAt,
});

export const getPendingIntakes = async () => {
  try {
    const {data} = await apiClient.get('/client-intake/pending');
    const intakes = (Array.isArray(data) ? data : []).map(normalizeIntake);
    return {success: true, intakes};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const dismissIntake = async (intakeId) => {
  try {
    await apiClient.delete(`/client-intake/${intakeId}/dismiss`);
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};
