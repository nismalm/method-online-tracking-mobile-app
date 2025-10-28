import firestore, {getFirestore} from '@react-native-firebase/firestore';
import {getCompleteBMIAnalysis} from '../utils/bmiCalculator';
import * as DayCalculator from '../utils/dayCalculator';

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
  async updateClientStatus(clientId, status) {
    try {
      await getFirestore().collection('clients').doc(clientId).update({
        status: status,
      });
      return {success: true};
    } catch (error) {
      console.error('Update client status error:', error);
      return {success: false, error: error.message};
    }
  }

  // Pause client
  async pauseClient(clientId) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();
      const pauseHistory = clientData.pauseHistory || [];

      // Create pause entry with current timestamp
      const pauseEntry = {
        pausedAt: firestore.Timestamp.now(),
        resumedAt: null,
        pausedDays: 0,
      };

      // Add to history array
      pauseHistory.push(pauseEntry);

      await getFirestore().collection('clients').doc(clientId).update({
        status: 'paused',
        pauseHistory: pauseHistory,
      });

      return {success: true};
    } catch (error) {
      console.error('Pause client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Resume client
  async resumeClient(clientId) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();
      const pauseHistory = clientData.pauseHistory || [];

      if (pauseHistory.length === 0) {
        return {success: false, error: 'No pause record found'};
      }

      // Get the last pause entry
      const lastPauseIndex = pauseHistory.length - 1;
      const lastPause = pauseHistory[lastPauseIndex];

      if (lastPause.resumedAt !== null) {
        return {success: false, error: 'Client is not paused'};
      }

      // Calculate paused days
      const pausedDays = DayCalculator.calculatePausedDays(lastPause.pausedAt, new Date());

      // Update the last pause entry
      lastPause.resumedAt = firestore.Timestamp.now();
      lastPause.pausedDays = pausedDays;

      // Update the entire pause history array
      await getFirestore().collection('clients').doc(clientId).update({
        status: 'active',
        pauseHistory: pauseHistory,
      });

      return {success: true};
    } catch (error) {
      console.error('Resume client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Renew client package
  async renewClient(clientId, newPackage) {
    try {
      const clientDoc = await getFirestore().collection('clients').doc(clientId).get();

      if (!clientDoc.exists) {
        return {success: false, error: 'Client not found'};
      }

      const clientData = clientDoc.data();
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

      // Update client with new package
      await getFirestore().collection('clients').doc(clientId).update({
        package: newPackage,
        startDate: newStartDate,
        endDate: newEndDate,
        status: 'active',
        pauseHistory: [], // Reset pause history for new package
        renewalHistory: renewalHistory,
      });

      return {success: true, message: 'Client package renewed successfully'};
    } catch (error) {
      console.error('Renew client error:', error);
      return {success: false, error: error.message};
    }
  }

  // Stop client package
  async stopClient(clientId, reason) {
    try {
      await getFirestore().collection('clients').doc(clientId).update({
        status: 'stopped',
        stoppedAt: firestore.FieldValue.serverTimestamp(),
        stoppedReason: reason || '',
      });

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

      // Only check active or paused clients (don't touch stopped/completed manually)
      if (clientData.status !== 'active' && clientData.status !== 'paused') {
        return {success: true, message: 'Status not applicable for update'};
      }

      // Use day calculator to check if completed
      const dayAnalysis = DayCalculator.getClientDayAnalysis(clientData);

      // If completed and currently active/paused, update to completed
      if (dayAnalysis.isCompleted && clientData.status !== 'completed') {
        await getFirestore().collection('clients').doc(clientId).update({
          status: 'completed',
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
}

export default ClientService;
