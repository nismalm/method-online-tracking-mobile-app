import React, {useCallback, useMemo} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {COLORS, FONTS, BORDER_RADIUS} from '../constants/theme';

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

const iconColor = COLORS.brandDarkest;
const iconSize = 28;

const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case 'Home':
      return <HomeIcon width={iconSize} height={iconSize} stroke={iconColor} fill={iconColor} />;
    case 'Clients':
      return <ClientIcon width={iconSize} height={iconSize} stroke={iconColor} fill={iconColor} />;
    case 'Trainers':
      return <TrainerIcon width={iconSize} height={iconSize} fill={iconColor} />;
    case 'Profile':
      return <ProfileIcon width={iconSize} height={iconSize} stroke={iconColor} fill={iconColor} />;
    default:
      return null;
  }
};

// Memoized to prevent unnecessary re-renders
const TabIcon = React.memo(({focused, routeName}) => {
  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.iconWrapper,
          focused && styles.iconWrapperFocused,
        ]}>
        {getTabIcon(routeName, focused)}
      </View>
      <Text style={styles.tabLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {routeName}
      </Text>
    </View>
  );
});

const BottomTabNavigator = () => {
  const {isSuperAdmin, isTrainer} = useAuth();

  // Memoize the isSuperAdmin and isTrainer checks to avoid re-computation
  const showTrainersTab = useMemo(() => isSuperAdmin(), [isSuperAdmin]);
  const showHomeTab = useMemo(() => !isTrainer(), [isTrainer]);

  const renderTabIcon = useCallback(
    ({focused, route}) => <TabIcon focused={focused} routeName={route.name} />,
    []
  );

  // Memoize screen options to prevent recreation
  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarLabel: () => null,
    tabBarStyle: {
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.brandBorder,
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
      {/* Home tab - Only visible to non-trainers (SuperAdmin) */}
      {showHomeTab && <Tab.Screen name="Home" component={HomeScreen} />}

      <Tab.Screen name="Clients" component={ClientsScreen} />

      {/* Trainers tab - Only visible to SuperAdmin */}
      {showTrainersTab && (
        <Tab.Screen name="Trainers" component={TrainersScreen} />
      )}

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.xl,
    width: 56,
    height: 56,
    backgroundColor: 'transparent',
  },
  iconWrapperFocused: {
    backgroundColor: COLORS.brandPrimary,
  },
  tabLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
    color: COLORS.brandDarkest,
  },
});

export default BottomTabNavigator;
