import {apiClient, extractError} from './apiClient';
import {getCompleteBMIAnalysis} from '../utils/bmiCalculator';
import {
  GENDER_TO_API,
  BLOOD_TO_API,
  MODE_TO_API,
  STATUS_TO_API,
  ddmmyyyyToIso,
  normalizeClient,
} from './mappers';

export const createClient = async (clientData, customStartDate = null, trainerId = null) => {
  try {
    const {
      name, email, mobile, age, gender, bloodGroup,
      height, startingWeight, package: packageDuration, trainingMode,
    } = clientData;

    const body = {
      name: name.trim(),
      email: email.trim(),
      phone: mobile.trim(),
      age: Number(age),
      gender: GENDER_TO_API[gender] || gender,
      bloodGroup: BLOOD_TO_API[bloodGroup] || bloodGroup,
      height: Number(height),
      startingWeight: Number(startingWeight),
      trainingMode: MODE_TO_API[trainingMode] || trainingMode,
      packageDays: Number(packageDuration),
      startDate: ddmmyyyyToIso(customStartDate),
      ...(trainerId && {trainerId}),
    };

    const {data} = await apiClient.post('/clients', body);

    const weight = parseFloat(startingWeight);
    const heightVal = parseFloat(height);
    const ageVal = parseInt(age, 10);
    const bmiAnalysis = getCompleteBMIAnalysis(weight, heightVal, gender, ageVal);

    return {
      success: true,
      clientId: data.id,
      tempPassword: data.credentials?.tempPassword || data.tempPassword || '',
      bmiAnalysis,
    };
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getAllClients = async () => {
  try {
    const {data} = await apiClient.get('/clients');
    const clients = (Array.isArray(data) ? data : []).map(normalizeClient);
    return {success: true, clients};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getClientsByTrainer = async (trainerId) => {
  try {
    const {data} = await apiClient.get('/clients', {params: {trainerId}});
    const clients = (Array.isArray(data) ? data : []).map(normalizeClient);
    return {success: true, clients};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getClientsByStatus = async (statusLower) => {
  try {
    const apiStatus = STATUS_TO_API[statusLower] || statusLower.toUpperCase();
    const {data} = await apiClient.get('/clients', {params: {clientStatus: apiStatus}});
    const clients = (Array.isArray(data) ? data : []).map(normalizeClient);
    return {success: true, clients};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getClientById = async (clientId) => {
  try {
    const {data} = await apiClient.get(`/clients/${clientId}`);
    return {success: true, client: normalizeClient(data)};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const updateClient = async (clientId, updateData) => {
  try {
    const body = {};
    if (updateData.name !== undefined) {body.name = updateData.name;}
    if (updateData.mobile !== undefined) {body.phone = updateData.mobile;}
    if (updateData.age !== undefined) {body.age = Number(updateData.age);}
    if (updateData.gender !== undefined) {body.gender = GENDER_TO_API[updateData.gender] || updateData.gender;}
    if (updateData.bloodGroup !== undefined) {body.bloodGroup = BLOOD_TO_API[updateData.bloodGroup] || updateData.bloodGroup;}
    if (updateData.height !== undefined) {body.height = Number(updateData.height);}
    if (updateData.startingWeight !== undefined) {body.startingWeight = Number(updateData.startingWeight);}
    if (updateData.package !== undefined) {body.packageDays = Number(updateData.package);}
    if (updateData.trainingMode !== undefined) {body.trainingMode = MODE_TO_API[updateData.trainingMode] || updateData.trainingMode;}
    if (updateData.startDate !== undefined) {body.startDate = ddmmyyyyToIso(updateData.startDate);}

    await apiClient.patch(`/clients/${clientId}`, body);
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const pauseClient = async (clientId) => {
  try {
    await apiClient.patch(`/clients/${clientId}/pause`);
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const resumeClient = async (clientId) => {
  try {
    await apiClient.patch(`/clients/${clientId}/resume`);
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const stopClient = async (clientId, reason) => {
  try {
    await apiClient.patch(`/clients/${clientId}/stop`, {reason: reason?.trim() || 'Stopped'});
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const renewClient = async (clientId, newPackage) => {
  try {
    await apiClient.patch(`/clients/${clientId}/renew`, {newPackageDays: newPackage});
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const deleteClient = async (clientId) => {
  try {
    await apiClient.delete(`/clients/${clientId}`);
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getClientCounts = async () => {
  try {
    const {data} = await apiClient.get('/clients/counts');
    return {success: true, counts: data};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const searchClients = async (query) => {
  try {
    const {data} = await apiClient.get('/clients', {
      params: {search: encodeURIComponent(query)},
    });
    const clients = (Array.isArray(data) ? data : []).map(normalizeClient);
    return {success: true, clients};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const checkAndUpdateClientStatus = async (_clientId) => {
  return {success: true, updated: false};
};

export const recalculateClientEndDate = async (_clientId) => {
  return {success: true};
};
