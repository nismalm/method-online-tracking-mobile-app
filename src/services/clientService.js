import firestore, {getFirestore} from '@react-native-firebase/firestore';
import {getCompleteBMIAnalysis} from '../utils/bmiCalculator';
import * as DayCalculator from '../utils/dayCalculator';

/**
 * Client Service - Manages all client lifecycle operations
 *
 * STATE TRANSITION MATRIX (STRICT VALIDATION RULES):
 *
 * Operation    | From Status           | To Status  | Allowed?
 * -------------|----------------------|------------|----------
 * PAUSE        | active               | paused     | ✅ YES
 * PAUSE        | paused               | -          | ❌ NO (already paused)
 * PAUSE        | completed            | -          | ❌ NO (cannot pause completed)
 * PAUSE        | stopped              | -          | ❌ NO (cannot pause stopped)
 *
 * RESUME       | paused               | active     | ✅ YES (extends endDate)
 * RESUME       | active               | -          | ❌ NO (already active)
 * RESUME       | completed            | -          | ❌ NO (renew instead)
 * RESUME       | stopped              | -          | ❌ NO (renew instead)
 *
 * STOP         | active               | stopped    | ✅ YES
 * STOP         | paused               | stopped    | ✅ YES (closes open pause)
 * STOP         | completed            | -          | ❌ NO (already finished)
 * STOP         | stopped              | -          | ❌ NO (already stopped)
 *
 * RENEW        | completed            | active     | ✅ YES (fresh start)
 * RENEW        | stopped              | active     | ✅ YES (fresh start)
 * RENEW        | active               | -          | ❌ NO (stop first)
 * RENEW        | paused               | -          | ❌ NO (resume/stop first)
 *
 * AUTO-COMPLETE| active (Day >= Max)  | completed  | ✅ YES (automatic)
 * AUTO-COMPLETE| paused               | -          | ❌ NO (paused don't progress)
 *
 * BUSINESS RULES:
 * 1. Only ACTIVE clients progress through days
 * 2. PAUSED clients freeze on their current day (no progression)
 * 3. RESUME extends endDate by the number of paused days
 * 4. STOP on paused client closes the open pause entry
 * 5. RENEW clears all history and starts fresh
 * 6. COMPLETED/STOPPED clients cannot be paused or resumed
 */

class ClientService {
  // Generate unique login code for client
  generateLoginCode() {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `METHOD${randomDigits}`;
  }

