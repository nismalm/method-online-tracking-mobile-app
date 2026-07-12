import React from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {timeAgo} from '../utils/timeAgo';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';
import {dismissIntake} from '../services/clientIntakeService';

const IntakeCard = ({intake, onPress, onDismiss}) => {
  const handleDismiss = () => {
    Alert.alert(
      'Dismiss Intake',
      `Remove ${intake.name}'s intake form?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              await dismissIntake(intake.id);
              onDismiss(intake.id);
            } catch {
              Alert.alert('Error', 'Failed to dismiss intake.');
            }
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.dot} />
        <Text style={styles.time} numberOfLines={1}>
          {timeAgo(intake.submittedAt)}
        </Text>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.dismissX}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {intake.name}
      </Text>
      <Text style={styles.mobile} numberOfLines={1}>
        {intake.mobile}
      </Text>
      <View style={styles.reviewPill}>
        <Text style={styles.reviewText}>Review Intake</Text>
      </View>
    </TouchableOpacity>
  );
};

const PendingIntakesRow = ({intakes, onSelect, onDismiss}) => {
  if (!intakes || intakes.length === 0) {return null;}

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Pending Intakes</Text>
        <Text style={styles.count}>{intakes.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {intakes.map(intake => (
          <IntakeCard
            key={intake.id}
            intake={intake}
            onPress={() => onSelect(intake)}
            onDismiss={onDismiss}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
  count: {
    marginLeft: 8,
    minWidth: 22,
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
    backgroundColor: COLORS.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingRight: 4,
  },
  card: {
    width: 200,
    backgroundColor: COLORS.brandDarkest,
    borderRadius: BORDER_RADIUS.xl,
    padding: 14,
    marginRight: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brandPrimary,
    marginRight: 6,
  },
  time: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.gray300,
  },
  dismissX: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray300,
    fontFamily: FONTS.medium,
    paddingLeft: 4,
  },
  name: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: 2,
  },
  mobile: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.gray300,
    marginBottom: 12,
  },
  reviewPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  reviewText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
    letterSpacing: 0.3,
  },
});

export default PendingIntakesRow;
