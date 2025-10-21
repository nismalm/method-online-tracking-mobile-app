import React, {useCallback, useMemo} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text} from 'react-native';
import {useAuth} from '../context/AuthContext';

// Import custom icons
import HomeIcon from '../../assets/icons/homeIcon';
import ClientIcon from '../../assets/icons/clientsIcon';
import TrainerIcon from '../../assets/icons/trainerIcon';
import ProfileIcon from '../../assets/icons/profileIcon';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ClientsScreen from '../screens/ClientsScreen';
import TrainersScreen from '../screens/TrainersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const iconColor = '#040404';
const iconSize = 28;

const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case 'Home':
      return <HomeIcon width={iconSize} height={iconSize} stroke={iconColor} fill={iconColor} />;
    case 'Clients':
      return <ClientIcon width={iconSize} height={iconSize} stroke={iconColor} fill={iconColor} />;
    case 'Trainers':
      return <TrainerIcon width={iconSize} height={iconSize} stroke={iconColor} fill={iconColor} />;
    case 'Profile':
      return <ProfileIcon width={iconSize} height={iconSize} stroke={iconColor} fill={iconColor} />;
    default:
      return null;
  }
};

// Memoized to prevent unnecessary re-renders
const TabIcon = React.memo(({focused, routeName}) => {
  return (
    <View className="items-center justify-center w-full">
      <View
        className={`items-center justify-center rounded-xl w-14 h-14 ${
          focused ? 'bg-brand-primary' : 'bg-transparent'
        }`}>
        {getTabIcon(routeName, focused)}
      </View>
      <Text
        className="font-barlow-semibold text-[10px] mt-1.5 text-center text-brand-darkest"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {routeName}
      </Text>
    </View>
  );
});

const BottomTabNavigator = () => {
  const {isSuperAdmin, isTrainer} = useAuth();

  // Memoize the isSuperAdmin check to avoid re-computation
  const showTrainersTab = useMemo(() => isSuperAdmin(), [isSuperAdmin]);

  const renderTabIcon = useCallback(
    ({focused, route}) => <TabIcon focused={focused} routeName={route.name} />,
    []
  );

  // Memoize screen options to prevent recreation
  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarLabel: () => null,
    tabBarStyle: {
      backgroundColor: '#ffffff',
      borderTopWidth: 1,
      borderTopColor: '#e5e5e5',
      height: 90,
      paddingTop: 10,
      paddingBottom: 20,
    },
    tabBarItemStyle: {
      paddingVertical: 5,
      paddingHorizontal: 0,
    },
  }), []);

  const getTabBarIcon = useCallback(({focused, route}) => renderTabIcon({focused, route}), [renderTabIcon]);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        ...screenOptions,
        tabBarIcon: ({focused}) => getTabBarIcon({focused, route}),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />

      {/* Trainers tab - Only visible to SuperAdmin */}
      {showTrainersTab && (
        <Tab.Screen name="Trainers" component={TrainersScreen} />
      )}

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
