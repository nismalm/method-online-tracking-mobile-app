import React, {useState, useEffect} from 'react';
import {View, Text, Modal, TouchableOpacity, Platform, StyleSheet} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';

const TimePickerModal = ({visible, onClose, onSelectTime, initialTime}) => {
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    if (initialTime) {
      // Parse time string like "10:00 AM" to Date object
      const [time, period] = initialTime.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours, 10);

      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }

      const date = new Date();
      date.setHours(hour, parseInt(minutes, 10), 0, 0);
      setSelectedTime(date);
    }
  }, [initialTime]);

  const handleTimeChange = (event, date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        const timeString = formatTime(date);
        onSelectTime(timeString);
        onClose();
      } else if (event.type === 'dismissed') {
        onClose();
      }
    } else {
      if (date) {
        setSelectedTime(date);
      }
    }
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12

    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesStr} ${period}`;
  };

  const handleConfirm = () => {
    const timeString = formatTime(selectedTime);
    onSelectTime(timeString);
    onClose();
  };

  if (Platform.OS === 'android') {
    return visible ? (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        is24Hour={false}
        display="default"
        onChange={handleTimeChange}
      />
    ) : null;
  }

  // iOS Modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Time</Text>
          </View>
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleTimeChange}
            textColor={COLORS.brandDarkest}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.7}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray100,
  },
  confirmButton: {
    backgroundColor: COLORS.brandPrimary,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDark,
  },
  confirmButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
});

export default TimePickerModal;
