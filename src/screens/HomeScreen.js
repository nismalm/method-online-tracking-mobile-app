import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
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

// Memoized to prevent unnecessary re-renders
const StatCard = React.memo(({title, value, IconComponent}) => (
  <View className="bg-gray-50 rounded-2xl p-4 flex-1 mx-1">
    <View className="flex-row items-start justify-between">
      <View className="flex-1">
        <Text className="text-4xl font-barlow-bold mb-2 text-brand-dark">
          {value}
        </Text>
        <Text className="text-sm font-barlow text-brand-text-secondary">
          {title}
        </Text>
      </View>
      <View className="ml-2">
        <IconComponent width={32} height={32} fill="#1E293B" />
      </View>
    </View>
  </View>
));

// Memoized to prevent unnecessary re-renders
const QuickActionCard = React.memo(({IconComponent, label, onPress, fullWidth = false}) => (
  <TouchableOpacity
    className={`rounded-2xl p-5 mb-3 bg-brand-primary ${fullWidth ? 'w-full' : 'flex-1'}`}
    onPress={onPress}
    activeOpacity={0.7}>
    <View className="flex-row items-center">
      <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-brand-darkest">
        <IconComponent width={24} height={24} fill="#ffffff" stroke="#ffffff" />
      </View>
      <Text className="font-barlow-semibold text-base flex-1 text-brand-dark">
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1">
        <View className="px-6 py-8 pt-2">
          {/* Header */}
          <Header
            subtitle="Welcome back,"
            title={userProfile?.name || 'Trainer'}
          />

          {/* Stats Section */}
          <Text className="text-lg font-barlow-semibold mb-4 text-brand-darkest">
            Overview
          </Text>
          <View className="flex-row mb-3">
            <StatCard title="Total Clients" value="45" IconComponent={ClientsIcon} />
            <StatCard title="Trainers" value={trainersCount.toString()} IconComponent={TrainerIcon} />
          </View>
          <View className="flex-row mb-6">
            <StatCard title="Active Clients" value="38" IconComponent={LiveIcon} />
            <StatCard title="Paused Clients" value="7" IconComponent={PauseIcon} />
          </View>

          {/* Quick Actions */}
          <Text className="text-lg font-barlow-semibold mb-4 text-brand-darkest">
            Quick Actions
          </Text>

          <View className="flex-row mb-3">
            <QuickActionCard
              IconComponent={AddIcon}
              label="Add Client"
              onPress={() => console.log('Add Client')}
            />
            <View className="w-3" />
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

export default HomeScreen;
