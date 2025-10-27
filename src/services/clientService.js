import firestore, {getFirestore} from '@react-native-firebase/firestore';
import {getCompleteBMIAnalysis} from '../utils/bmiCalculator';

class ClientService {
  // Generate unique login code for client
  generateLoginCode() {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `METHOD${randomDigits}`;
  }

  // Calculate end date based on start date and package duration
  calculateEndDate(startDate, packageDuration) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + packageDuration);
    
    // Format as DD/MM/YYYY
    const day = String(end.getDate()).padStart(2, '0');
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const year = end.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  // Parse date from DD/MM/YYYY format
  static parseDate(dateString) {
    if (!dateString) return null;
    
    // Handle DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    
    // Fallback to direct parsing
    return new Date(dateString);
  }

  // Calculate days remaining based on start date, package duration, and current status
  static calculateDaysRemaining(startDate, packageDuration, status) {
    if (status === 'paused') {
      return 'Paused';
    }
    
    const start = ClientService.parseDate(startDate);
    if (!start || isNaN(start.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + packageDuration);
    
    // If package has ended
    if (now > endDate) {
      return 'Completed';
    }
    
    // Calculate days remaining
    const timeDiff = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysRemaining);
  }

  // Calculate days used from start date
  static calculateDaysUsed(startDate, status) {
    if (status === 'paused') {
      return 'Paused';
    }
    
    const start = ClientService.parseDate(startDate);
    if (!start || isNaN(start.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    const timeDiff = now.getTime() - start.getTime();
    const daysUsed = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysUsed);
  }

  // Format current date as DD/MM/YYYY
  formatCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  // Create a new client
  async createClient(clientData, createdByUsername, customStartDate = null) {
    try {
      // Debug logging
      console.log('Creating client with data:', clientData);
      console.log('Created by:', createdByUsername);
      console.log('Custom start date:', customStartDate);

      // Validate required fields
      if (!clientData.name || !clientData.mobile || !clientData.age || 
          !clientData.gender || !clientData.bloodGroup || !clientData.height || 
          !clientData.startingWeight || !clientData.package || !clientData.trainingMode) {
        throw new Error('Missing required fields');
      }

      const loginCode = this.generateLoginCode();
      const startDate = customStartDate || this.formatCurrentDate();
      const packageDuration = this.getPackageDuration(clientData.package);
      const endDate = this.calculateEndDate(customStartDate ? new Date(customStartDate.split('/').reverse().join('-')) : new Date(), packageDuration);

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
        height: height, // Store as number without "cm"
        startingWeight: weight, // Store as number without "KG"
        package: parseInt(clientData.package, 10), // Store as number (30, 60, 90, 180)
        trainingMode: clientData.trainingMode.trim(),
        loginCode: loginCode,
        status: 'active',
        createdAt: firestore.FieldValue.serverTimestamp(),
        createdBy: createdByUsername, // Store UID instead of name
        startDate: startDate,
        endDate: endDate,
        // BMI data NOT stored in database - calculated on demand
      };

      console.log('Client document to be saved:', clientDoc);

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

  // Get package duration in days
  getPackageDuration(packageType) {
    // Package type is now stored as just the number (e.g., "30", "60", "90", "180")
    return parseInt(packageType, 10) || 30;
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
      await getFirestore().collection('clients').doc(clientId).update({
        status: 'paused',
        pausedAt: firestore.FieldValue.serverTimestamp(),
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
      await getFirestore().collection('clients').doc(clientId).update({
        status: 'active',
        resumedAt: firestore.FieldValue.serverTimestamp(),
      });
      return {success: true};
    } catch (error) {
      console.error('Resume client error:', error);
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
}

export default ClientService;
