import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import Header from '../components/Header';
import * as ClientService from '../services/clientService';
import * as PackageService from '../services/packageService';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';
import ChevronRightIcon from '../../assets/icons/chevronRightIcon';
import SearchIcon from '../../assets/icons/searchIcon';
import FeeDueBottomSheet from '../components/FeeDueBottomSheet';

const getDateForOffset = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return d;
};

const formatDDMMYYYY = (date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

const formatDisplay = (date) =>
  date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const FILTERS = ['All', 'Done', 'Pending'];

const getTomorrowDDMMYYYY = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDDMMYYYY(d);
};

const TOMORROW_STR = getTomorrowDDMMYYYY();

const DailyProgressScreen = ({navigation}) => {
  const {user, isSuperAdmin} = useAuth();
  const [clientsProgress, setClientsProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [daysOffset, setDaysOffset] = useState(0);
  const [feeDueVisible, setFeeDueVisible] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const targetDate = formatDDMMYYYY(getDateForOffset(daysOffset));

      let result;
      if (!isSuperAdmin()) {
        result = await ClientService.getClientsByTrainer(user?.uid);
      } else {
        result = await ClientService.getAllClients();
      }

      if (!result.success) {
        setLoading(false);
        return;
      }

      const activeClients = result.clients.filter(
        c => c.status === 'active' || c.status === 'paused',
      );

      const progressResults = await Promise.allSettled(
        activeClients.map(async client => {
          if (client.status === 'paused') {
            return {client, status: 'pending', percentage: 0};
          }

          const pkgResult = await PackageService.getPackagesByClient(client.id);
          if (!pkgResult.success || pkgResult.packages.length === 0) {
            return {client, status: 'pending', percentage: 0};
          }

          const currentPkg =
            pkgResult.packages.find(p => p.status === 'active') ||
            pkgResult.packages[0];

          const actResult = await PackageService.getPackageActivities(
            client.id,
            currentPkg.packageId,
          );

          if (!actResult.success) {
            return {client, status: 'pending', percentage: 0};
          }

          const dayActivity = actResult.activities.find(a => a.date === targetDate);
          const isDone =
            dayActivity &&
            (dayActivity.status === 'completed' || dayActivity.status === 'partial');

          const percentage = dayActivity?.progress?.percentage ?? 0;

          return {
            client,
            status: isDone ? 'done' : 'pending',
            percentage,
          };
        }),
      );

      const data = progressResults
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      data.sort((a, b) => {
        if (a.status === b.status) {return 0;}
        return a.status === 'done' ? -1 : 1;
      });

      setClientsProgress(data);
    } catch (error) {
      console.error('Load daily progress error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isSuperAdmin, daysOffset]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgress();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress]),
  );

  const doneCount = clientsProgress.filter(c => c.status === 'done').length;
  const pendingCount = clientsProgress.filter(c => c.status === 'pending').length;
  const feeDueClients = clientsProgress.filter(({client}) => client.endDate === TOMORROW_STR);

  const filteredClients = clientsProgress.filter(item => {
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Done' && item.status === 'done') ||
      (activeFilter === 'Pending' && item.status === 'pending');

    const matchesSearch =
      !searchQuery.trim() ||
      item.client.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const canGoForward = daysOffset > 0;
  const selectedDateDisplay = formatDisplay(getDateForOffset(daysOffset));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Header title="Daily Progress" />

        <View style={styles.dateNavRow}>
          <TouchableOpacity
            style={styles.dateArrowButton}
            onPress={() => setDaysOffset(prev => prev + 1)}
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.dateArrowText}>{'<'}</Text>
          </TouchableOpacity>

          <Text style={styles.dateText} numberOfLines={1}>
            {selectedDateDisplay}
          </Text>

          <TouchableOpacity
            style={[
              styles.dateArrowButton,
              !canGoForward && styles.dateArrowButtonDisabled,
            ]}
            onPress={() => canGoForward && setDaysOffset(prev => prev - 1)}
            activeOpacity={canGoForward ? 0.7 : 1}
            disabled={!canGoForward}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text
              style={[
                styles.dateArrowText,
                !canGoForward && styles.dateArrowTextDisabled,
              ]}>
              {'>'}
            </Text>
          </TouchableOpacity>

          {canGoForward ? (
            <TouchableOpacity
              onPress={() => setDaysOffset(0)}
              activeOpacity={0.7}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={styles.todayButton}>
              <Text style={styles.todayButtonText}>{'>>'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.todayButtonPlaceholder} />
          )}
        </View>

        {!loading && clientsProgress.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryPill, styles.summaryDone]}>
              <Text style={[styles.summaryCount, {color: COLORS.green600}]}>{doneCount}</Text>
              <Text style={[styles.summaryLabel, {color: COLORS.green600}]}>Done</Text>
            </View>
            <View style={[styles.summaryPill, styles.summaryPending]}>
              <Text style={[styles.summaryCount, {color: COLORS.gray600}]}>{pendingCount}</Text>
              <Text style={[styles.summaryLabel, {color: COLORS.gray600}]}>Pending</Text>
            </View>
            {feeDueClients.length > 0 && (
              <TouchableOpacity
                style={styles.feeDueTrigger}
                onPress={() => setFeeDueVisible(true)}
                activeOpacity={0.7}>
                <View style={styles.feeDueDot} />
                <Text style={styles.feeDueTriggerText}>{feeDueClients.length} fee due</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.searchIcon}>
            <SearchIcon width={18} height={18} stroke={COLORS.brandTextSecondary} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === filter && styles.filterPillTextActive,
                ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.brandPrimary} />
              <Text style={styles.loadingText}>Loading progress...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {clientsProgress.length === 0
                  ? 'No active clients found'
                  : 'No clients match your filter'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.listTitle}>
                {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
              </Text>
              {filteredClients.map(({client, status, percentage}) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientRow}
                  onPress={() =>
                    navigation.navigate('ClientDetail', {clientId: client.id})
                  }
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.statusBar,
                      {
                        backgroundColor:
                          status === 'done' ? COLORS.green500 : COLORS.gray200,
                      },
                    ]}
                  />
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {client.name}
                    </Text>
                    <Text
                      style={[
                        styles.clientStatusText,
                        {color: status === 'done' ? COLORS.green600 : COLORS.gray500},
                      ]}>
                      {status === 'done' ? 'Done' : 'Pending'}
                    </Text>
                  </View>
                  {status === 'done' && percentage > 0 && (
                    <View style={styles.percentageContainer}>
                      <Text style={styles.percentageText}>{percentage}%</Text>
                    </View>
                  )}
                  <ChevronRightIcon
                    width={18}
                    height={18}
                    stroke={COLORS.brandTextSecondary}
                  />
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      <FeeDueBottomSheet
        visible={feeDueVisible}
        onClose={() => setFeeDueVisible(false)}
        clients={feeDueClients}
        onClientPress={client => {
          setFeeDueVisible(false);
          navigation.navigate('ClientDetail', {clientId: client.id});
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  dateArrowButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowButtonDisabled: {
    backgroundColor: COLORS.gray50,
    borderColor: COLORS.gray200,
    opacity: 0.4,
  },
  dateArrowText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dateArrowTextDisabled: {
    color: COLORS.gray400,
  },
  todayButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  todayButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.brandTextSecondary,
  },
  todayButtonPlaceholder: {
    width: 28,
  },
  dateText: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandTextSecondary,
    paddingHorizontal: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryPill: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  summaryDone: {
    backgroundColor: '#dcfce7',
  },
  summaryPending: {
    backgroundColor: COLORS.gray100,
  },
  summaryCount: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full || 999,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    backgroundColor: COLORS.white,
  },
  filterPillActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },
  filterPillText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.brandTextSecondary,
  },
  filterPillTextActive: {
    color: COLORS.brandDarkest,
    fontFamily: FONTS.semiBold,
  },
  listTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandTextSecondary,
    marginBottom: 10,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    textAlign: 'center',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: 10,
    paddingVertical: 14,
    paddingRight: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  statusBar: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 14,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
    marginBottom: 2,
  },
  clientStatusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  feeDueTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    alignSelf: 'center',
  },
  feeDueDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f97316',
  },
  feeDueTriggerText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: '#c2410c',
  },
  percentageContainer: {
    marginRight: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#dcfce7',
    borderRadius: BORDER_RADIUS.md,
  },
  percentageText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.green600,
  },
});

export default DailyProgressScreen;
