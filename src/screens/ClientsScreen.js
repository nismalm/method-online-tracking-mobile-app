import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {User, ChevronRight, Search} from 'lucide-react-native';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import FloatingActionButton from '../components/FloatingActionButton';
import Dropdown from '../components/Dropdown';
import AddIcon from '../../assets/icons/addIcon';

const ClientCard = ({client}) => (
  <TouchableOpacity
    className="bg-white border border-brand-border rounded-2xl p-4 mb-3"
    onPress={() => console.log('View client:', client.name)}>
    <View className="flex-row items-center mb-3">
      <View className="w-12 h-12 rounded-full items-center justify-center mr-3 bg-brand-primary">
        <User size={24} color="#040404" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-barlow-semibold mb-1 text-brand-darkest">
          {client.name}
        </Text>
        <View className="flex-row items-center">
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              client.status === 'Active' ? 'bg-brand-secondary' : 'bg-brand-text-secondary'
            }`}
          />
          <Text className="text-sm font-barlow text-brand-text-secondary">
            {client.status}
          </Text>
        </View>
      </View>
      <ChevronRight size={24} color="#3c3c3c" />
    </View>
    <View className="flex-row">
      <View className="flex-1">
        <Text className="text-xs font-barlow mb-1 text-brand-text-light">
          Total Sessions
        </Text>
        <Text className="text-base font-barlow-semibold text-brand-darkest">
          {client.sessions}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-xs font-barlow mb-1 text-brand-text-light">
          Last Session
        </Text>
        <Text className="text-base font-barlow-semibold text-brand-darkest">
          {client.lastSession}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const ClientsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const trainerOptions = [
    {label: 'All Trainers', value: 'all'},
    {label: 'Alex Turner', value: 'alex'},
    {label: 'Maria Garcia', value: 'maria'},
    {label: 'James Anderson', value: 'james'},
  ];

  const statusOptions = [
    {label: 'All Status', value: 'all'},
    {label: 'Active', value: 'active'},
    {label: 'Paused', value: 'paused'},
  ];

  // Mock data for clients
  const clients = [
    {id: 1, name: 'John Smith', status: 'Active', sessions: 24, lastSession: '2 days ago'},
    {id: 2, name: 'Sarah Johnson', status: 'Active', sessions: 18, lastSession: '1 day ago'},
    {id: 3, name: 'Mike Wilson', status: 'Active', sessions: 32, lastSession: 'Today'},
    {id: 4, name: 'Emily Davis', status: 'Inactive', sessions: 12, lastSession: '2 weeks ago'},
    {id: 5, name: 'David Brown', status: 'Active', sessions: 45, lastSession: 'Today'},
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="px-6 py-8 flex-1 pt-2">
        {/* Header */}
        <Header title="Clients" />

        {/* Search Bar */}
        <View className="mb-6">
          <TextInput
            placeholder="Search clients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} color="#3c3c3c" />}
            variant="search"
          />
        </View>

        {/* Filters */}
        <View className="flex-row mb-6">
          <View className="flex-1 mr-2">
            <Dropdown
              label="Filter By Trainer"
              value={filterTrainer}
              onValueChange={setFilterTrainer}
              items={trainerOptions}
              placeholder="Select trainer"
              searchable={true}
              searchPlaceholder="Search trainers..."
            />
          </View>

          <View className="flex-1 ml-2">
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
        </View>

        {/* Client List */}
        <Text className="text-lg font-barlow-semibold mb-4 text-brand-darkest">
          All Clients
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {clients.map(client => (
            <ClientCard key={client.id} client={client} />
          ))}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<AddIcon width={24} height={24} fill="#040404" />}
        onPress={() => console.log('Add client')}
        backgroundColor="#e0fe66"
      />
    </SafeAreaView>
  );
};

export default ClientsScreen;
