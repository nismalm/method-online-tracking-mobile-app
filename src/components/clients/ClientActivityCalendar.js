import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {COLORS, FONTS, FONT_SIZES} from '../../constants/theme';
import * as DayCalculator from '../../utils/dayCalculator';

/**
 * Client Activity Calendar Component
 * Displays calendar with color-coded dates based on activity status
 *
 * Props:
 * - client: Client object with startDate, endDate, status, pauseHistory (for current package)
 * - packageData: Package object (for historical packages with snapshot dates)
 * - activities: Array of activity objects
 * - onDayPress: Callback when a date is pressed
 */

const ClientActivityCalendar = ({client, packageData, activities = [], onDayPress}) => {
  // Build marked dates object for calendar
  const markedDates = useMemo(() => {
    if (!client) {
      return {};
    }

    const marked = {};

    // For historical packages: use snapshot dates from package
    // For current package: use client dates (single source of truth)
    const startDate = packageData?.startDate || client.startDate;
    const endDate = packageData?.endDate || client.endDate;
    const pauseHistory = packageData?.pauseHistory || client.pauseHistory || [];

    // Convert DD/MM/YYYY to YYYY-MM-DD for calendar library
    const convertDateFormat = dateString => {
      if (!dateString) {return null;}
      const parts = dateString.split('/');
      if (parts.length !== 3) {
        return null;
      }
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    };

    // Format a local Date as YYYY-MM-DD (never use toISOString: it shifts to UTC
    // and produces the wrong calendar day for users west of UTC).
    const formatYmdLocal = date => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const startCalendarDate = convertDateFormat(startDate);
    const endCalendarDate = convertDateFormat(endDate);

    if (!startCalendarDate || !endCalendarDate) {
      return {};
    }

    // Build activity map for quick lookup
    const activityMap = {};
    activities.forEach(activity => {
      const calendarDate = convertDateFormat(activity.date);
      if (calendarDate) {
        activityMap[calendarDate] = activity;
      }
    });

    // Helper to check if date is paused
    const isDatePaused = dateStr => {
      const ddmmyyyy = dateStr.split('-').reverse().join('/');
      for (const pause of pauseHistory) {
        if (!pause.pausedAt || !pause.resumedAt) {
          continue;
        }
        const pausedDate = pause.pausedAt.toDate ? pause.pausedAt.toDate() : new Date(pause.pausedAt);
        const resumedDate = pause.resumedAt.toDate ? pause.resumedAt.toDate() : new Date(pause.resumedAt);
        const checkDate = DayCalculator.parseDate(ddmmyyyy);

        if (!checkDate) {
          continue;
        }

        // Normalize all dates to midnight for comparison
        const pausedDateMidnight = new Date(pausedDate.getFullYear(), pausedDate.getMonth(), pausedDate.getDate());
        const resumedDateMidnight = new Date(resumedDate.getFullYear(), resumedDate.getMonth(), resumedDate.getDate());
        const checkDateMidnight = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

        // Include pause start date, exclude resume date
        // If paused on 4th, 4th is striked. If resumed on 5th, 5th is NOT striked.
        if (checkDateMidnight >= pausedDateMidnight && checkDateMidnight < resumedDateMidnight) {
          return true;
        }
      }
      return false;
    };

    // Iterate through package date range using local Dates. Building from
    // (year, month, day) keeps everything in local time so incrementing
    // .setDate() advances by real calendar days, and formatYmdLocal produces
    // the same YYYY-MM-DD the calendar library uses for its cell keys.
    const [sy, sm, sd] = startCalendarDate.split('-').map((n) => parseInt(n, 10));
    const [ey, em, ed] = endCalendarDate.split('-').map((n) => parseInt(n, 10));
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    let current = new Date(start);

    while (current <= end) {
      const dateString = formatYmdLocal(current);
      const activity = activityMap[dateString];
      const isPaused = isDatePaused(dateString);

      if (isPaused) {
        // Paused date
        marked[dateString] = {
          customStyles: {
            container: {
              backgroundColor: COLORS.gray100,
              borderWidth: 1,
              borderColor: '#CCCCCC',
            },
            text: {
              color: COLORS.brandDarkest,
              textDecorationLine: 'line-through',
              textDecorationStyle: 'double',
            },
          },
        };
      } else if (activity) {
        // Has activity
        if (activity.status === 'completed') {
          // Fully completed
          marked[dateString] = {
            customStyles: {
              container: {
                backgroundColor: COLORS.brandPrimary,
              },
              text: {
                color: COLORS.brandDarkest,
                fontFamily: FONTS.semiBold,
              },
            },
          };
        } else if (activity.status === 'partial') {
          // Partially completed
          marked[dateString] = {
            customStyles: {
              container: {
                backgroundColor: '#FFB800',
              },
              text: {
                color: COLORS.brandDarkest,
                fontFamily: FONTS.semiBold,
              },
            },
          };
        }
      } else {
        // No activity (pending)
        marked[dateString] = {
          customStyles: {
            container: {
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.brandBorder,
            },
            text: {
              color: COLORS.brandTextSecondary,
            },
          },
        };
      }

      current.setDate(current.getDate() + 1);
    }

    return marked;
  }, [client, packageData, activities]);

  if (!client) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No client data available</Text>
      </View>
    );
  }

  const convertDateFormat = dateString => {
    const parts = dateString.split('/');
    if (parts.length !== 3) {
      return null;
    }
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  };

  // For historical packages: use snapshot dates from package
  // For current package: use client dates (single source of truth)
  const startDate = packageData?.startDate || client.startDate;
  const endDate = packageData?.endDate || client.endDate;

  const minDate = convertDateFormat(startDate);
  const maxDate = convertDateFormat(endDate);

  // Determine initial calendar date
  // For current packages: focus on today if within range, else start date
  // For historical packages: focus on start date
  const getInitialDate = () => {
    // Check if this is the current active package
    // A package is "current" if it matches the client's currentPackageId
    const isCurrentPackage = packageData?.packageId === client?.currentPackageId;
    
    // For historical packages, always use start date
    if (!isCurrentPackage) {
      return minDate;
    }

    // For current package, try to use today's date if within range.
    // Use local getters, not toISOString(), so the user's local calendar day
    // (not the UTC day) is highlighted.
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    // Check if today is within the package date range
    if (minDate && maxDate && todayStr >= minDate && todayStr <= maxDate) {
      return todayStr;
    }

    // If today is outside range, use start date
    return minDate;
  };

  const initialDate = getInitialDate();

  return (
    <View style={styles.container}>
      <Calendar
        key={`${minDate}-${initialDate}`}
        markingType="custom"
        markedDates={markedDates}
        minDate={minDate}
        maxDate={maxDate}
        current={initialDate}
        onDayPress={day => {
          if (onDayPress) {
            onDayPress(day);
          }
        }}
        theme={{
          todayTextColor: COLORS.brandSecondary,
          selectedDayBackgroundColor: COLORS.brandPrimary,
          arrowColor: COLORS.brandDark,
          monthTextColor: COLORS.brandDarkest,
          textMonthFontFamily: FONTS.bold,
          textMonthFontSize: FONT_SIZES.lg,
          textDayFontFamily: FONTS.regular,
          textDayFontSize: FONT_SIZES.sm,
          textDayHeaderFontFamily: FONTS.semiBold,
          textDayHeaderFontSize: FONT_SIZES.xs,
        }}
        style={styles.calendar}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: COLORS.brandPrimary}]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: '#FFB800'}]} />
          <Text style={styles.legendText}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.brandBorder}]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: COLORS.gray100}]} />
          <Text style={styles.legendText}>Paused</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
  },
  calendar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    padding: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
});

export default ClientActivityCalendar;
