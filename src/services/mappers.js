export const GENDER_TO_API = {Male: 'MALE', Female: 'FEMALE', Other: 'OTHER'};
export const GENDER_FROM_API = {MALE: 'Male', FEMALE: 'Female', OTHER: 'Other'};
export const BLOOD_TO_API = {
  'A+': 'A_POSITIVE', 'A-': 'A_NEGATIVE',
  'B+': 'B_POSITIVE', 'B-': 'B_NEGATIVE',
  'AB+': 'AB_POSITIVE', 'AB-': 'AB_NEGATIVE',
  'O+': 'O_POSITIVE', 'O-': 'O_NEGATIVE',
};
export const BLOOD_FROM_API = Object.fromEntries(
  Object.entries(BLOOD_TO_API).map(([k, v]) => [v, k])
);
export const MODE_TO_API = {Online: 'ONLINE', Offline: 'OFFLINE'};
export const MODE_FROM_API = {ONLINE: 'Online', OFFLINE: 'Offline'};
export const STATUS_TO_API = {
  active: 'ACTIVE', paused: 'PAUSED', completed: 'COMPLETED', stopped: 'STOPPED',
};
export const STATUS_FROM_API = {
  ACTIVE: 'active', PAUSED: 'paused', COMPLETED: 'completed', STOPPED: 'stopped',
};

export const isoToDDMMYYYY = (iso) => {
  if (!iso) {return '';}
  const d = new Date(iso);
  if (isNaN(d.getTime())) {return '';}
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const ddmmyyyyToIso = (str) => {
  if (!str) {return null;}
  const [d, m, y] = str.split('/').map((n) => parseInt(n, 10));
  if (!d || !m || !y) {return null;}
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

export const wrapIsoAsTimestamp = (iso) => {
  if (!iso) {return null;}
  const date = new Date(iso);
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
};

export const normalizeClient = (raw) => {
  if (!raw) {return null;}
  return {
    id: raw.id,
    name: raw.name,
    mobile: raw.phone,
    age: raw.age,
    gender: GENDER_FROM_API[raw.gender] || raw.gender,
    bloodGroup: BLOOD_FROM_API[raw.bloodGroup] || raw.bloodGroup,
    height: raw.height,
    startingWeight: raw.startingWeight,
    package: raw.packageDays,
    trainingMode: MODE_FROM_API[raw.trainingMode] || raw.trainingMode,
    email: raw.user?.email || raw.email || '',
    status: STATUS_FROM_API[raw.clientStatus] || 'active',
    startDate: isoToDDMMYYYY(raw.startDate),
    endDate: isoToDDMMYYYY(raw.endDate),
    createdBy: raw.trainers?.[0]?.id ?? null,
    createdAt: wrapIsoAsTimestamp(raw.createdAt),
    stoppedAt: wrapIsoAsTimestamp(raw.stoppedAt),
    stoppedReason: raw.stoppedReason || null,
    pauseHistory: (raw.pauseHistory || []).map((p) => ({
      pausedAt: wrapIsoAsTimestamp(p.pausedAt),
      resumedAt: p.resumedAt ? wrapIsoAsTimestamp(p.resumedAt) : null,
      pausedDays: p.pausedDays,
    })),
    currentPackageId: raw.currentPackageId,
    weightHistory: raw.weightHistory || [],
  };
};
