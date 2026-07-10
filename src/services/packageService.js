import {apiClient, extractError} from './apiClient';
import * as DayCalculator from '../utils/dayCalculator';
import {MODE_FROM_API, STATUS_FROM_API, isoToDDMMYYYY, wrapIsoAsTimestamp} from './mappers';

const normalizePackage = (raw) => ({
  id: raw.packageId,
  packageId: raw.packageId,
  clientId: raw.clientId,
  packageDays: raw.packageDays,
  trainingMode: MODE_FROM_API[raw.trainingMode] || raw.trainingMode,
  startDate: isoToDDMMYYYY(raw.startDate),
  endDate: isoToDDMMYYYY(raw.endDate),
  status: STATUS_FROM_API[raw.status] || 'active',
  completionRate: raw.completionRate || 0,
  totalDaysCompleted: raw.totalDaysCompleted || 0,
  createdAt: wrapIsoAsTimestamp(raw.createdAt),
  completedAt: wrapIsoAsTimestamp(raw.completedAt),
  stoppedAt: wrapIsoAsTimestamp(raw.stoppedAt),
  stoppedReason: raw.stoppedReason || null,
  pauseHistory: (raw.pauseHistory || []).map((p) => ({
    pausedAt: wrapIsoAsTimestamp(p.pausedAt),
    resumedAt: p.resumedAt ? wrapIsoAsTimestamp(p.resumedAt) : null,
    pausedDays: p.pausedDays,
  })),
});

const normalizeActivity = (raw) => ({
  id: raw.id,
  date: isoToDDMMYYYY(raw.date),
  dayNumber: raw.dayNumber,
  status: (raw.status || 'PENDING').toLowerCase(),
  responses: raw.responses || [],
  progress: raw.progress || null,
  submittedAt: wrapIsoAsTimestamp(raw.submittedAt),
});

export const getPackagesByClient = async (clientId) => {
  try {
    const {data} = await apiClient.get(`/clients/${clientId}/packages`);
    const packages = (Array.isArray(data) ? data : []).map(normalizePackage);
    return {success: true, packages};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getPackageActivities = async (clientId, packageId) => {
  try {
    const {data} = await apiClient.get(
      `/clients/${clientId}/packages/${packageId}/activities`
    );
    const activities = (Array.isArray(data) ? data : []).map(normalizeActivity);
    return {success: true, activities};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getPackageOptions = async (clientId, currentPackageId = null) => {
  try {
    const result = await getPackagesByClient(clientId);
    if (!result.success) {
      return result;
    }

    const options = result.packages.map((pkg, index) => {
      const isCurrent = pkg.packageId === currentPackageId;

      let label;
      if (isCurrent) {
        label = 'Current Package';
      } else if (pkg.startDate && pkg.endDate) {
        const startParts = pkg.startDate.split('/');
        const endParts = pkg.endDate.split('/');

        if (startParts.length === 3 && endParts.length === 3) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const startMonth = monthNames[parseInt(startParts[1], 10) - 1] || '';
          const endMonth = monthNames[parseInt(endParts[1], 10) - 1] || '';
          const year = startParts[2];
          const statusLabel = pkg.status ? ` (${pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)})` : '';

          if (startMonth === endMonth) {
            label = `${startMonth} ${year}${statusLabel}`;
          } else {
            label = `${startMonth}-${endMonth} ${year}${statusLabel}`;
          }
        } else {
          const packageNumber = result.packages.length - index;
          label = `Package ${packageNumber}`;
        }
      } else {
        const packageNumber = result.packages.length - index;
        label = `Package ${packageNumber}`;
      }

      return {
        label,
        value: pkg.packageId,
        packageData: pkg,
      };
    });

    return {success: true, options};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const isDatePaused = (dateString, pauseHistory) => {
  if (!pauseHistory || pauseHistory.length === 0) {
    return false;
  }

  const checkDate = DayCalculator.parseDate(dateString);
  if (!checkDate) {
    return false;
  }

  for (const pause of pauseHistory) {
    if (!pause.pausedAt || !pause.resumedAt) {
      continue;
    }

    const pausedDate = pause.pausedAt.toDate ? pause.pausedAt.toDate() : new Date(pause.pausedAt);
    const resumedDate = pause.resumedAt.toDate ? pause.resumedAt.toDate() : new Date(pause.resumedAt);

    const pausedDateMidnight = new Date(pausedDate.getFullYear(), pausedDate.getMonth(), pausedDate.getDate());
    const resumedDateMidnight = new Date(resumedDate.getFullYear(), resumedDate.getMonth(), resumedDate.getDate());
    const checkDateMidnight = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

    if (checkDateMidnight >= pausedDateMidnight && checkDateMidnight < resumedDateMidnight) {
      return true;
    }
  }

  return false;
};

export const calculateDayNumber = (dateString, startDate, pauseHistory = []) => {
  const date = DayCalculator.parseDate(dateString);
  const start = DayCalculator.parseDate(startDate);

  if (!date || !start) {
    return null;
  }

  if (date < start) {
    return null;
  }

  const elapsedDays = DayCalculator.daysBetween(start, date);

  let pausedDaysBeforeDate = 0;
  for (const pause of pauseHistory) {
    if (!pause.pausedAt || !pause.resumedAt) {
      continue;
    }

    const pausedDate = pause.pausedAt.toDate ? pause.pausedAt.toDate() : new Date(pause.pausedAt);
    const resumedDate = pause.resumedAt.toDate ? pause.resumedAt.toDate() : new Date(pause.resumedAt);

    if (resumedDate <= date) {
      pausedDaysBeforeDate += DayCalculator.daysBetween(pausedDate, resumedDate);
    }
  }

  const dayNumber = elapsedDays - pausedDaysBeforeDate + 1;
  return dayNumber > 0 ? dayNumber : null;
};
