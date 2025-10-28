import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import FloatingActionButton from '../components/FloatingActionButton';
import Dropdown from '../components/Dropdown';
import ClientFormModal from '../components/ClientFormModal';
import {StopModal, RenewalModal} from '../components';
import ClientService from '../services/clientService';
import AuthService from '../services/authService';
import {calculateBMI} from '../utils/bmiCalculator';
import * as DayCalculator from '../utils/dayCalculator';
import {STATUS_COLORS} from '../constants/formOptions';
import AddIcon from '../../assets/icons/addIcon';
import UserIcon from '../../assets/icons/userIcon';
import SearchIcon from '../../assets/icons/searchIcon';
import PauseIcon from '../../assets/icons/pauseIcon';
import PlayIcon from '../../assets/icons/playIcon';
import TrashIcon from '../../assets/icons/trashIcon';
import EditIcon from '../../assets/icons/editIcon';
import RenewalIcon from '../../assets/icons/renewalIcon';
import StopIcon from '../../assets/icons/stopIcon';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

const ClientCard = ({client, onPause, onResume, onDelete, onEdit, onRenew, onStop}) => {
  // Calculate BMI on demand
  const clientBMI = calculateBMI(client.startingWeight, client.height);

  // Get complete day analysis
  const dayAnalysis = DayCalculator.getClientDayAnalysis(client);
  const displayTexts = DayCalculator.getDayDisplayText(dayAnalysis);
  
  const handlePause = () => {
    Alert.alert(
      'Pause Client',
      `Are you sure you want to pause ${client.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Pause', style: 'destructive', onPress: () => onPause(client.id)}
      ]
    );
  };

  const handleResume = () => {
    Alert.alert(
      'Resume Client',
      `Are you sure you want to resume ${client.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Resume', style: 'default', onPress: () => onResume(client.id)}
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}? This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: () => onDelete(client.id)}
      ]
    );
  };

  const getStatusColor = () => {
    return STATUS_COLORS[client.status] || COLORS.brandTextSecondary;
  };
  
  return (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => console.log('View client:', client.name)}>
      <View style={styles.clientHeader}>
        {/* <View style={styles.clientAvatar}>
          <UserIcon width={24} height={24} stroke={COLORS.brandDarkest} />
        </View> */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {client.name}
          </Text>
          <View style={styles.clientStatus}>
            <View style={[styles.statusDot, {backgroundColor: getStatusColor()}]} />
            <Text style={styles.statusText}>
              {client.status}
            </Text>
          </View>
        </View>
        <View style={styles.clientActions}>
          <TouchableOpacity
            onPress={() => onEdit(client)}
            style={[styles.actionButton, styles.editButton]}>
            <EditIcon width={16} height={16} stroke={COLORS.brandDarkest} />
          </TouchableOpacity>

          {/* Pause/Resume button (for active/paused) */}
          {(client.status === 'active' || client.status === 'paused') && (
            <TouchableOpacity
              onPress={client.status === 'active' ? handlePause : handleResume}
              style={[styles.actionButton, styles.editButton]}>
              {client.status === 'active' ? (
                <PauseIcon width={16} height={16} fill={COLORS.brandDarkest}/>
              ) : (
                <PlayIcon width={16} height={16} fill={COLORS.brandDarkest} stroke={COLORS.brandDarkest} />
              )}
            </TouchableOpacity>
          )}

          {/* Renewal button (for completed/stopped) */}
          {(client.status === 'completed' || client.status === 'stopped') && (
            <TouchableOpacity
              onPress={() => onRenew(client)}
              style={[styles.actionButton, styles.editButton]}>
              <RenewalIcon width={16} height={16} stroke={COLORS.brandDarkest} />
            </TouchableOpacity>
          )}

          {/* Stop button (for active/paused) */}
          {(client.status === 'active' || client.status === 'paused') && (
            <TouchableOpacity
              onPress={() => onStop(client)}
              style={[styles.actionButton, styles.editButton]}>
              <StopIcon width={16} height={16} stroke="" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.actionButton, styles.editButton]}>
            <TrashIcon width={16} height={16} stroke={COLORS.brandDark} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Day Count Display */}
      <View style={styles.dayCountContainer}>
        <View style={styles.dayCountRow}>
          <Text style={styles.dayCountText}>
            {displayTexts.dayText}
          </Text>
          <Text style={styles.dayCountText}>
            {displayTexts.remainingText}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Package
          </Text>
          <Text style={styles.detailValue}>
            {client.package} days
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Training Mode
          </Text>
          <Text style={styles.detailValue}>
            {client.trainingMode}
          </Text>
        </View>
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Height
          </Text>
          <Text style={styles.detailValue}>
            {client.height} cm
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Weight
          </Text>
          <Text style={styles.detailValue}>
            {client.startingWeight} KG
          </Text>
        </View>
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Gender
          </Text>
          <Text style={styles.detailValue}>
            {client.gender}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Blood Group
          </Text>
          <Text style={styles.detailValue}>
            {client.bloodGroup}
          </Text>
        </View>
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Login Code
          </Text>
          <Text style={styles.detailValue}>
            {client.loginCode}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            BMI
          </Text>
          <Text style={styles.detailValue}>
            {clientBMI || 'N/A'}
          </Text>
        </View>
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Start Date
          </Text>
          <Text style={styles.detailValueSmall}>
            {client.startDate}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            End Date
          </Text>
          <Text style={styles.detailValueSmall}>
            {client.endDate}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ClientsScreen = () => {
  const {user, isSuperAdmin} = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); // Changed default from 'all' to 'active'
  const [filterTrainer, setFilterTrainer] = useState('all');
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedClient, setSelectedClient] = useState(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [clientToStop, setClientToStop] = useState(null);
  const [clientToRenew, setClientToRenew] = useState(null);

  // Create service instance for non-static methods
  const clientService = new ClientService();

  const statusOptions = [
    {label: 'All Status', value: 'all'},
    {label: 'Active', value: 'active'},
    {label: 'Paused', value: 'paused'},
    {label: 'Completed', value: 'completed'},
    {label: 'Stopped', value: 'stopped'},
  ];

  // Load trainers list (only for super admins)
  const loadTrainers = async () => {
    if (!isSuperAdmin()) return;

    try {
      const result = await AuthService.getAllTrainers();
      if (result.success) {
        setTrainers(result.trainers);
      }
    } catch (error) {
      console.error('Load trainers error:', error);
    }
  };

  // Load clients from Firebase
  const loadClients = async () => {
    try {
      setLoading(true);
      let result;

      // For non-admins (trainers), only load their own clients
      if (!isSuperAdmin()) {
        result = await clientService.getClientsByTrainer(user?.uid);
      } else {
        result = await clientService.getAllClients();
      }

      if (result.success) {
        setClients(result.clients);
        setFilteredClients(result.clients);

        // Background task: Check and update status for active/paused clients
        // This runs after clients are displayed, so it doesn't block UI
        checkClientStatuses(result.clients);
      } else {
        console.error('Failed to load clients:', result.error);
      }
    } catch (error) {
      console.error('Load clients error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Background task to check and update client statuses
  const checkClientStatuses = async (clientsList) => {
    try {
      let statusUpdated = false;

      // Check each active or paused client
      for (const client of clientsList) {
        if (client.status === 'active' || client.status === 'paused') {
          const result = await clientService.checkAndUpdateClientStatus(client.id);
          if (result.success && result.updated) {
            statusUpdated = true;
          }
        }
      }

      // If any status was updated, silently refresh the list
      if (statusUpdated) {
        let result;
        if (!isSuperAdmin()) {
          result = await clientService.getClientsByTrainer(user?.uid);
        } else {
          result = await clientService.getAllClients();
        }

        if (result.success) {
          setClients(result.clients);
          setFilteredClients(result.clients);
        }
      }
    } catch (error) {
      console.error('Check client statuses error:', error);
      // Silently fail - don't show error to user
    }
  };

  // Filter clients based on search, status, and trainer
  const filterClients = () => {
    let filtered = clients;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.mobile.includes(searchQuery) ||
        client.loginCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => client.status === filterStatus);
    }

    // Filter by trainer (only for super admins)
    if (isSuperAdmin() && filterTrainer !== 'all') {
      filtered = filtered.filter(client => client.createdBy === filterTrainer);
    }

    setFilteredClients(filtered);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  // Handle client added or updated
  const handleClientAdded = () => {
    loadClients();
  };

  // Handle edit client
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setModalMode('edit');
    setShowModal(true);
  };

  // Handle add client
  const handleAddClient = () => {
    setSelectedClient(null);
    setModalMode('add');
    setShowModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setSelectedClient(null);
    setModalMode('add');
  };

  // Handle pause client
  const handlePauseClient = async (clientId) => {
    try {
      const result = await clientService.pauseClient(clientId);
      if (result.success) {
        Alert.alert('Success', 'Client paused successfully');
        loadClients();
      } else {
        Alert.alert('Error', result.error || 'Failed to pause client');
      }
    } catch (error) {
      console.error('Pause client error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Handle resume client
  const handleResumeClient = async (clientId) => {
    try {
      const result = await clientService.resumeClient(clientId);
      if (result.success) {
        Alert.alert('Success', 'Client resumed successfully');
        loadClients();
      } else {
        Alert.alert('Error', result.error || 'Failed to resume client');
      }
    } catch (error) {
      console.error('Resume client error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Handle delete client
  const handleDeleteClient = async (clientId) => {
    try {
      const result = await clientService.deleteClient(clientId);
      if (result.success) {
        Alert.alert('Success', 'Client deleted successfully');
        loadClients();
      } else {
        Alert.alert('Error', result.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Delete client error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Handle stop client
  const handleStopClient = (client) => {
    setClientToStop(client);
    setShowStopModal(true);
  };

  const confirmStopClient = async (reason) => {
    if (!clientToStop) return;

    try {
      const result = await clientService.stopClient(clientToStop.id, reason);
      if (result.success) {
        Alert.alert('Success', 'Client package stopped successfully');
        setShowStopModal(false);
        setClientToStop(null);
        loadClients();
      } else {
        Alert.alert('Error', result.error || 'Failed to stop client');
      }
    } catch (error) {
      console.error('Stop client error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Handle renew client
  const handleRenewClient = (client) => {
    setClientToRenew(client);
    setShowRenewalModal(true);
  };

  const confirmRenewClient = async (newPackage) => {
    if (!clientToRenew) return;

    try {
      const result = await clientService.renewClient(clientToRenew.id, newPackage);
      if (result.success) {
        Alert.alert('Success', 'Client package renewed successfully');
        setShowRenewalModal(false);
        setClientToRenew(null);
        loadClients();
      } else {
        Alert.alert('Error', result.error || 'Failed to renew client');
      }
    } catch (error) {
      console.error('Renew client error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Load clients and trainers on component mount
  useEffect(() => {
    loadClients();
    loadTrainers();
  }, []);

  // Filter clients when search query, status, or trainer filter changes
  useEffect(() => {
    filterClients();
  }, [searchQuery, filterStatus, filterTrainer, clients]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {/* Header */}
        <Header title="Clients" />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search clients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<SearchIcon width={20} height={20} stroke={COLORS.brandTextSecondary} />}
            variant="search"
          />
        </View>

        {/* Filters */}
        {isSuperAdmin() ? (
          // Super Admin: 2-column grid layout
          <View style={styles.filtersRow}>
            <View style={styles.filterHalf}>
              <Dropdown
                label="Filter By Status"
                value={filterStatus}
                onValueChange={setFilterStatus}
                items={statusOptions}
                placeholder="Select status"
                searchable={true}
                searchPlaceholder="Search status..."
              />
            </View>
            <View style={styles.filterHalf}>
              <Dropdown
                label="Filter By Trainer"
                value={filterTrainer}
                onValueChange={setFilterTrainer}
                items={[
                  {label: 'All Trainers', value: 'all'},
                  ...trainers.map(trainer => ({
                    label: trainer.name,
                    value: trainer.uid,
                  })),
                ]}
                placeholder="Select trainer"
                searchable={true}
                searchPlaceholder="Search trainer..."
              />
            </View>
          </View>
        ) : (
          // Trainer: Full width layout
          <View style={styles.filterContainer}>
            <Dropdown
              label="Filter By Status"
              value={filterStatus}
              onValueChange={setFilterStatus}
              items={statusOptions}
              placeholder="Select status"
              searchable={true}
              searchPlaceholder="Search status..."
            />
          </View>
        )}

        {/* Client List */}
        <Text style={styles.listTitle}>
          All Clients ({filteredClients.length})
        </Text>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {loading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Loading clients...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery || filterStatus !== 'all' 
                  ? 'No clients found matching your criteria' 
                  : 'No clients found. Add your first client!'}
              </Text>
            </View>
          ) : (
            filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onPause={handlePauseClient}
                onResume={handleResumeClient}
                onDelete={handleDeleteClient}
                onEdit={handleEditClient}
                onRenew={handleRenewClient}
                onStop={handleStopClient}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<AddIcon width={24} height={24} fill={COLORS.brandDarkest} />}
        onPress={handleAddClient}
        backgroundColor={COLORS.brandPrimary}
      />

      {/* Client Form Modal (Add/Edit) */}
      <ClientFormModal
        visible={showModal}
        onClose={handleModalClose}
        onClientAdded={handleClientAdded}
        client={selectedClient}
        mode={modalMode}
      />

      {/* Stop Modal */}
      <StopModal
        visible={showStopModal}
        onClose={() => {
          setShowStopModal(false);
          setClientToStop(null);
        }}
        onConfirm={confirmStopClient}
        clientName={clientToStop?.name}
      />

      {/* Renewal Modal */}
      <RenewalModal
        visible={showRenewalModal}
        onClose={() => {
          setShowRenewalModal(false);
          setClientToRenew(null);
        }}
        onConfirm={confirmRenewClient}
        client={clientToRenew}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    flex: 1,
    paddingTop: 8,
  },
  searchContainer: {
    marginBottom: 24,
  },
  filterContainer: {
    marginBottom: 24,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  filterHalf: {
    flex: 1,
  },
  listTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginBottom: 16,
    color: COLORS.brandDarkest,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: COLORS.gray500,
    fontFamily: FONTS.regular,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: COLORS.gray500,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  clientCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: COLORS.brandPrimary,
  },
  clientInfo: {
    flex: 1,
    marginLeft: 5
  },
  clientName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
    color: COLORS.brandDarkest,
  },
  clientStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    textTransform: 'capitalize',
  },
  clientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  editButton: {
    backgroundColor: COLORS.brandPrimary,
  },
  dayCountContainer: {
    backgroundColor: COLORS.brandPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginBottom: 12,
  },
  dayCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCountText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.brandDarkest,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginBottom: 4,
    color: COLORS.brandTextLight,
  },
  detailValue: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
  detailValueSmall: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
  },
});

export default ClientsScreen;
