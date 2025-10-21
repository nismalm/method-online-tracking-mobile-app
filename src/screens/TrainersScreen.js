import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Phone, Calendar, Search, UserSearch} from 'lucide-react-native';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import FloatingActionButton from '../components/FloatingActionButton';
import AddTrainerModal from '../components/AddTrainerModal';
import EditTrainerModal from '../components/EditTrainerModal';
import AddIcon from '../../assets/icons/addIcon';
import AuthService from '../services/authService';
import {useAuth} from '../context/AuthContext';

// Memoized trainer card to prevent unnecessary re-renders
const TrainerCard = React.memo(({trainer, onPress}) => {
  const statusColor = trainer.status === 'active' ? 'bg-brand-secondary' : 'bg-red-100';
  const statusTextColor = trainer.status === 'active' ? 'text-brand-dark' : 'text-red-800';

  return (
    <TouchableOpacity
      className="bg-white border border-brand-border rounded-2xl p-4 mb-3"
      onPress={() => onPress(trainer)}
      activeOpacity={0.7}>
      <View className="flex-row items-center mb-3">
        <View className="flex-1">
          <Text className="text-lg font-barlow-semibold mb-1 text-brand-darkest">
            {trainer.name}
          </Text>
          <Text className="text-sm font-barlow text-brand-text-secondary">
            {trainer.email}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-lg ${statusColor}`}>
          <Text className={`text-xs font-barlow-semibold ${statusTextColor} capitalize`}>
            {trainer.status}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <Phone size={16} color="#3c3c3c" />
        <Text className="text-sm font-barlow ml-1 text-brand-text-secondary">
          {trainer.mobile}
        </Text>
      </View>
      {trainer.createdAt && (
        <View className="flex-row items-center mt-2">
          <Calendar size={16} color="#3c3c3c" />
          <Text className="text-xs font-barlow ml-1 text-brand-text-secondary">
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
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="mt-4 text-gray-600 font-barlow">Loading trainers...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="px-6 py-8 flex-1 pt-2">
        {/* Header */}
        <Header title="Trainers" />

        {/* Search Bar */}
        <View className="mb-6">
          <TextInput
            placeholder="Search trainers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} color="#3c3c3c" />}
            variant="search"
          />
        </View>

        {/* Trainer Count */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-barlow-semibold text-brand-darkest">
            All Trainers
          </Text>
          <Text className="text-sm font-barlow text-brand-text-secondary">
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
            <View className="items-center justify-center py-12">
              <UserSearch size={64} color="#d1d5db" />
              <Text className="text-gray-500 font-barlow mt-4">
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
          icon={<AddIcon width={24} height={24} fill="#040404" />}
          onPress={() => setShowAddModal(true)}
          backgroundColor="#c2e04f"
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

export default TrainersScreen;
