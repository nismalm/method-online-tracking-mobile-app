import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {TextInput, Button} from '../components';
import {COLORS, FONTS, FONT_SIZES} from '../constants/theme';

const StopModal = ({visible, onClose, onConfirm, clientName}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    await onConfirm(reason.trim());
    setIsSubmitting(false);
    setReason(''); // Reset for next time
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <Text style={styles.modalTitle}>Stop Client Package</Text>
            <Text style={styles.modalSubtitle}>
              {clientName}
            </Text>
            <Text style={styles.warningText}>
              This will stop the client's package. They can be renewed later.
            </Text>

            {/* Reason Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Reason for stopping *</Text>
              <TextInput
                placeholder="Enter reason why client is stopped"
                value={reason}
                onChangeText={setReason}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                style={styles.textArea}
              />
            </View>

            {/* Actions */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isSubmitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <Button
                title={isSubmitting ? 'Stopping...' : 'Stop Package'}
                onPress={handleConfirm}
                disabled={!reason.trim() || isSubmitting}
                style={[
                  styles.button,
                  styles.confirmButton,
                  (!reason.trim() || isSubmitting) && styles.disabledButton,
                ]}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.darkest,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.darkest,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.dark,
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default StopModal;
