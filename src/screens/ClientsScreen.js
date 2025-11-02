import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import FloatingActionButton from '../components/FloatingActionButton';
import Dropdown from '../components/Dropdown';
import ClientFormModal from '../components/ClientFormModal';
import ClientService from '../services/clientService';
import AuthService from '../services/authService';
import * as DayCalculator from '../utils/dayCalculator';
import {STATUS_COLORS} from '../constants/formOptions';
import AddIcon from '../../assets/icons/addIcon';
import SearchIcon from '../../assets/icons/searchIcon';
import ChevronRightIcon from '../../assets/icons/chevronRightIcon';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

/**
 * SIMPLE CLIENT CARD - Shows only Name, Status, and Day Count
 * Taps navigate to detail screen
 */
const ClientCard = ({client, onPress}) => {
  // Get complete day analysis
  const dayAnalysis = DayCalculator.getClientDayAnalysis(client);
  const displayTexts = DayCalculator.getDayDisplayText(dayAnalysis);

  const getStatusColor = () => {
    return STATUS_COLORS[client.status] || COLORS.brandTextSecondary;
  };

  return (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.clientHeader}>
        {/* Left: Name and Status */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName} numberOfLines={1}>
            {client.name}
          </Text>
          <View style={styles.clientStatus}>
            <View style={[styles.statusDot, {backgroundColor: getStatusColor()}]} />
            <Text style={styles.statusText}>{client.status}</Text>
          </View>
        </View>
        {/* Right: Day Count Display */}
        <View style={styles.dayCountSection}>
          <Text style={styles.dayCountText} numberOfLines={1}>
            {displayTexts.dayText}
          </Text>
          <Text style={styles.dayCountSubtext} numberOfLines={1}>
            {displayTexts.remainingText}
          </Text>
        </View>

        {/* Chevron Icon */}
        <View style={styles.chevronContainer}>
          <ChevronRightIcon width={20} height={20} stroke={COLORS.brandTextSecondary} />
        </View>
      </View>

      {/* Paused Date - Only show if client is paused */}
      {/* {client.status === 'paused' && client.pauseHistory && client.pauseHistory.length > 0 && (
        <View style={styles.pausedDateContainer}>
          <Text style={styles.pausedDateText}>
            Paused on:{' '}
            {(() => {
              const lastPause = client.pauseHistory[client.pauseHistory.length - 1];
              if (lastPause && lastPause.pausedAt) {
                const pausedDate = lastPause.pausedAt.toDate ? lastPause.pausedAt.toDate() : new Date(lastPause.pausedAt);
                return pausedDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
              }
              return 'N/A';
            })()}
          </Text>
        </View>
      )} */}
    </TouchableOpacity>
  );
};

const ClientsScreen = ({navigation}) => {
  const {user, isSuperAdmin} = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); // Changed default from 'all' to 'active'
  const [filterTrainer, setFilterTrainer] = useState('myClients'); // Default to 'myClients' for super admins
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Create service instance for non-static methods
  const clientService = useMemo(() => new ClientService(), []);

  const statusOptions = [
    {label: 'All Status', value: 'all'},
    {label: 'Active', value: 'active'},
    {label: 'Paused', value: 'paused'},
    {label: 'Completed', value: 'completed'},
    {label: 'Stopped', value: 'stopped'},
  ];

  // Load trainers list (only for super admins)
  const loadTrainers = useCallback(async () => {
    if (!isSuperAdmin()) {
      return;
    }

    try {
      const result = await AuthService.getAllTrainers();
      if (result.success) {
        setTrainers(result.trainers);
      }
    } catch (error) {
      console.error('Load trainers error:', error);
    }
  }, [isSuperAdmin]);

  // Load clients from Firebase
  const loadClients = useCallback(async () => {
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
  }, [isSuperAdmin, user?.uid, clientService, checkClientStatuses]);

  // Background task to check and update client statuses
  const checkClientStatuses = useCallback(async (clientsList) => {
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
  }, [clientService, isSuperAdmin, user?.uid]);

  // Filter clients based on search, status, and trainer
  const filterClients = useCallback(() => {
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
    if (isSuperAdmin()) {
      if (filterTrainer === 'myClients') {
        // Show only clients created by the current super admin
        filtered = filtered.filter(client => client.createdBy === user?.uid);
      } else if (filterTrainer !== 'all') {
        // Show clients created by a specific trainer
        filtered = filtered.filter(client => client.createdBy === filterTrainer);
      }
      // If 'all', don't filter by trainer (show all clients)
    }

    setFilteredClients(filtered);
  }, [clients, searchQuery, filterStatus, filterTrainer, isSuperAdmin, user?.uid]);

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

  // Handle add client
  const handleAddClient = () => {
    setShowModal(true);
  };

  // Load clients and trainers when screen comes into focus
  // This ensures data is refreshed when navigating back from detail screen
  useFocusEffect(
    useCallback(() => {
      loadClients();
      loadTrainers();
    }, [loadClients, loadTrainers])
  );

  // Filter clients when search query, status, or trainer filter changes
  useEffect(() => {
    filterClients();
  }, [filterClients]);

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
                  {label: 'My Clients', value: 'myClients'},
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
                onPress={() => navigation.navigate('ClientDetail', {clientId: client.id})}
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
        onClose={() => setShowModal(false)}
        onClientAdded={handleClientAdded}
        mode="add"
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
    borderRadius: BORDER_RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  // 👇 Shadow for Android
  elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginBottom: 6,
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
    marginRight: 6,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.brandTextSecondary,
    textTransform: 'capitalize',
  },
  dayCountSection: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  dayCountText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDark,
    marginBottom: 2,
  },
  dayCountSubtext: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDark,
  },
  chevronContainer: {
    paddingLeft: 4,
  },
  pausedDateContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.brandBorder,
  },
  pausedDateText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
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
