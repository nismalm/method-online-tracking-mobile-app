import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import * as AuthService from '../services/authService';
import * as ClientService from '../services/clientService';
import {useAuth} from '../context/AuthContext';
import Header from '../components/Header';
import AddTrainerModal from '../components/AddTrainerModal';
import ClientFormModal from '../components/ClientFormModal';
import AddIcon from '../../assets/icons/addIcon';
import ClientsIcon from '../../assets/icons/clientsIcon';
import TrainerIcon from '../../assets/icons/trainerIcon';
import LiveIcon from '../../assets/icons/liveIcon';
import PauseIcon from '../../assets/icons/pauseIcon';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

// Memoized to prevent unnecessary re-renders
const StatCard = React.memo(({title, value, IconComponent}) => (
  <View style={styles.statCard}>
    <View style={styles.statCardContent}>
      <View style={styles.statCardTextContainer}>
        <Text style={styles.statValue}>
          {value}
        </Text>
        <Text style={styles.statTitle}>
          {title}
        </Text>
      </View>
      <View style={styles.statIconContainer}>
        <IconComponent width={32} height={32} fill="#1E293B" />
      </View>
    </View>
  </View>
));

// Memoized to prevent unnecessary re-renders
const QuickActionCard = React.memo(({IconComponent, label, onPress, fullWidth = false}) => (
  <TouchableOpacity
    style={[styles.quickActionCard, fullWidth && styles.quickActionCardFull]}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={styles.quickActionContent}>
      <View style={styles.quickActionIcon}>
        <IconComponent width={24} height={24} fill={COLORS.white} stroke={COLORS.white} />
      </View>
      <Text style={styles.quickActionLabel}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
));

const HomeScreen = () => {
  const {user, userProfile, isSuperAdmin} = useAuth();
  const [trainersCount, setTrainersCount] = useState(0);
  const [clientCounts, setClientCounts] = useState({
    total: 0,
    active: 0,
    paused: 0,
  });
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Fetch trainers count (memoized)
  const fetchTrainersCount = useCallback(async () => {
    try {
      const result = await AuthService.getAllTrainers();
      if (result.success) {
        setTrainersCount(result.trainers.length);
      }
    } catch (error) {
      console.error('Error fetching trainers count:', error);
    }
  }, []);

  // Fetch client counts (memoized)
  const fetchClientCounts = useCallback(async () => {
    try {
      if (!user?.uid) {
        return;
      }

      // First get all clients to check statuses
      let clientsResult;
      if (isAdmin()) {
        clientsResult = await ClientService.getAllClients();
      } else {
        clientsResult = await ClientService.getClientsByTrainer(user.uid);
      }

      // Background check and update statuses
      // Only check active clients (paused clients don't progress, so can't auto-complete)
      if (clientsResult.success) {
        // First, recalculate endDates for all clients with pause history
        // This fixes existing clients whose endDate wasn't updated properly
        for (const client of clientsResult.clients) {
          if (client.pauseHistory && client.pauseHistory.length > 0) {
            await ClientService.recalculateClientEndDate(client.id);
          }
        }

        // Then check only active clients for completion
        for (const client of clientsResult.clients) {
          if (client.status === 'active') {
            await ClientService.checkAndUpdateClientStatus(client.id);
          }
        }
      }

      // Now fetch counts (will include any updated statuses)
      const result = await ClientService.getClientCounts(user.uid, isAdmin());

      if (result.success) {
        setClientCounts(result.counts);
      }
    } catch (error) {
      console.error('Error fetching client counts:', error);
    }
  }, [user?.uid, isAdmin]);

  // Check if user is SuperAdmin (memoized to prevent re-computation)
  const isAdmin = useCallback(() => isSuperAdmin(), [isSuperAdmin]);

  // Refresh data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Fetch client counts for all users
      fetchClientCounts();

      // Only fetch trainers count if user is SuperAdmin
      if (isAdmin()) {
        fetchTrainersCount();
      }
    }, [isAdmin, fetchTrainersCount, fetchClientCounts])
  );

  // Handler when trainer is added (memoized)
  const handleTrainerAdded = useCallback(() => {
    fetchTrainersCount(); // Refresh the count
  }, [fetchTrainersCount]);

  // Handler when client is added (memoized)
  const handleClientAdded = useCallback(() => {
    fetchClientCounts(); // Refresh the counts
  }, [fetchClientCounts]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <Header
            subtitle="Welcome back,"
            title={userProfile?.name || 'Trainer'}
          />

          {/* Stats Section */}
          <Text style={styles.sectionTitle}>
            Overview
          </Text>
          <View style={styles.statsRow}>
            <StatCard title="Total Clients" value={clientCounts.total.toString()} IconComponent={ClientsIcon} />
            {isAdmin() && (
              <StatCard title="Trainers" value={trainersCount.toString()} IconComponent={TrainerIcon} />
            )}
          </View>
          <View style={[styles.statsRow, styles.statsRowLast]}>
            <StatCard title="Active Clients" value={clientCounts.active.toString()} IconComponent={LiveIcon} />
            <StatCard title="Paused Clients" value={clientCounts.paused.toString()} IconComponent={PauseIcon} />
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>

          {isAdmin() ? (
            <View style={styles.quickActionsRow}>
              <QuickActionCard
                IconComponent={AddIcon}
                label="Add Client"
                onPress={() => setShowAddClientModal(true)}
              />
              <View style={styles.quickActionSpacer} />
              <QuickActionCard
                IconComponent={AddIcon}
                label="Add Trainer"
                onPress={() => setShowAddTrainerModal(true)}
              />
            </View>
          ) : (
            <QuickActionCard
              IconComponent={AddIcon}
              label="Add Client"
              onPress={() => setShowAddClientModal(true)}
              fullWidth={true}
            />
          )}

          {isAdmin() && (
            <QuickActionCard
              IconComponent={AddIcon}
              label="Diet Chart Generator"
              onPress={() => console.log('Diet Chart Generator')}
              fullWidth={true}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Trainer Modal - Only for SuperAdmin */}
      {isAdmin() && (
        <AddTrainerModal
          visible={showAddTrainerModal}
          onClose={() => setShowAddTrainerModal(false)}
          onTrainerAdded={handleTrainerAdded}
        />
      )}

      {/* Add Client Modal - For all users */}
      <ClientFormModal
        visible={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginBottom: 16,
    color: COLORS.brandDarkest,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statsRowLast: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statCardTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES['4xl'],
    fontFamily: FONTS.bold,
    marginBottom: 8,
    color: COLORS.brandDark,
  },
  statTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
  statIconContainer: {
    marginLeft: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quickActionSpacer: {
    width: 12,
  },
  quickActionCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    marginBottom: 12,
    backgroundColor: COLORS.brandPrimary,
    flex: 1,
  },
  quickActionCardFull: {
    width: '100%',
    flex: undefined,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: COLORS.brandDarkest,
  },
  quickActionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.base,
    flex: 1,
    color: COLORS.brandDark,
  },
});

export default HomeScreen;
