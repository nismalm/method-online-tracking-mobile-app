import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import AuthService from '../services/authService';
import {useAuth} from '../context/AuthContext';
import Header from '../components/Header';
import AddTrainerModal from '../components/AddTrainerModal';
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
  const {userProfile, isSuperAdmin} = useAuth();
  const [trainersCount, setTrainersCount] = useState(0);
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);

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

  // Check if user is SuperAdmin (memoized to prevent re-computation)
  const isAdmin = useCallback(() => isSuperAdmin(), [isSuperAdmin]);

  // Refresh data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only fetch trainers count if user is SuperAdmin
      if (isAdmin()) {
        fetchTrainersCount();
      }
    }, [isAdmin, fetchTrainersCount])
  );

  // Handler when trainer is added (memoized)
  const handleTrainerAdded = useCallback(() => {
    fetchTrainersCount(); // Refresh the count
  }, [fetchTrainersCount]);

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
            <StatCard title="Total Clients" value="45" IconComponent={ClientsIcon} />
            <StatCard title="Trainers" value={trainersCount.toString()} IconComponent={TrainerIcon} />
          </View>
          <View style={[styles.statsRow, styles.statsRowLast]}>
            <StatCard title="Active Clients" value="38" IconComponent={LiveIcon} />
            <StatCard title="Paused Clients" value="7" IconComponent={PauseIcon} />
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>

          <View style={styles.quickActionsRow}>
            <QuickActionCard
              IconComponent={AddIcon}
              label="Add Client"
              onPress={() => console.log('Add Client')}
            />
            <View style={styles.quickActionSpacer} />
            <QuickActionCard
              IconComponent={AddIcon}
              label="Add Trainer"
              onPress={() => setShowAddTrainerModal(true)}
            />
          </View>

          <QuickActionCard
            IconComponent={AddIcon}
            label="Diet Chart Generator"
            onPress={() => console.log('Diet Chart Generator')}
            fullWidth={true}
          />
        </View>
      </ScrollView>

      {/* Add Trainer Modal */}
      <AddTrainerModal
        visible={showAddTrainerModal}
        onClose={() => setShowAddTrainerModal(false)}
        onTrainerAdded={handleTrainerAdded}
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
