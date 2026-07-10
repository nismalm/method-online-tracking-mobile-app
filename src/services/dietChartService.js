import {apiClient, extractError} from './apiClient';
import {generateId} from '../constants/dietDefaults';

export const toApiChart = (formState) => ({
  recipientName: formState.clientName.trim(),
  clientProfileId: formState.clientProfileId || undefined,
  meals: formState.meals.map((m) => ({
    name: m.name,
    time: m.time,
    carbItems: m.carbs.map(({name, quantity}) => ({name, quantity})),
    proteinItems: m.proteins.map(({name, quantity, proteinGrams}) => {
      const grams = proteinGrams !== '' && proteinGrams != null ? Number(proteinGrams) : undefined;
      return {name, quantity, ...(grams !== undefined && !isNaN(grams) && grams >= 0 ? {proteinGrams: grams} : {})};
    }),
    otherItems: m.others.map(({name, quantity}) => ({name, quantity})),
    notes: m.notes || '',
  })),
  dailyGoals: formState.dailyGoals.map((g) => g.text.trim()).filter(Boolean),
  supplements: (formState.supplements || []).map((s) => ({
    name: s.name, timing: s.timing, note: s.note,
  })),
  generalNotes: formState.generalNotes.map((n) => n.text.trim()).filter(Boolean),
});

export const fromApiChart = (chart) => ({
  chartId: chart.id,
  clientProfileId: chart.clientProfileId || null,
  clientName: chart.recipientName,
  meals: (chart.meals || []).map((m) => ({
    id: generateId(),
    name: m.name,
    time: m.time,
    carbs: (m.carbItems || []).map((i) => ({id: generateId(), ...i})),
    proteins: (m.proteinItems || []).map((i) => ({id: generateId(), ...i})),
    others: (m.otherItems || []).map((i) => ({id: generateId(), ...i})),
    notes: m.notes || '',
  })),
  dailyGoals: (chart.dailyGoals || []).map((text) => ({id: generateId(), text})),
  supplements: (chart.supplements || []).map((s) => ({id: generateId(), ...s})),
  generalNotes: (chart.generalNotes || []).map((text) => ({id: generateId(), text})),
});

export const getChartByClient = async (clientId) => {
  try {
    const {data} = await apiClient.get(`/diet-charts/by-client/${clientId}`);
    return {success: true, chart: data};
  } catch (err) {
    if (err?.response?.status === 404) {
      return {success: true, chart: null};
    }
    return {success: false, error: extractError(err)};
  }
};

export const createChart = async (payload) => {
  try {
    const {data} = await apiClient.post('/diet-charts', payload);
    return {success: true, chart: data};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const updateChart = async (chartId, payload) => {
  try {
    const {data} = await apiClient.patch(`/diet-charts/${chartId}`, payload);
    return {success: true, chart: data};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};
