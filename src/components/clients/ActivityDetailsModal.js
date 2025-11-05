import React, {useEffect, useRef, useMemo, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {BottomSheetModal, BottomSheetView, BottomSheetScrollView, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';

/**
 * Activity Details Bottom Sheet Component
 * Shows detailed activity information for a specific day
 *
 * Props:
 * - visible: Boolean to show/hide bottom sheet
 * - onClose: Callback when bottom sheet is closed
 * - activity: Activity object with responses
 * - dayNumber: Day number (e.g., 11)
 * - date: Date string (DD/MM/YYYY)
 * - isPaused: Boolean indicating if this date was paused
 */

const ActivityDetailsModal = ({
  visible,
  onClose,
  activity,
  dayNumber,
  date,
  isPaused = false,
}) => {
  const bottomSheetModalRef = useRef(null);

  // Snap points for the bottom sheet (90% of screen height)
  const snapPoints = useMemo(() => ['90%'], []);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  // Render backdrop component
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Handle sheet dismissal
  const handleSheetDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderPausedView = () => {
    return (
      <BottomSheetView style={styles.centeredContent}>
        <Text style={styles.pausedTitle}>Package Paused</Text>
        <Text style={styles.pausedDescription}>
          This day was part of a pause period.{'\n'}
          Package days don't count during pause periods.
        </Text>
      </BottomSheetView>
    );
  };

  const renderNoActivityView = () => {
    return (
      <BottomSheetView style={styles.centeredContent}>
        <Text style={styles.emptyTitle}>No Activity Submitted</Text>
        <Text style={styles.emptyDescription}>
          The client hasn't filled their daily tracker for this day yet.
        </Text>
      </BottomSheetView>
    );
  };

  const renderActivityView = () => {
    if (!activity || !activity.responses || activity.responses.length === 0) {
      return renderNoActivityView();
    }

    return (
      <BottomSheetScrollView
        style={styles.activityContent}
        contentContainerStyle={styles.activityContentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Activity Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {activity.responses.filter(r => r.completed).length} of {activity.responses.length} completed
          </Text>
        </View>

        {/* Responses */}
        {activity.responses.map((response, index) => (
          <View key={index} style={styles.responseCard}>
            <View style={styles.responseRow}>
              <View style={[
                styles.statusBadge,
                response.completed ? styles.statusBadgeCompleted : styles.statusBadgeIncomplete,
              ]}>
                <Text style={styles.statusBadgeText}>
                  {response.completed ? '✓' : '✕'}
                </Text>
              </View>
              <View style={styles.responseContent}>
                <Text style={styles.questionText}>{response.question}</Text>
                <Text style={styles.answerText}>
                  {response.answer || 'Not answered'}
                </Text>
                {/* Individual Note for this response */}
                {response.note && response.note.trim() !== '' && (
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>{response.note}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* Submission time */}
        {activity.submittedAt && (
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              Submitted:{' '}
              {(() => {
                const timestamp = activity.submittedAt.toDate
                  ? activity.submittedAt.toDate()
                  : new Date(activity.submittedAt);
                return timestamp.toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              })()}
            </Text>
          </View>
        )}
      </BottomSheetScrollView>
    );
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onDismiss={handleSheetDismiss}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Day {dayNumber} • {date}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isPaused ? renderPausedView() : renderActivityView()}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  handleIndicator: {
    backgroundColor: COLORS.brandBorder,
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandBorder,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.brandPrimaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  activityContent: {
    flex: 1,
  },
  activityContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: COLORS.brandPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  responseCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    padding: 12,
    marginBottom: 10,
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.green500,
  },
  statusBadgeIncomplete: {
    backgroundColor: COLORS.red500,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  responseContent: {
    flex: 1,
  },
  questionText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
    lineHeight: 20,
    marginBottom: 4,
  },
  answerText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.brandTextSecondary,
    lineHeight: 18,
  },
  noteContainer: {
    backgroundColor: COLORS.brandPrimaryLight,
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.brandSecondary,
    padding: 8,
    marginTop: 6,
  },
  noteText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.brandDark,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  timestampContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  timestampText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextLight,
  },
  centeredContent: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  pausedTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
    marginBottom: 8,
  },
  pausedDescription: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ActivityDetailsModal;
