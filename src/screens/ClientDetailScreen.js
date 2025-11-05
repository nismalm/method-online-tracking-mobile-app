import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ClientFormModal from '../components/ClientFormModal';
import {StopModal, RenewalModal} from '../components';
import * as ClientService from '../services/clientService';
import * as PackageService from '../services/packageService';
import {calculateBMI} from '../utils/bmiCalculator';
import * as DayCalculator from '../utils/dayCalculator';
import {STATUS_COLORS} from '../constants/formOptions';
import PauseIcon from '../../assets/icons/pauseIcon';
import PlayIcon from '../../assets/icons/playIcon';
import TrashIcon from '../../assets/icons/trashIcon';
import EditIcon from '../../assets/icons/editIcon';
import RenewalIcon from '../../assets/icons/renewalIcon';
import StopIcon from '../../assets/icons/stopIcon';
import ChevronRightIcon from '../../assets/icons/chevronRightIcon';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';
import PackageSelector from '../components/clients/PackageSelector';
import ClientActivityCalendar from '../components/clients/ClientActivityCalendar';
import ActivityDetailsModal from '../components/clients/ActivityDetailsModal';

/**
 * CLIENT DETAIL SCREEN
 * Shows full client information with tabs for Overview and Activities
 */

const ClientDetailScreen = ({route, navigation}) => {
  const {clientId} = route.params;
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Operation loading states
  const [pauseLoading, setPauseLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  // Activities state
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedPackageData, setSelectedPackageData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [packageCache, setPackageCache] = useState({});
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDatePaused, setIsDatePaused] = useState(false);

  // Load client data
  const loadClient = useCallback(async () => {
    try {
      const result = await ClientService.getClientById(clientId);
      if (result.success) {
        setClient(result.client);
      } else {
        Alert.alert('Error', 'Failed to load client details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load client error:', error);
      Alert.alert('Error', 'An error occurred while loading client');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [clientId, navigation]);

  // Load packages for dropdown
  const loadPackages = useCallback(async () => {
    if (!client) {
      return;
    }

    try {
      const result = await PackageService.getPackageOptions(clientId, client.currentPackageId);
      if (result.success && result.options.length > 0) {
        setPackages(result.options);
        // Set current package as default
        if (client.currentPackageId) {
          setSelectedPackageId(client.currentPackageId);
          const currentPkg = result.options.find(
            opt => opt.value === client.currentPackageId
          );
          if (currentPkg) {
            setSelectedPackageData(currentPkg.packageData);
          }
        } else {
          // Fallback to first package
          setSelectedPackageId(result.options[0].value);
          setSelectedPackageData(result.options[0].packageData);
        }
      }
    } catch (error) {
      console.error('Load packages error:', error);
    }
  }, [client, clientId]);

  // Load activities for selected package
  const loadActivities = useCallback(async (packageId) => {
    if (!packageId) {
      return;
    }

    // Check cache first
    if (packageCache[packageId]) {
      setActivities(packageCache[packageId]);
      return;
    }

    setActivitiesLoading(true);
    try {
      const result = await PackageService.getPackageActivities(packageId);
      if (result.success) {
        setActivities(result.activities);
        // Cache the result
        setPackageCache(prev => ({
          ...prev,
          [packageId]: result.activities,
        }));
      }
    } catch (error) {
      console.error('Load activities error:', error);
    } finally {
      setActivitiesLoading(false);
    }
  }, [packageCache]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  // Load packages when client is loaded or tab switches to activities
  useEffect(() => {
    if (client && activeTab === 'activities') {
      loadPackages();
    }
  }, [client, activeTab, loadPackages]);

  // Load activities when package is selected
  useEffect(() => {
    if (selectedPackageId && activeTab === 'activities') {
      loadActivities(selectedPackageId);
    }
  }, [selectedPackageId, activeTab, loadActivities]);

  const handlePause = async () => {
    Alert.alert(
      'Pause Client',
      `Are you sure you want to pause ${client.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Pause',
          style: 'destructive',
          onPress: async () => {
            try {
              setPauseLoading(true);
              const result = await ClientService.pauseClient(clientId);
              if (result.success) {
                Alert.alert('Success', 'Client paused successfully');
                loadClient();
                // Reload activities if on activities tab
                if (activeTab === 'activities' && selectedPackageId) {
                  // Clear cache for this package
                  setPackageCache(prev => {
                    const newCache = {...prev};
                    delete newCache[selectedPackageId];
                    return newCache;
                  });
                  loadActivities(selectedPackageId);
                }
              } else {
                Alert.alert('Error', result.error || 'Failed to pause client');
              }
            } catch (error) {
              console.error('Pause client error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setPauseLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleResume = async () => {
    Alert.alert(
      'Resume Client',
      `Are you sure you want to resume ${client.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Resume',
          style: 'default',
          onPress: async () => {
            try {
              setResumeLoading(true);
              const result = await ClientService.resumeClient(clientId);
              if (result.success) {
                Alert.alert('Success', 'Client resumed successfully');
                loadClient();
                // Reload packages and activities
                if (activeTab === 'activities') {
                  loadPackages();
                  if (selectedPackageId) {
                    setPackageCache(prev => {
                      const newCache = {...prev};
                      delete newCache[selectedPackageId];
                      return newCache;
                    });
                    loadActivities(selectedPackageId);
                  }
                }
              } else {
                Alert.alert('Error', result.error || 'Failed to resume client');
              }
            } catch (error) {
              console.error('Resume client error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setResumeLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}? This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              const result = await ClientService.deleteClient(clientId);
              if (result.success) {
                Alert.alert('Success', 'Client deleted successfully');
                navigation.goBack();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete client');
              }
            } catch (error) {
              console.error('Delete client error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleStop = () => {
    setStopModalVisible(true);
  };

  const handleRenew = () => {
    setRenewModalVisible(true);
  };

  const handleStopConfirm = async (reason) => {
    const result = await ClientService.stopClient(clientId, reason);
    if (result.success) {
      Alert.alert('Success', 'Client stopped successfully');
      setStopModalVisible(false);
      loadClient();
      // Reload packages if on activities tab
      if (activeTab === 'activities') {
        loadPackages();
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to stop client');
    }
  };

  const handleRenewConfirm = async (packageDays, startDate) => {
    const result = await ClientService.renewClient(clientId, packageDays, startDate);
    if (result.success) {
      Alert.alert('Success', 'Client renewed successfully');
      setRenewModalVisible(false);
      loadClient();
      // Clear cache and reload packages
      setPackageCache({});
      if (activeTab === 'activities') {
        loadPackages();
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to renew client');
    }
  };

  const handlePackageChange = (packageId, packageData) => {
    setSelectedPackageId(packageId);
    setSelectedPackageData(packageData);
  };

  const handleDayPress = (day) => {
    const dateString = day.dateString;
    // Convert YYYY-MM-DD to DD/MM/YYYY
    const parts = dateString.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

    // Check if date is paused
    // For archived packages: use snapshot pauseHistory, for current: use client's pauseHistory
    const pauseHistory = selectedPackageData?.pauseHistory || client.pauseHistory || [];
    const isPaused = selectedPackageData
      ? PackageService.isDatePaused(formattedDate, pauseHistory)
      : false;

    // Calculate day number
    const dayNumber = selectedPackageData
      ? PackageService.calculateDayNumber(
          formattedDate,
          selectedPackageData.startDate,
          pauseHistory
        )
      : null;

    // Find activity for this date
    const activity = activities.find(a => a.date === formattedDate);

    setSelectedDate(formattedDate);
    setSelectedDayNumber(dayNumber);
    setSelectedActivity(activity);
    setIsDatePaused(isPaused);
    setActivityModalVisible(true);
  };

  if (loading || !client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View style={styles.backIconWrapper}>
              <ChevronRightIcon width={24} height={24} stroke={COLORS.brandDarkest} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brandPrimary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if any operation is in progress
  const isOperationInProgress = pauseLoading || resumeLoading || deleteLoading;

  // Calculate BMI and day analysis
  const clientBMI = calculateBMI(client.startingWeight, client.height);
  const dayAnalysis = DayCalculator.getClientDayAnalysis(client);
  const displayTexts = DayCalculator.getDayDisplayText(dayAnalysis);

  const getStatusColor = () => {
    return STATUS_COLORS[client.status] || COLORS.brandTextSecondary;
  };

  const renderOverviewTab = () => {
    return (
      <View style={styles.clientCard}>
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            <View style={styles.clientStatus}>
              <View style={[styles.statusDot, {backgroundColor: getStatusColor()}]} />
              <Text style={styles.statusText}>{client.status}</Text>
            </View>
          </View>
          <View style={styles.clientActions}>
            <TouchableOpacity
              onPress={handleEdit}
              disabled={isOperationInProgress}
              style={[
                styles.actionButton,
                styles.editButton,
                isOperationInProgress && styles.disabledButton,
              ]}>
              <EditIcon width={16} height={16} stroke={COLORS.brandDarkest} />
            </TouchableOpacity>

            {/* Pause/Resume button */}
            {(client.status === 'active' || client.status === 'paused') && (
              <TouchableOpacity
                onPress={client.status === 'active' ? handlePause : handleResume}
                disabled={isOperationInProgress}
                style={[
                  styles.actionButton,
                  styles.editButton,
                  isOperationInProgress && styles.disabledButton,
                ]}>
                {pauseLoading || resumeLoading ? (
                  <ActivityIndicator size="small" color={COLORS.brandDarkest} />
                ) : client.status === 'active' ? (
                  <PauseIcon width={16} height={16} fill={COLORS.brandDarkest} />
                ) : (
                  <PlayIcon width={16} height={16} fill={COLORS.brandDarkest} stroke={COLORS.brandDarkest} />
                )}
              </TouchableOpacity>
            )}

            {/* Renewal button */}
            {(client.status === 'completed' || client.status === 'stopped') && (
              <TouchableOpacity
                onPress={handleRenew}
                disabled={isOperationInProgress}
                style={[
                  styles.actionButton,
                  styles.editButton,
                  isOperationInProgress && styles.disabledButton,
                ]}>
                <RenewalIcon width={16} height={16} stroke={COLORS.brandDarkest} />
              </TouchableOpacity>
            )}

            {/* Stop button */}
            {(client.status === 'active' || client.status === 'paused') && (
              <TouchableOpacity
                onPress={handleStop}
                disabled={isOperationInProgress}
                style={[
                  styles.actionButton,
                  styles.editButton,
                  isOperationInProgress && styles.disabledButton,
                ]}>
                <StopIcon width={16} height={16} stroke="" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleDelete}
              disabled={isOperationInProgress}
              style={[
                styles.actionButton,
                styles.editButton,
                isOperationInProgress && styles.disabledButton,
              ]}>
              {deleteLoading ? (
                <ActivityIndicator size="small" color={COLORS.brandDarkest} />
              ) : (
                <TrashIcon width={16} height={16} stroke={COLORS.brandDark} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Day Count Display */}
        <View style={styles.dayCountContainer}>
          <View style={styles.dayCountRow}>
            <Text style={styles.dayCountText}>{displayTexts.dayText}</Text>
            <Text style={styles.dayCountText}>{displayTexts.remainingText}</Text>
          </View>
          {/* Paused Date */}
          {client.status === 'paused' && client.pauseHistory && client.pauseHistory.length > 0 && (
            <View style={styles.pausedDateRow}>
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
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Package</Text>
            <Text style={styles.detailValue}>{client.package} days</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Training Mode</Text>
            <Text style={styles.detailValue}>{client.trainingMode}</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Height</Text>
            <Text style={styles.detailValue}>{client.height} cm</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Weight</Text>
            <Text style={styles.detailValue}>{client.startingWeight} KG</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{client.gender}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Blood Group</Text>
            <Text style={styles.detailValue}>{client.bloodGroup}</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Login Code</Text>
            <Text style={styles.detailValue}>{client.loginCode}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>BMI</Text>
            <Text style={styles.detailValue}>{clientBMI || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Mobile Number</Text>
            <Text style={styles.detailValue}>{client.mobile}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{client.age} years</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Start Date</Text>
            <Text style={styles.detailValue}>{client.startDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>End Date</Text>
            <Text style={styles.detailValue}>{client.endDate}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActivitiesTab = () => {
    if (packages.length === 0) {
      return (
        <View style={styles.emptyActivitiesContainer}>
          <Text style={styles.emptyActivitiesText}>No packages found for this client</Text>
        </View>
      );
    }

    const completedCount = activities.filter(
      a => a.status === 'completed' || a.status === 'partial'
    ).length;
    const totalDays = selectedPackageData ? selectedPackageData.packageDays : 0;

    return (
      <View style={styles.activitiesContainer}>
        {/* Package Selector */}
        <PackageSelector
          packages={packages}
          selectedPackageId={selectedPackageId}
          onPackageChange={handlePackageChange}
          loading={false}
        />

        {/* Calendar */}
        {activitiesLoading ? (
          <View style={styles.calendarLoadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brandPrimary} />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : (
          <ClientActivityCalendar
            client={client}
            packageData={selectedPackageData}
            activities={activities}
            onDayPress={handleDayPress}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backIconWrapper}>
            <ChevronRightIcon width={24} height={24} stroke={COLORS.brandDarkest} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Details</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}>
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
          onPress={() => setActiveTab('activities')}>
          <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>
            Activities
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' ? renderOverviewTab() : renderActivitiesTab()}
      </ScrollView>

      {/* Modals */}
      <ClientFormModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onClientAdded={loadClient}
        client={client}
        mode="edit"
      />

      <StopModal
        visible={stopModalVisible}
        onClose={() => setStopModalVisible(false)}
        onConfirm={handleStopConfirm}
        clientName={client.name}
      />

      <RenewalModal
        visible={renewModalVisible}
        onClose={() => setRenewModalVisible(false)}
        onConfirm={handleRenewConfirm}
        client={client}
      />

      <ActivityDetailsModal
        visible={activityModalVisible}
        onClose={() => setActivityModalVisible(false)}
        activity={selectedActivity}
        dayNumber={selectedDayNumber}
        date={selectedDate}
        isPaused={isDatePaused}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandBorder,
  },
  backButton: {
    padding: 8,
  },
  backIconWrapper: {
    transform: [{rotate: '180deg'}],
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  headerRight: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.brandPrimary,
  },
  tabText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.brandTextSecondary,
  },
  activeTabText: {
    color: COLORS.brandDarkest,
    fontFamily: FONTS.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    marginTop: 8,
  },
  clientCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.brandBorder,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
    marginBottom: 8,
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
  clientActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.brandPrimary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  dayCountContainer: {
    backgroundColor: COLORS.brandPrimary,
    borderRadius: BORDER_RADIUS.xl,
    padding: 16,
    marginBottom: 16,
  },
  dayCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCountText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.brandDark,
  },
  pausedDateRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.brandDark,
  },
  pausedDateText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
  activitiesContainer: {
    flex: 1,
  },
  emptyActivitiesContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivitiesText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    textAlign: 'center',
  },
  calendarLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ClientDetailScreen;
