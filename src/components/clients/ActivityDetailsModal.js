import React from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import Modal from 'react-native-modal';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';

/**
 * Activity Details Modal Component
 * Shows detailed activity information for a specific day
 *
 * Props:
 * - visible: Boolean to show/hide modal
 * - onClose: Callback when modal is closed
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
  const renderPausedView = () => {
    return (
      <View style={styles.centeredContent}>
        <Text style={styles.pausedIcon}>⏸️</Text>
        <Text style={styles.pausedTitle}>Package Paused</Text>
        <Text style={styles.pausedDescription}>
          This day was part of a pause period.{'\n'}
          Package days don't count during pause periods.
        </Text>
      </View>
    );
  };

  const renderNoActivityView = () => {
    return (
      <View style={styles.centeredContent}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>No Activity Submitted</Text>
        <Text style={styles.emptyDescription}>
          The client hasn't filled their daily tracker for this day yet.
        </Text>
      </View>
    );
  };

  const renderActivityView = () => {
    if (!activity || !activity.responses || activity.responses.length === 0) {
      return renderNoActivityView();
    }

    return (
      <ScrollView style={styles.activityContent} showsVerticalScrollIndicator={false}>
        {/* Activity Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {activity.responses.filter(r => r.completed).length} of {activity.responses.length} completed
          </Text>
        </View>

        {/* Responses */}
        {activity.responses.map((response, index) => (
          <View key={index} style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <View style={[
                styles.statusBadge,
                response.completed ? styles.statusBadgeCompleted : styles.statusBadgeIncomplete
              ]}>
                <Text style={styles.statusBadgeText}>
                  {response.completed ? '✓' : '✕'}
                </Text>
              </View>
              <Text style={styles.questionText}>{response.question}</Text>
            </View>
            
            <View style={styles.answerContainer}>
              <Text style={styles.answerLabel}>Answer:</Text>
              <Text style={styles.answerText}>
                {response.answer || 'Not answered'}
              </Text>
            </View>

            {/* Individual Note for this response */}
            {response.note && response.note.trim() !== '' && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>📝 Note:</Text>
                <Text style={styles.noteText}>{response.note}</Text>
              </View>
            )}
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
      </ScrollView>
    );
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
      propagateSwipe={true}
      avoidKeyboard={true}>
      <View style={styles.modalContent}>
        {/* Handle bar */}
        <View style={styles.handleBar} />

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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: 8,
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.brandBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
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
    padding: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.brandPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  responseCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.brandBorder,
    padding: 16,
    marginBottom: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.green500,
  },
  statusBadgeIncomplete: {
    backgroundColor: COLORS.red500,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  questionText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
    flex: 1,
    lineHeight: 22,
  },
  answerContainer: {
    backgroundColor: COLORS.brandPrimaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginLeft: 38,
  },
  answerLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandTextSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.brandDarkest,
  },
  noteContainer: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brandPrimary,
    padding: 12,
    marginTop: 10,
    marginLeft: 38,
  },
  noteLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandTextSecondary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
    lineHeight: 20,
  },
  timestampContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  timestampText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
  centeredContent: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  pausedIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
