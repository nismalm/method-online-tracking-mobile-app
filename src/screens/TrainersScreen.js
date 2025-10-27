import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import FloatingActionButton from '../components/FloatingActionButton';
import AddTrainerModal from '../components/AddTrainerModal';
import EditTrainerModal from '../components/EditTrainerModal';
import AddIcon from '../../assets/icons/addIcon';
import PhoneIcon from '../../assets/icons/phoneIcon';
import CalendarIcon from '../../assets/icons/calendarIcon';
import SearchIcon from '../../assets/icons/searchIcon';
import UserSearchIcon from '../../assets/icons/userSearchIcon';
import AuthService from '../services/authService';
import {useAuth} from '../context/AuthContext';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

// Memoized trainer card to prevent unnecessary re-renders
const TrainerCard = React.memo(({trainer, onPress}) => {
  const statusColor = trainer.status === 'active' ? COLORS.brandSecondary : '#FEE2E2';
  const statusTextColor = trainer.status === 'active' ? COLORS.brandDark : '#991B1B';

  return (
    <TouchableOpacity
      style={styles.trainerCard}
      onPress={() => onPress(trainer)}
      activeOpacity={0.7}>
      <View style={styles.trainerCardHeader}>
        <View style={styles.trainerInfo}>
          <Text style={styles.trainerName}>
            {trainer.name}
          </Text>
          <Text style={styles.trainerEmail}>
            {trainer.email}
          </Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
          <Text style={[styles.statusText, {color: statusTextColor}]}>
            {trainer.status}
          </Text>
        </View>
      </View>
      <View style={styles.trainerPhone}>
        <PhoneIcon width={16} height={16} stroke={COLORS.brandTextSecondary} />
        <Text style={styles.trainerPhoneText}>
          {trainer.mobile}
        </Text>
      </View>
      {trainer.createdAt && (
        <View style={styles.trainerDate}>
          <CalendarIcon width={16} height={16} stroke={COLORS.brandTextSecondary} />
          <Text style={styles.trainerDateText}>
            Added {new Date(trainer.createdAt.toDate()).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const TrainersScreen = () => {
  const {isSuperAdmin} = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Fetch trainers from Firestore (memoized to prevent recreation)
  const fetchTrainers = useCallback(async () => {
    try {
      const result = await AuthService.getAllTrainers();
      if (result.success) {
        setTrainers(result.trainers);
        setFilteredTrainers(result.trainers);
      } else {
        Alert.alert('Error', result.error || 'Failed to load trainers');
      }
    } catch (error) {
      console.error('Fetch trainers error:', error);
      Alert.alert('Error', 'Failed to load trainers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  // Filter trainers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTrainers(trainers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = trainers.filter(
        trainer =>
          trainer.name.toLowerCase().includes(query) ||
          trainer.email.toLowerCase().includes(query) ||
          trainer.mobile.includes(query)
      );
      setFilteredTrainers(filtered);
    }
  }, [searchQuery, trainers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrainers();
  }, [fetchTrainers]);

  const handleTrainerPress = useCallback((trainer) => {
    const buttons = [
      {
        text: 'Edit',
        onPress: () => {
          setSelectedTrainer(trainer);
          setShowEditModal(true);
        },
      },
      trainer.status === 'active'
        ? {
            text: 'Deactivate',
            onPress: () => handleToggleStatus(trainer, 'inactive'),
          }
        : {
            text: 'Activate',
            onPress: () => handleToggleStatus(trainer, 'active'),
          },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDeleteTrainer(trainer),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ];

    Alert.alert(
      trainer.name,
      `Email: ${trainer.email}\nMobile: ${trainer.mobile}\nStatus: ${trainer.status}`,
      buttons
    );
  }, []);

  const handleToggleStatus = useCallback(async (trainer, newStatus) => {
    try {
      const result = await AuthService.updateTrainerStatus(trainer.uid, newStatus);
      if (result.success) {
        Alert.alert('Success', `Trainer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchTrainers(); // Refresh list
      } else {
        Alert.alert('Error', result.error || 'Failed to update trainer status');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      Alert.alert('Error', 'Failed to update trainer status');
    }
  }, [fetchTrainers]);

  const handleTrainerAdded = useCallback(() => {
    fetchTrainers(); // Refresh the trainer list
  }, [fetchTrainers]);

  const handleTrainerUpdated = useCallback(() => {
    fetchTrainers(); // Refresh the trainer list
  }, [fetchTrainers]);

  const handleDeleteTrainer = useCallback((trainer) => {
    Alert.alert(
      'Delete Trainer',
      `Are you sure you want to delete ${trainer.name}?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AuthService.deleteTrainer(trainer.uid);
              if (result.success) {
                Alert.alert('Success', 'Trainer deleted successfully');
                fetchTrainers(); // Refresh list
              } else {
                Alert.alert('Error', result.error || 'Failed to delete trainer');
              }
            } catch (error) {
              console.error('Delete trainer error:', error);
              Alert.alert('Error', 'Failed to delete trainer');
            }
          },
        },
      ]
    );
  }, [fetchTrainers]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.black} />
        <Text style={styles.loadingText}>Loading trainers...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {/* Header */}
        <Header title="Trainers" />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search trainers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<SearchIcon width={20} height={20} stroke={COLORS.brandTextSecondary} />}
            variant="search"
          />
        </View>

        {/* Trainer Count */}
        <View style={styles.countHeader}>
          <Text style={styles.countTitle}>
            All Trainers
          </Text>
          <Text style={styles.countText}>
            {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Trainer List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {filteredTrainers.length === 0 ? (
            <View style={styles.emptyState}>
              <UserSearchIcon width={64} height={64} stroke={COLORS.gray300} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No trainers found' : 'No trainers added yet'}
              </Text>
            </View>
          ) : (
            filteredTrainers.map(trainer => (
              <TrainerCard
                key={trainer.uid}
                trainer={trainer}
                onPress={handleTrainerPress}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Floating Action Button - Only for SuperAdmin */}
      {isSuperAdmin() && (
        <FloatingActionButton
          icon={<AddIcon width={24} height={24} fill={COLORS.brandDarkest} />}
          onPress={() => setShowAddModal(true)}
          backgroundColor={COLORS.brandSecondary}
        />
      )}

      {/* Add Trainer Modal */}
      <AddTrainerModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTrainerAdded={handleTrainerAdded}
      />

      {/* Edit Trainer Modal */}
      <EditTrainerModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTrainer(null);
        }}
        trainer={selectedTrainer}
        onTrainerUpdated={handleTrainerUpdated}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.gray600,
    fontFamily: FONTS.regular,
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
  countHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  countTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
  countText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
  trainerCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  trainerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
    color: COLORS.brandDarkest,
  },
  trainerEmail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    textTransform: 'capitalize',
  },
  trainerPhone: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerPhoneText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginLeft: 4,
    color: COLORS.brandTextSecondary,
  },
  trainerDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trainerDateText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginLeft: 4,
    color: COLORS.brandTextSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.gray500,
    fontFamily: FONTS.regular,
    marginTop: 16,
  },
});

export default TrainersScreen;
