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
import {Dropdown, Button} from '../components';
import {PACKAGE_OPTIONS} from '../constants/formOptions';
import {COLORS, FONTS, FONT_SIZES} from '../constants/theme';

const RenewalModal = ({visible, onClose, onConfirm, client}) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedPackage) {
      return;
    }

    setIsSubmitting(true);
    await onConfirm(parseInt(selectedPackage, 10));
    setIsSubmitting(false);
    setSelectedPackage(null); // Reset for next time
  };

  const handleClose = () => {
    setSelectedPackage(null);
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
            <Text style={styles.modalTitle}>Renew Package</Text>
            <Text style={styles.modalSubtitle}>
              {client?.name}
            </Text>

            {/* Previous Package Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Previous Package:</Text>
              <Text style={styles.infoValue}>{client?.package} days</Text>
            </View>

            {/* Previous Status */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Previous Status:</Text>
              <Text style={[styles.infoValue, styles.statusText]}>
                {client?.status?.charAt(0).toUpperCase() + client?.status?.slice(1)}
              </Text>
            </View>

            {/* Stopped Reason - Only show if client was stopped */}
            {client?.status === 'stopped' && client?.stoppedReason && (
              <View style={styles.stoppedReasonContainer}>
                <Text style={styles.stoppedReasonLabel}>
                  Reason for Stopping:
                </Text>
                <Text style={styles.stoppedReasonText}>
                  {client.stoppedReason}
                </Text>
                {client?.stoppedAt && (
                  <Text style={styles.stoppedAtText}>
                    Stopped on:{' '}
                    {new Date(client.stoppedAt.toDate ? client.stoppedAt.toDate() : client.stoppedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                )}
              </View>
            )}

            {/* Package Selection */}
            <View style={styles.inputContainer}>
              <Dropdown
                label="Select New Package *"
                items={PACKAGE_OPTIONS}
                value={selectedPackage}
                onValueChange={setSelectedPackage}
                placeholder="Select package duration"
                searchable={false}
              />
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              {client?.status === 'stopped'
                ? 'Review the reason above. The package will be renewed with a new start date from today and previous history will be preserved.'
                : "The client's package will be renewed with a new start date from today. Previous package history will be preserved."
              }
            </Text>

            {/* Actions */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isSubmitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <Button
                title={isSubmitting ? 'Renewing...' : 'Renew Package'}
                variant="secondary"
                onPress={handleConfirm}
                disabled={!selectedPackage || isSubmitting}
                style={[
                  styles.button,
                  styles.confirmButton,
                  (!selectedPackage || isSubmitting) && styles.disabledButton,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.dark,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.darkest,
  },
  statusText: {
    textTransform: 'capitalize',
  },
  stoppedReasonContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  stoppedReasonLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: '#991B1B',
    marginBottom: 6,
  },
  stoppedReasonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: '#7F1D1D',
    lineHeight: 22,
    marginBottom: 8,
  },
  stoppedAtText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: '#991B1B',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.darkest,
    marginBottom: 8,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: COLORS.brandPrimary,
    color: COLORS.brandDarkest,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default RenewalModal;