  // Create a new client
  async createClient(clientData, createdByUsername, customStartDate = null) {
    try {
      // Validate required fields
      if (!clientData.name || !clientData.mobile || !clientData.age ||
          !clientData.gender || !clientData.bloodGroup || !clientData.height ||
          !clientData.startingWeight || !clientData.package || !clientData.trainingMode) {
        throw new Error('Missing required fields');
      }

      const loginCode = this.generateLoginCode();
      const packageDuration = parseInt(clientData.package, 10);

      // Start date (Day 1)
      const startDate = customStartDate || DayCalculator.formatDate(new Date());

      // Calculate end date (start + package - 1)
      const endDate = DayCalculator.calculateEndDate(startDate, packageDuration);

      // Calculate BMI analysis for display only (not stored in DB)
      const weight = parseFloat(clientData.startingWeight);
      const height = parseFloat(clientData.height);
      const age = parseInt(clientData.age, 10);
      const gender = clientData.gender.trim();

      const bmiAnalysis = getCompleteBMIAnalysis(weight, height, gender, age);

      const clientDoc = {
        name: clientData.name.trim(),
        mobile: clientData.mobile.trim(),
        age: age,
        gender: gender,
        bloodGroup: clientData.bloodGroup.trim(),
        height: height,
        startingWeight: weight,
        package: packageDuration,
        trainingMode: clientData.trainingMode.trim(),
        loginCode: loginCode,
        status: 'active',
        createdAt: firestore.FieldValue.serverTimestamp(),
        createdBy: createdByUsername,
        startDate: startDate,
        endDate: endDate,
        // Lifecycle tracking
        pauseHistory: [],
        renewalHistory: [],
        stoppedAt: null,
        stoppedReason: null,
      };

      // Add to clients collection
      const docRef = await getFirestore().collection('clients').add(clientDoc);

      return {
        success: true,
        clientId: docRef.id,
        loginCode: loginCode,
        bmiAnalysis: bmiAnalysis,
        message: 'Client created successfully',
      };
    } catch (error) {
      console.error('Create client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Get all clients
  async getAllClients() {
    try {
      const snapshot = await getFirestore()
        .collection('clients')
        .orderBy('createdAt', 'desc')
        .get();

      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {success: true, clients};
    } catch (error) {
      console.error('Get clients error:', error);
      return {success: false, error: error.message};
    }
  }

  // Get client by ID
  async getClientById(clientId) {
    try {
      const doc = await getFirestore().collection('clients').doc(clientId).get();

      if (doc.exists) {
        return {success: true, client: {id: doc.id, ...doc.data()}};
      } else {
        return {success: false, error: 'Client not found'};
      }
    } catch (error) {
      console.error('Get client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Update client
  async updateClient(clientId, updateData) {
    try {
      await getFirestore().collection('clients').doc(clientId).update(updateData);
      return {success: true};
    } catch (error) {
      console.error('Update client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Update client status
  // WARNING: This function bypasses business logic validations
  // Use specific functions instead: pauseClient, resumeClient, stopClient, renewClient
  // This should only be used for system operations, not user actions
  async updateClientStatus(clientId, status) {
    try {
      console.warn('Direct status update bypassing validations:', clientId, status);
      console.warn('Consider using: pauseClient, resumeClient, stopClient, or renewClient instead');

      await getFirestore().collection('clients').doc(clientId).update({
        status: status,
      });
      return {success: true};
    } catch (error) {
      console.error('Update client status error:', error);
      return {success: false, error: error.message};
    }
  }

  // Pause client - Only active clients can be paused
  async pauseClient(clientId) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();

      // Strict validation: ONLY active clients can be paused
      // Completed/stopped/paused clients cannot be paused
      if (clientData.status !== 'active') {
        const statusMessages = {
          'paused': 'Client is already paused',
          'completed': 'Cannot pause a completed client. Please renew first.',
          'stopped': 'Cannot pause a stopped client. Please renew first.',
        };
        const message = statusMessages[clientData.status] || 'Only active clients can be paused';
        return {success: false, error: message};
      }

      const pauseHistory = clientData.pauseHistory || [];

      // Defensive check: Ensure no open pause entry exists (shouldn't happen if status is active)
      const hasOpenPause = pauseHistory.some(p => p.resumedAt === null);
      if (hasOpenPause) {
        console.error('Data integrity error: Active client has open pause entry', clientId);
        return {success: false, error: 'Data integrity error. Please contact support.'};
      }

      // Create pause entry with current timestamp
      // pausedDays will be calculated dynamically or set on resume
      const pauseEntry = {
        pausedAt: firestore.Timestamp.now(),
        resumedAt: null,
      };

      // Add to history array
      pauseHistory.push(pauseEntry);

      // State transition: active → paused
      // Clear stopped fields (paused is not stopped)
      await getFirestore().collection('clients').doc(clientId).update({
        status: 'paused',
        pauseHistory: pauseHistory,
        stoppedAt: null,
        stoppedReason: null,
      });

      return {success: true, message: 'Client paused successfully'};
    } catch (error) {
      console.error('Pause client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Resume client - Only paused clients can be resumed
  async resumeClient(clientId) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();

      // Strict validation: ONLY paused clients can be resumed
      // Active/completed/stopped clients cannot be resumed
      if (clientData.status !== 'paused') {
        const statusMessages = {
          'active': 'Client is already active',
          'completed': 'Cannot resume a completed client. Please renew first.',
          'stopped': 'Cannot resume a stopped client. Please renew first.',
        };
        const message = statusMessages[clientData.status] || 'Only paused clients can be resumed';
        return {success: false, error: message};
      }

      const pauseHistory = clientData.pauseHistory || [];

      if (pauseHistory.length === 0) {
        console.error('Data integrity error: Paused client has no pause history', clientId);
        return {success: false, error: 'Data integrity error. Please contact support.'};
      }

      // Get the last pause entry
      const lastPauseIndex = pauseHistory.length - 1;
      const lastPause = pauseHistory[lastPauseIndex];

      // Defensive check: Ensure the last pause entry is actually open
      if (lastPause.resumedAt !== null) {
        console.error('Data integrity error: Paused client has no open pause entry', clientId);
        return {success: false, error: 'Data integrity error. Please contact support.'};
      }

      // Calculate paused days for this pause cycle
      const pausedDays = DayCalculator.calculatePausedDays(lastPause.pausedAt, firestore.Timestamp.now());

      // Update the last pause entry
      lastPause.resumedAt = firestore.Timestamp.now();
      lastPause.pausedDays = pausedDays;

      // Calculate new end date by extending with paused days
      // Parse current end date and add the paused days
      const currentEndDate = DayCalculator.parseDate(clientData.endDate);
      if (currentEndDate && pausedDays > 0) {
        const newEndDate = DayCalculator.addDays(currentEndDate, pausedDays);
        const newEndDateString = DayCalculator.formatDate(newEndDate);

        // State transition: paused → active
        // Update endDate to reflect the extension due to pause
        await getFirestore().collection('clients').doc(clientId).update({
          status: 'active',
          pauseHistory: pauseHistory,
          endDate: newEndDateString, // Extend end date by paused days
          stoppedAt: null,
          stoppedReason: null,
        });
      } else {
        // If no paused days or invalid end date, just update status
        await getFirestore().collection('clients').doc(clientId).update({
          status: 'active',
          pauseHistory: pauseHistory,
          stoppedAt: null,
          stoppedReason: null,
        });
      }

      return {success: true};
    } catch (error) {
      console.error('Resume client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Renew client package - Only completed or stopped clients can be renewed
  async renewClient(clientId, newPackage) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();

      // Strict validation: ONLY completed or stopped clients can be renewed
      // Active/paused clients cannot be renewed (stop them first if needed)
      if (clientData.status !== 'completed' && clientData.status !== 'stopped') {
        const statusMessages = {
          'active': 'Cannot renew an active client. Please stop or wait for completion first.',
          'paused': 'Cannot renew a paused client. Please resume and complete or stop first.',
        };
        const message = statusMessages[clientData.status] || 'Only completed or stopped clients can be renewed';
        return {success: false, error: message};
      }

      // Validate new package duration
      if (!newPackage || newPackage <= 0) {
        return {success: false, error: 'Invalid package duration'};
      }

      const renewalHistory = clientData.renewalHistory || [];

      // Create renewal history entry
      const renewalEntry = {
        renewedAt: firestore.Timestamp.now(),
        previousPackage: clientData.package,
        previousStartDate: clientData.startDate,
        previousEndDate: clientData.endDate,
        renewedPackageDuration: newPackage,
        previousStatus: clientData.status,
      };

      // Add to renewal history
      renewalHistory.push(renewalEntry);

      // Calculate new dates
      const newStartDate = DayCalculator.formatDate(new Date());
      const newEndDate = DayCalculator.calculateEndDate(newStartDate, newPackage);

      // State transition: stopped/completed → active
      // Clear all lifecycle tracking fields for fresh start
      await getFirestore().collection('clients').doc(clientId).update({
        package: newPackage,
        startDate: newStartDate,
        endDate: newEndDate,
        status: 'active',
        pauseHistory: [], // Reset pause history for new package
        renewalHistory: renewalHistory,
        stoppedAt: null, // Clear stopped fields
        stoppedReason: null,
      });

      return {success: true, message: 'Client package renewed successfully'};
    } catch (error) {
      console.error('Renew client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Stop client package - Only active or paused clients can be stopped
  async stopClient(clientId, reason) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();

      // Strict validation: ONLY active or paused clients can be stopped
      // Completed/stopped clients cannot be stopped again
      if (clientData.status !== 'active' && clientData.status !== 'paused') {
        const statusMessages = {
          'completed': 'Cannot stop a completed client. It has already finished.',
          'stopped': 'Client is already stopped',
        };
        const message = statusMessages[clientData.status] || 'Only active or paused clients can be stopped';
        return {success: false, error: message};
      }

      const updateData = {
        status: 'stopped',
        stoppedAt: firestore.FieldValue.serverTimestamp(),
        stoppedReason: reason || '',
      };

      // If client is currently paused, close the open pause entry
      if (clientData.status === 'paused') {
        const pauseHistory = clientData.pauseHistory || [];

        if (pauseHistory.length > 0) {
          const lastPause = pauseHistory[pauseHistory.length - 1];

          // Close the pause entry if it's still open
          if (lastPause.resumedAt === null) {
            const pausedDays = DayCalculator.calculatePausedDays(lastPause.pausedAt, firestore.Timestamp.now());
            lastPause.resumedAt = firestore.Timestamp.now();
            lastPause.pausedDays = pausedDays;
            updateData.pauseHistory = pauseHistory;
          }
        }
      }

      await getFirestore().collection('clients').doc(clientId).update(updateData);

      return {success: true, message: 'Client package stopped'};
    } catch (error) {
      console.error('Stop client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Delete client
  async deleteClient(clientId) {
    try {
      await getFirestore().collection('clients').doc(clientId).delete();
      return {success: true};
    } catch (error) {
      console.error('Delete client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Search clients by name or mobile
  async searchClients(searchQuery) {
    try {
      const snapshot = await getFirestore()
        .collection('clients')
        .orderBy('createdAt', 'desc')
        .get();

      const clients = snapshot.docs
        .map(doc => ({id: doc.id, ...doc.data()}))
        .filter(client =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.mobile.includes(searchQuery)
        );

      return {success: true, clients};
    } catch (error) {
      console.error('Search clients error:', error);
      return {success: false, error: error.message};
    }
  }

  // Get clients by status
  async getClientsByStatus(status) {
    try {
      const snapshot = await getFirestore()
        .collection('clients')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();

      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {success: true, clients};
    } catch (error) {
      console.error('Get clients by status error:', error);
      return {success: false, error: error.message};
    }
  }

  // Get client counts (total, active, paused, completed, stopped)
  // For trainers: only count their assigned clients
  // For super admins: count all clients
  async getClientCounts(userId, isSuperAdmin) {
    try {
      let query = getFirestore().collection('clients');

      // If user is a trainer, filter by createdBy field
      if (!isSuperAdmin) {
        query = query.where('createdBy', '==', userId);
      }

      const snapshot = await query.get();

      let totalClients = 0;
      let activeClients = 0;
      let pausedClients = 0;
      let completedClients = 0;
      let stoppedClients = 0;

      snapshot.docs.forEach(doc => {
        const client = doc.data();
        totalClients++;

        if (client.status === 'active') {
          activeClients++;
        } else if (client.status === 'paused') {
          pausedClients++;
        } else if (client.status === 'completed') {
          completedClients++;
        } else if (client.status === 'stopped') {
          stoppedClients++;
        }
      });

      return {
        success: true,
        counts: {
          total: totalClients,
          active: activeClients,
          paused: pausedClients,
          completed: completedClients,
          stopped: stoppedClients,
        },
      };
    } catch (error) {
      console.error('Get client counts error:', error);
      return {success: false, error: error.message};
    }
  }

  // Check and update client status if package is completed
  async checkAndUpdateClientStatus(clientId) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();

      // Only check active clients (paused clients don't progress, so can't auto-complete)
      if (clientData.status !== 'active') {
        return {success: true, message: 'Status not applicable for update'};
      }

      // Use day calculator to check if completed
      const dayAnalysis = DayCalculator.getClientDayAnalysis(clientData);

      // If completed and currently active, update to completed
      if (dayAnalysis.isCompleted) {
        await getFirestore().collection('clients').doc(clientId).update({
          status: 'completed',
          // Clear stopped fields (completed is different from stopped)
          stoppedAt: null,
          stoppedReason: null,
        });
        return {success: true, message: 'Client marked as completed', updated: true};
      }

      return {success: true, message: 'No status update needed', updated: false};
    } catch (error) {
      console.error('Check client status error:', error);
      return {success: false, error: error.message};
    }
  }

  // Get clients by trainer ID
  async getClientsByTrainer(trainerId) {
    try {
      const snapshot = await getFirestore()
        .collection('clients')
        .where('createdBy', '==', trainerId)
        .get();

      // Sort by createdAt in memory (descending - newest first)
      const clients = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          // Handle cases where createdAt might not exist
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime; // Descending order
        });

      return {success: true, clients};
    } catch (error) {
      console.error('Get clients by trainer error:', error);
      return {success: false, error: error.message};
    }
  }

  // Recalculate and fix endDate for a client based on their pause history
  // This is useful for fixing existing clients whose endDate wasn't updated properly
  async recalculateClientEndDate(clientId) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();
      const {startDate, package: packageDays, pauseHistory = []} = clientData;

      // Calculate total paused days from pause history
      const totalPausedDays = DayCalculator.calculateTotalPausedDays(pauseHistory);

      // Calculate correct end date: start + package + pausedDays - 1
      const correctEndDate = DayCalculator.calculateExpectedEndDate(startDate, packageDays, totalPausedDays);

      // Update the end date if it's different from the stored one
      if (correctEndDate !== clientData.endDate) {
        await getFirestore().collection('clients').doc(clientId).update({
          endDate: correctEndDate,
        });

        return {
          success: true,
          message: 'End date recalculated successfully',
          oldEndDate: clientData.endDate,
          newEndDate: correctEndDate,
          pausedDays: totalPausedDays,
        };
      }

      return {
        success: true,
        message: 'End date is already correct',
        endDate: correctEndDate,
      };
    } catch (error) {
      console.error('Recalculate end date error:', error);
      return {success: false, error: error.message};
    }
  }
}

export default ClientService;
