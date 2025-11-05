import firestore from '@react-native-firebase/firestore';
import * as DayCalculator from '../utils/dayCalculator';

/**
 * Package Service - Manages client packages and activities
 *
 * Database Structure:
 * - clientPackages/{packageId} - Package metadata
 * - clientPackages/{packageId}/activities/{dayId} - Daily activities
 */

/**
 * Generate unique package ID
 * @param {string} clientId - Client ID
 * @returns {string} Package ID in format: pkg_{clientId}_{timestamp}
 */
export const generatePackageId = (clientId) => {
  const timestamp = Date.now();
  return `pkg_${clientId}_${timestamp}`;
};

/**
 * Create a new package for a client
 * Called when creating new client or renewing
 * Note: Dates are stored in clients collection only (single source of truth)
 *
 * @param {Object} packageData - Package details
 * @returns {Promise<Object>} Result with packageId
 */
export const createPackage = async (packageData) => {
  try {
    const {
      clientId,
      clientName,
      packageDays,
      trainingMode,
    } = packageData;

    // Validate required fields
    if (!clientId || !clientName || !packageDays || !trainingMode) {
      throw new Error('Missing required package fields');
    }

    const packageId = generatePackageId(clientId);

    // Package document - stores only package metadata and stats
    // Dates and lifecycle state are stored in clients collection (single source of truth)
    const packageDoc = {
      packageId: packageId,
      clientId: clientId,
      clientName: clientName,
      packageDays: parseInt(packageDays, 10),
      trainingMode: trainingMode,
      totalDaysCompleted: 0,
      completionRate: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      completedAt: null,
    };

    await firestore()
      .collection('clientPackages')
      .doc(packageId)
      .set(packageDoc);

    return {
      success: true,
      packageId: packageId,
      message: 'Package created successfully',
    };
  } catch (error) {
    console.error('Create package error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Get all packages for a specific client
 * Ordered by newest first
 *
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} Result with packages array
 */
export const getPackagesByClient = async (clientId) => {
  try {
    const snapshot = await firestore()
      .collection('clientPackages')
      .where('clientId', '==', clientId)
      .get();

    // Sort in memory to avoid composite index requirement
    const packages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

    return {success: true, packages};
  } catch (error) {
    console.error('Get packages error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Get a single package by ID
 *
 * @param {string} packageId - Package ID
 * @returns {Promise<Object>} Result with package data
 */
export const getPackageById = async (packageId) => {
  try {
    const doc = await firestore()
      .collection('clientPackages')
      .doc(packageId)
      .get();

    if (doc.exists) {
      return {
        success: true,
        package: {id: doc.id, ...doc.data()},
      };
    } else {
      return {success: false, error: 'Package not found'};
    }
  } catch (error) {
    console.error('Get package error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Get all activities for a specific package
 * Ordered by day number descending (newest first)
 *
 * @param {string} packageId - Package ID
 * @returns {Promise<Object>} Result with activities array
 */
export const getPackageActivities = async (packageId) => {
  try {
    const snapshot = await firestore()
      .collection('clientPackages')
      .doc(packageId)
      .collection('activities')
      .orderBy('dayNumber', 'desc')
      .get();

    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {success: true, activities};
  } catch (error) {
    console.error('Get activities error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Get a single activity by day number
 *
 * @param {string} packageId - Package ID
 * @param {number} dayNumber - Day number
 * @returns {Promise<Object>} Result with activity data
 */
export const getActivityByDay = async (packageId, dayNumber) => {
  try {
    const dayId = `day_${dayNumber}`;
    const doc = await firestore()
      .collection('clientPackages')
      .doc(packageId)
      .collection('activities')
      .doc(dayId)
      .get();

    if (doc.exists) {
      return {
        success: true,
        activity: {id: doc.id, ...doc.data()},
      };
    } else {
      return {success: false, error: 'Activity not found'};
    }
  } catch (error) {
    console.error('Get activity error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Update package status
 * Used when client is paused, resumed, stopped, or completed
 *
 * @param {string} packageId - Package ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Result
 */
export const updatePackage = async (packageId, updateData) => {
  try {
    await firestore()
      .collection('clientPackages')
      .doc(packageId)
      .update(updateData);

    return {success: true};
  } catch (error) {
    console.error('Update package error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Update package completion statistics
 * Called after activity submission to keep stats current
 *
 * @param {string} packageId - Package ID
 * @returns {Promise<Object>} Result
 */
export const updatePackageStats = async (packageId) => {
  try {
    // Get all activities
    const activitiesResult = await getPackageActivities(packageId);
    if (!activitiesResult.success) {
      return activitiesResult;
    }

    const activities = activitiesResult.activities;
    const completedActivities = activities.filter(
      a => a.status === 'completed' || a.status === 'partial'
    );

    // Get package to know total days
    const packageResult = await getPackageById(packageId);
    if (!packageResult.success) {
      return packageResult;
    }

    const packageData = packageResult.package;
    const totalDays = packageData.packageDays;
    const completedCount = completedActivities.length;
    const completionRate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

    await updatePackage(packageId, {
      totalDaysCompleted: completedCount,
      completionRate: completionRate,
    });

    return {success: true};
  } catch (error) {
    console.error('Update package stats error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Delete a package and all its activities
 * Used when deleting a client
 *
 * @param {string} packageId - Package ID
 * @returns {Promise<Object>} Result
 */
export const deletePackage = async (packageId) => {
  try {
    // Delete all activities first
    const activitiesSnapshot = await firestore()
      .collection('clientPackages')
      .doc(packageId)
      .collection('activities')
      .get();

    const batch = firestore().batch();

    activitiesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the package document
    const packageRef = firestore().collection('clientPackages').doc(packageId);
    batch.delete(packageRef);

    await batch.commit();

    return {success: true};
  } catch (error) {
    console.error('Delete package error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Get package dropdown options for UI
 * Formats packages for dropdown selection
 * Note: Active packages get dates from client, archived packages have snapshot dates
 *
 * @param {string} clientId - Client ID
 * @param {string} currentPackageId - Current active package ID to mark as "Current"
 * @returns {Promise<Object>} Result with formatted options
 */
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
        // Current package - dates come from client
        label = 'Current Package';
      } else if (pkg.startDate && pkg.endDate) {
        // Archived package with snapshot dates - show date range
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
          // Fallback if date format is invalid
          const packageNumber = result.packages.length - index;
          label = `Package ${packageNumber}`;
        }
      } else {
        // Old package without dates - use number
        const packageNumber = result.packages.length - index;
        label = `Package ${packageNumber}`;
      }

      return {
        label: label,
        value: pkg.packageId,
        packageData: pkg,
      };
    });

    return {success: true, options};
  } catch (error) {
    console.error('Get package options error:', error);
    return {success: false, error: error.message};
  }
};

/**
 * Check if a date falls within a pause period
 *
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @param {Array} pauseHistory - Pause history array
 * @returns {boolean} True if date is paused
 */
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

    // Normalize all dates to midnight for comparison
    const pausedDateMidnight = new Date(pausedDate.getFullYear(), pausedDate.getMonth(), pausedDate.getDate());
    const resumedDateMidnight = new Date(resumedDate.getFullYear(), resumedDate.getMonth(), resumedDate.getDate());
    const checkDateMidnight = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

    // Include pause start date, exclude resume date
    // If paused on 4th, 4th is striked. If resumed on 5th, 5th is NOT striked.
    if (checkDateMidnight >= pausedDateMidnight && checkDateMidnight < resumedDateMidnight) {
      return true;
    }
  }

  return false;
};

/**
 * Calculate day number from date for a specific package
 *
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @param {string} startDate - Package start date in DD/MM/YYYY format
 * @param {Array} pauseHistory - Pause history array
 * @returns {number|null} Day number or null if date is outside package
 */
export const calculateDayNumber = (dateString, startDate, pauseHistory = []) => {
  const date = DayCalculator.parseDate(dateString);
  const start = DayCalculator.parseDate(startDate);

  if (!date || !start) {
    return null;
  }

  if (date < start) {
    return null; // Before package start
  }

  const elapsedDays = DayCalculator.daysBetween(start, date);

  // Calculate paused days before this date
  let pausedDaysBeforeDate = 0;
  for (const pause of pauseHistory) {
    if (!pause.pausedAt || !pause.resumedAt) {
      continue;
    }

    const pausedDate = pause.pausedAt.toDate ? pause.pausedAt.toDate() : new Date(pause.pausedAt);
    const resumedDate = pause.resumedAt.toDate ? pause.resumedAt.toDate() : new Date(pause.resumedAt);

    if (resumedDate <= date) {
      // Pause period ended before this date
      pausedDaysBeforeDate += DayCalculator.daysBetween(pausedDate, resumedDate);
    }
  }

  const dayNumber = elapsedDays - pausedDaysBeforeDate + 1;
  return dayNumber > 0 ? dayNumber : null;
};
