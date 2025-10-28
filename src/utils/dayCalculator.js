/**
 * Day Calculator Utility
 * Handles all date calculations and day counting for client package management
 *
 * Key Principles:
 * - Start date is Day 1 (not Day 0)
 * - End date = start date + package - 1 day
 * - Paused days are excluded from progress
 * - Multiple pause/resume cycles are supported
 */

/**
 * Parse date from DD/MM/YYYY string format to Date object
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;

  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const date = new Date(year, month, day);

  // Validate the date is valid
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
};

/**
 * Format Date object to DD/MM/YYYY string
 * @param {Date} dateObject - JavaScript Date object
 * @returns {string} Date in DD/MM/YYYY format
 */
export const formatDate = (dateObject) => {
  if (!dateObject || !(dateObject instanceof Date) || isNaN(dateObject.getTime())) {
    return '';
  }

  const day = String(dateObject.getDate()).padStart(2, '0');
  const month = String(dateObject.getMonth() + 1).padStart(2, '0');
  const year = dateObject.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calculate days between two dates (inclusive)
 * @param {Date} date1 - Start date
 * @param {Date} date2 - End date
 * @returns {number} Number of days
 */
export const daysBetween = (date1, date2) => {
  if (!date1 || !date2) return 0;

  // Set time to midnight for accurate day calculation
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

  const timeDiff = d2.getTime() - d1.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

  return daysDiff;
};

/**
 * Calculate end date based on start date and package duration
 * Important: End date = start date + package - 1 day
 * Example: Start Jan 1, 30 days → End Jan 30 (Day 30, not Jan 31)
 *
 * @param {string} startDateString - Start date in DD/MM/YYYY format
 * @param {number} packageDays - Package duration in days
 * @returns {string} End date in DD/MM/YYYY format
 */
export const calculateEndDate = (startDateString, packageDays) => {
  const startDate = parseDate(startDateString);
  if (!startDate) return '';

  // End date = start + package - 1
  // Because start date is Day 1, not Day 0
  const endDate = addDays(startDate, packageDays - 1);

  return formatDate(endDate);
};

/**
 * Calculate days elapsed from start date to reference date
 * @param {string} startDateString - Start date in DD/MM/YYYY format
 * @param {Date} referenceDate - Reference date (usually today)
 * @returns {number} Days elapsed (0 if started today)
 */
export const calculateDaysElapsed = (startDateString, referenceDate = new Date()) => {
  const startDate = parseDate(startDateString);
  if (!startDate) return 0;

  const elapsed = daysBetween(startDate, referenceDate);

  return Math.max(0, elapsed);
};

/**
 * Calculate current day number (Day 1, Day 2, etc.)
 * Important: Start date is Day 1, not Day 0
 *
 * @param {number} daysElapsed - Days elapsed from start
 * @returns {number} Current day number (1-based)
 */
export const calculateCurrentDay = (daysElapsed) => {
  return daysElapsed + 1;
};

/**
 * Calculate paused days for a single pause period
 * @param {Date|Object} pausedAt - Pause timestamp
 * @param {Date|Object|null} resumedAt - Resume timestamp (null if currently paused)
 * @returns {number} Number of paused days
 */
export const calculatePausedDays = (pausedAt, resumedAt) => {
  if (!pausedAt) return 0;

  // Handle Firebase Timestamp
  const pauseDate = pausedAt.toDate ? pausedAt.toDate() : new Date(pausedAt);

  if (!resumedAt) {
    // Currently paused - calculate up to now
    const now = new Date();
    return daysBetween(pauseDate, now);
  }

  // Handle Firebase Timestamp for resume
  const resumeDate = resumedAt.toDate ? resumedAt.toDate() : new Date(resumedAt);

  return daysBetween(pauseDate, resumeDate);
};

/**
 * Calculate total paused days from pause history array
 * @param {Array} pauseHistory - Array of pause records
 * @returns {number} Total paused days
 */
export const calculateTotalPausedDays = (pauseHistory) => {
  if (!pauseHistory || !Array.isArray(pauseHistory) || pauseHistory.length === 0) {
    return 0;
  }

  return pauseHistory.reduce((total, pause) => {
    // If pause has pausedDays field, use it
    if (pause.pausedDays !== undefined && pause.pausedDays !== null) {
      return total + pause.pausedDays;
    }

    // Otherwise calculate it
    return total + calculatePausedDays(pause.pausedAt, pause.resumedAt);
  }, 0);
};

/**
 * Calculate effective days used (excluding paused days)
 * @param {number} daysElapsed - Total days elapsed from start
 * @param {number} totalPausedDays - Total paused days
 * @returns {number} Effective days used
 */
export const calculateEffectiveDaysUsed = (daysElapsed, totalPausedDays) => {
  return Math.max(0, daysElapsed - totalPausedDays);
};

/**
 * Calculate days remaining in package
 * @param {number} packageDays - Total package duration
 * @param {number} effectiveDaysUsed - Effective days used
 * @returns {number} Days remaining (can be negative if overdue)
 */
export const calculateDaysRemaining = (packageDays, effectiveDaysUsed) => {
  return packageDays - effectiveDaysUsed;
};

/**
 * Calculate progress percentage
 * @param {number} effectiveDaysUsed - Effective days used
 * @param {number} packageDays - Total package duration
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (effectiveDaysUsed, packageDays) => {
  if (packageDays <= 0) return 0;

  const progress = (effectiveDaysUsed / packageDays) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
};

/**
 * Check if package is completed
 * @param {number} effectiveDaysUsed - Effective days used
 * @param {number} packageDays - Total package duration
 * @returns {boolean} True if completed
 */
export const isPackageCompleted = (effectiveDaysUsed, packageDays) => {
  return effectiveDaysUsed >= packageDays;
};

/**
 * Calculate expected end date including pauses
 * @param {string} startDateString - Start date in DD/MM/YYYY format
 * @param {number} packageDays - Package duration
 * @param {number} totalPausedDays - Total paused days
 * @returns {string} Expected end date in DD/MM/YYYY format
 */
export const calculateExpectedEndDate = (startDateString, packageDays, totalPausedDays) => {
  const startDate = parseDate(startDateString);
  if (!startDate) return '';

  // Expected end = start + package + paused days - 1
  const expectedEnd = addDays(startDate, packageDays + totalPausedDays - 1);

  return formatDate(expectedEnd);
};

/**
 * Get complete day analysis for a client
 * This is the main function to use for all day-related displays
 *
 * @param {Object} client - Client object from Firestore
 * @returns {Object} Complete day analysis
 */
export const getClientDayAnalysis = (client) => {
  if (!client) {
    return {
      currentDay: 0,
      daysElapsed: 0,
      effectiveDaysUsed: 0,
      daysRemaining: 0,
      totalPausedDays: 0,
      progress: 0,
      status: 'unknown',
      expectedEndDate: '',
      originalEndDate: '',
      isCompleted: false,
      isPaused: false,
      isStopped: false,
      isActive: false,
    };
  }

  const {
    startDate,
    package: packageDays,
    endDate,
    status,
    pauseHistory = [],
  } = client;

  // Calculate paused days
  const totalPausedDays = calculateTotalPausedDays(pauseHistory);

  // Calculate elapsed days
  const daysElapsed = calculateDaysElapsed(startDate);

  // Calculate effective days used (excluding pauses)
  const effectiveDaysUsed = calculateEffectiveDaysUsed(daysElapsed, totalPausedDays);

  // Calculate current day number (1-based)
  const currentDay = Math.min(calculateCurrentDay(effectiveDaysUsed - 1), packageDays);

  // Calculate days remaining
  const daysRemaining = calculateDaysRemaining(packageDays, effectiveDaysUsed);

  // Calculate progress
  const progress = calculateProgress(effectiveDaysUsed, packageDays);

  // Check completion
  const isCompleted = isPackageCompleted(effectiveDaysUsed, packageDays);

  // Expected end date with pauses
  const expectedEndDate = calculateExpectedEndDate(startDate, packageDays, totalPausedDays);

  // Status flags
  const isPaused = status === 'paused';
  const isStopped = status === 'stopped';
  const isActive = status === 'active';

  return {
    currentDay: isActive || isPaused ? Math.max(1, currentDay) : currentDay,
    daysElapsed,
    effectiveDaysUsed,
    daysRemaining: Math.max(0, daysRemaining),
    totalPausedDays,
    progress,
    status,
    expectedEndDate,
    originalEndDate: endDate,
    isCompleted,
    isPaused,
    isStopped,
    isActive,
    packageDays,
  };
};

/**
 * Get display text for days
 * @param {Object} analysis - Result from getClientDayAnalysis
 * @returns {Object} Display texts
 */
export const getDayDisplayText = (analysis) => {
  const {
    currentDay,
    packageDays,
    daysRemaining,
    isPaused,
    isStopped,
    isCompleted,
  } = analysis;

  let dayText = '';
  let remainingText = '';
  let statusText = '';

  if (isStopped) {
    dayText = `Stopped at Day ${currentDay}`;
    remainingText = 'Package stopped';
    statusText = 'Stopped';
  } else if (isCompleted) {
    dayText = `Day ${packageDays} of ${packageDays}`;
    remainingText = 'Completed';
    statusText = 'Completed';
  } else if (isPaused) {
    dayText = `Day ${currentDay} of ${packageDays}`;
    remainingText = `Paused (${daysRemaining} days left)`;
    statusText = 'Paused';
  } else {
    dayText = `Day ${currentDay} of ${packageDays}`;
    remainingText = `${daysRemaining} days remaining`;
    statusText = 'Active';
  }

  return {
    dayText,
    remainingText,
    statusText,
  };
};
