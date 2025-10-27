import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import FloatingActionButton from '../components/FloatingActionButton';
import Dropdown from '../components/Dropdown';
import ClientFormModal from '../components/ClientFormModal';
import ClientService from '../services/clientService';
import {calculateBMI} from '../utils/bmiCalculator';
import AddIcon from '../../assets/icons/addIcon';
import UserIcon from '../../assets/icons/userIcon';
import SearchIcon from '../../assets/icons/searchIcon';
import PauseIcon from '../../assets/icons/pauseIcon';
import PlayIcon from '../../assets/icons/playIcon';
import TrashIcon from '../../assets/icons/trashIcon';
import EditIcon from '../../assets/icons/editIcon';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

const ClientCard = ({client, onPause, onResume, onDelete, onEdit}) => {
  // Calculate BMI on demand
  const clientBMI = calculateBMI(client.startingWeight, client.height);
  
  // Calculate day count using static methods
  const daysUsed = ClientService.calculateDaysUsed(client.startDate, client.status);
  const daysRemaining = ClientService.calculateDaysRemaining(client.startDate, client.package, client.status);
  
  // Fallback for invalid dates
  const displayDaysUsed = (typeof daysUsed === 'number' && !isNaN(daysUsed)) ? daysUsed : 'N/A';
  const displayDaysRemaining = (typeof daysRemaining === 'number' && !isNaN(daysRemaining)) ? daysRemaining : daysRemaining;
  
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
    if (client.status === 'active') return COLORS.brandSecondary;
    if (client.status === 'paused') return '#EAB308';
    return COLORS.brandTextSecondary;
  };
  
  return (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => console.log('View client:', client.name)}>
      <View style={styles.clientHeader}>
        <View style={styles.clientAvatar}>
          <UserIcon width={24} height={24} stroke={COLORS.brandDarkest} />
        </View>
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
            <EditIcon width={16} height={16} stroke="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={client.status === 'active' ? handlePause : handleResume}
            style={[styles.actionButton, styles.pauseButton]}>
            {client.status === 'active' ? (
              <PauseIcon width={16} height={16} fill="#F59E0B" />
            ) : (
              <PlayIcon width={16} height={16} stroke="#10B981" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.actionButton, styles.deleteButton]}>
            <TrashIcon width={16} height={16} stroke="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Day Count Display */}
      <View style={styles.dayCountContainer}>
        <View style={styles.dayCountRow}>
          <Text style={styles.dayCountText}>
            Day: {displayDaysUsed}
          </Text>
          <Text style={styles.dayCountText}>
            Remaining: {displayDaysRemaining}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedClient, setSelectedClient] = useState(null);

  // Create service instance for non-static methods
  const clientService = new ClientService();

  const statusOptions = [
    {label: 'All Status', value: 'all'},
    {label: 'Active', value: 'active'},
    {label: 'Paused', value: 'paused'},
    {label: 'Completed', value: 'completed'},
    {label: 'Renewed', value: 'renewed'},
  ];

  // Load clients from Firebase
  const loadClients = async () => {
    try {
      setLoading(true);
      const result = await clientService.getAllClients();
      
      if (result.success) {
        setClients(result.clients);
        setFilteredClients(result.clients);
      } else {
        console.error('Failed to load clients:', result.error);
      }
    } catch (error) {
      console.error('Load clients error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter clients based on search and status
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

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients when search query or status changes
  useEffect(() => {
    filterClients();
  }, [searchQuery, filterStatus, clients]);

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
    backgroundColor: '#DBEAFE',
  },
  pauseButton: {
    backgroundColor: COLORS.gray100,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  dayCountContainer: {
    backgroundColor: '#EFF6FF',
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
    color: '#1E3A8A',
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
