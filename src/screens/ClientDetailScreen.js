import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ClientFormModal from '../components/ClientFormModal';
import {StopModal, RenewalModal} from '../components';
import ClientService from '../services/clientService';
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

/**
 * CLIENT DETAIL SCREEN
 * Shows full client information with all management actions
 */

const ClientDetailScreen = ({route, navigation}) => {
  const {clientId} = route.params;
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);

  const clientService = useMemo(() => new ClientService(), []);

  // Load client data
  const loadClient = useCallback(async () => {
    try {
      const result = await clientService.getClientById(clientId);
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
  }, [clientId, navigation, clientService]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

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
            const result = await clientService.pauseClient(clientId);
            if (result.success) {
              Alert.alert('Success', 'Client paused successfully');
              loadClient();
            } else {
              Alert.alert('Error', result.error || 'Failed to pause client');
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
            const result = await clientService.resumeClient(clientId);
            if (result.success) {
              Alert.alert('Success', 'Client resumed successfully');
              loadClient();
            } else {
              Alert.alert('Error', result.error || 'Failed to resume client');
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
            const result = await clientService.deleteClient(clientId);
            if (result.success) {
              Alert.alert('Success', 'Client deleted successfully');
              navigation.goBack();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete client');
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
    const result = await clientService.stopClient(clientId, reason);
    if (result.success) {
      Alert.alert('Success', 'Client stopped successfully');
      setStopModalVisible(false);
      loadClient();
    } else {
      Alert.alert('Error', result.error || 'Failed to stop client');
    }
  };

  const handleRenewConfirm = async (packageDays, startDate) => {
    const result = await clientService.renewClient(clientId, packageDays, startDate);
    if (result.success) {
      Alert.alert('Success', 'Client renewed successfully');
      setRenewModalVisible(false);
      loadClient();
    } else {
      Alert.alert('Error', result.error || 'Failed to renew client');
    }
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
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate BMI and day analysis
  const clientBMI = calculateBMI(client.startingWeight, client.height);
  const dayAnalysis = DayCalculator.getClientDayAnalysis(client);
  const displayTexts = DayCalculator.getDayDisplayText(dayAnalysis);

  const getStatusColor = () => {
    return STATUS_COLORS[client.status] || COLORS.brandTextSecondary;
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Full Client Card */}
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
                style={[styles.actionButton, styles.editButton]}>
                <EditIcon width={16} height={16} stroke={COLORS.brandDarkest} />
              </TouchableOpacity>

              {/* Pause/Resume button */}
              {(client.status === 'active' || client.status === 'paused') && (
                <TouchableOpacity
                  onPress={client.status === 'active' ? handlePause : handleResume}
                  style={[styles.actionButton, styles.editButton]}>
                  {client.status === 'active' ? (
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
                  style={[styles.actionButton, styles.editButton]}>
                  <RenewalIcon width={16} height={16} stroke={COLORS.brandDarkest} />
                </TouchableOpacity>
              )}

              {/* Stop button */}
              {(client.status === 'active' || client.status === 'paused') && (
                <TouchableOpacity
                  onPress={handleStop}
                  style={[styles.actionButton, styles.editButton]}>
                  <StopIcon width={16} height={16} stroke="" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.actionButton, styles.editButton]}>
                <TrashIcon width={16} height={16} stroke={COLORS.brandDark} />
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
    color: COLORS.gray600,
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
});

export default ClientDetailScreen;

