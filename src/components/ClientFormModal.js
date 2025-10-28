import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {TextInput, Button, Dropdown} from '../components';
import ClientService from '../services/clientService';
import * as DayCalculator from '../utils/dayCalculator';
import {useAuth} from '../context/AuthContext';
import {
  PACKAGE_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  GENDER_OPTIONS,
  TRAINING_MODE_OPTIONS,
  VALIDATION_RULES,
} from '../constants';
import {COLORS, FONTS, FONT_SIZES} from '../constants/theme';

// Validation functions
const validateField = (fieldName, value) => {
  const trimmedValue = value?.trim() || '';

  switch (fieldName) {
    case 'name':
      if (!trimmedValue) return 'Name is required';
      if (trimmedValue.length < VALIDATION_RULES.name.minLength) {
        return 'Name must be at least 2 characters';
      }
      return '';

    case 'mobile':
      if (!trimmedValue) return 'Mobile number is required';
      if (!VALIDATION_RULES.mobile.pattern.test(trimmedValue)) {
        return 'Please enter a valid mobile number with country code';
      }
      return '';

    case 'age':
      if (!trimmedValue) return 'Age is required';
      const age = parseInt(trimmedValue, 10);
      if (age < VALIDATION_RULES.age.min || age > VALIDATION_RULES.age.max) {
        return `Age must be between ${VALIDATION_RULES.age.min} and ${VALIDATION_RULES.age.max}`;
      }
      return '';

    case 'height':
      if (!trimmedValue) return 'Height is required';
      const height = parseFloat(trimmedValue);
      if (height < VALIDATION_RULES.height.min || height > VALIDATION_RULES.height.max) {
        return `Height must be between ${VALIDATION_RULES.height.min} and ${VALIDATION_RULES.height.max} cm`;
      }
      return '';

    case 'startingWeight':
      if (!trimmedValue) return 'Starting weight is required';
      const weight = parseFloat(trimmedValue);
      if (weight < VALIDATION_RULES.weight.min || weight > VALIDATION_RULES.weight.max) {
        return `Weight must be between ${VALIDATION_RULES.weight.min} and ${VALIDATION_RULES.weight.max} kg`;
      }
      return '';

    case 'gender':
      if (!trimmedValue) return 'Gender is required';
      return '';

    case 'bloodGroup':
      if (!trimmedValue) return 'Blood group is required';
      return '';

    case 'packageType':
      if (!trimmedValue) return 'Package is required';
      return '';

    case 'trainingMode':
      if (!trimmedValue) return 'Training mode is required';
      return '';

    default:
      return '';
  }
};

// Utility functions
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const copyToClipboard = async (text, label) => {
  try {
    const Clipboard = (await import('@react-native-clipboard/clipboard')).default;
    await Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  } catch (error) {
    console.error('Clipboard error:', error);
    Alert.alert('Error', 'Failed to copy to clipboard');
  }
};

const ClientFormModal = ({visible, onClose, onClientAdded, client = null, mode = 'add'}) => {
  const {user} = useAuth();
  const clientService = useMemo(() => new ClientService(), []);
  const isEditMode = mode === 'edit' && client !== null;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '',
    bloodGroup: '',
    height: '',
    startingWeight: '',
    packageType: '',
    trainingMode: '',
  });

  const [startDate, setStartDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date()); // Temporary date for iOS picker
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdLoginCode, setCreatedLoginCode] = useState('');
  const [createdBMIData, setCreatedBMIData] = useState(null);

  // Populate form data when editing
  useEffect(() => {
    if (isEditMode && client) {
      setFormData({
        name: client.name || '',
        mobile: client.mobile || '',
        age: String(client.age) || '',
        gender: client.gender || '',
        bloodGroup: client.bloodGroup || '',
        height: String(client.height) || '',
        startingWeight: String(client.startingWeight) || '',
        packageType: String(client.package) || '',
        trainingMode: client.trainingMode || '',
      });

      // Parse and set start date
      if (client.startDate) {
        const parts = client.startDate.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          const date = new Date(year, month - 1, day);
          setStartDate(date);
          setTempDate(date);
        }
      }
    }
  }, [isEditMode, client]);

  // Update form field
  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => ({...prev, [fieldName]: value}));
    // Clear error for this field
    setErrors(prev => ({...prev, [fieldName]: ''}));
  }, []);

  // Handle date picker change - Android immediately updates, iOS updates temp
  const handleDateChange = useCallback((event, selectedDate) => {
    if (Platform.OS === 'android') {
      // Android: close picker and update if user confirmed
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setStartDate(selectedDate);
        setErrors(prev => ({...prev, startDate: ''}));
      }
    } else {
      // iOS: just update the temporary date while user is scrolling
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  }, []);

  // Handle iOS date picker confirm
  const handleIOSDateConfirm = useCallback(() => {
    setStartDate(tempDate);
    setShowDatePicker(false);
    setErrors(prev => ({...prev, startDate: ''}));
  }, [tempDate]);

  // Handle iOS date picker cancel
  const handleIOSDateCancel = useCallback(() => {
    setShowDatePicker(false);
    setTempDate(startDate); // Reset temp date to current start date
  }, [startDate]);

  // Open date picker
  const openDatePicker = useCallback(() => {
    setTempDate(startDate); // Initialize temp date with current start date
    setShowDatePicker(true);
  }, [startDate]);

  // Validate all fields
  const validateAllFields = useCallback(() => {
    const newErrors = {};
    let hasErrors = false;

    Object.keys(formData).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateAllFields()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        const packageDays = parseInt(formData.packageType.trim(), 10);
        const newStartDate = formatDate(startDate);
        const newEndDate = DayCalculator.calculateEndDate(newStartDate, packageDays);

        // Calculate what the status should be based on the new dates
        // Create a temporary client object to analyze
        const tempClient = {
          ...client,
          startDate: newStartDate,
          endDate: newEndDate,
          package: packageDays,
          pauseHistory: client.pauseHistory || [],
        };

        // Get day analysis to determine correct status
        const dayAnalysis = DayCalculator.getClientDayAnalysis(tempClient);

        // Determine new status
        let newStatus = client.status;

        // Only auto-update status if client is currently active or completed
        // Don't change status if paused or stopped (those are manual states)
        if (client.status === 'active' || client.status === 'completed') {
          if (dayAnalysis.isCompleted) {
            newStatus = 'completed';
          } else {
            newStatus = 'active';
          }
        }

        // Update existing client
        const updateData = {
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          age: parseInt(formData.age.trim(), 10),
          gender: formData.gender.trim(),
          bloodGroup: formData.bloodGroup.trim(),
          height: parseFloat(formData.height.trim()),
          startingWeight: parseFloat(formData.startingWeight.trim()),
          package: packageDays,
          trainingMode: formData.trainingMode.trim(),
          startDate: newStartDate,
          endDate: newEndDate,
          status: newStatus,
        };

        const result = await clientService.updateClient(client.id, updateData);

        if (result.success) {
          Alert.alert('Success', 'Client updated successfully');
          onClientAdded?.(); // Refresh the list
          handleClose();
        } else {
          Alert.alert('Error', result.error || 'Failed to update client');
        }
      } else {
        // Create new client
        const clientData = {
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          age: formData.age.trim(),
          gender: formData.gender.trim(),
          bloodGroup: formData.bloodGroup.trim(),
          height: formData.height.trim(),
          startingWeight: formData.startingWeight.trim(),
          package: formData.packageType.trim(),
          trainingMode: formData.trainingMode.trim(),
        };

        // Validate all fields are present
        const missingFields = Object.entries(clientData).filter(([, value]) => !value);
        if (missingFields.length > 0 || !startDate) {
          Alert.alert('Error', 'Please fill in all required fields');
          return;
        }

        const createdByUid = user?.uid || 'unknown';
        const formattedStartDate = formatDate(startDate);
        const result = await clientService.createClient(
          clientData,
          createdByUid,
          formattedStartDate
        );

        if (result.success) {
          handleClientCreated(result.loginCode, result.bmiAnalysis);
          onClientAdded?.();
        } else {
          Alert.alert('Error', result.error || 'Failed to create client');
        }
      }
    } catch (error) {
      console.error(`${isEditMode ? 'Update' : 'Create'} client error:`, error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [formData, startDate, user, clientService, onClientAdded, validateAllFields, isEditMode, client, handleClose, handleClientCreated]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      mobile: '',
      age: '',
      gender: '',
      bloodGroup: '',
      height: '',
      startingWeight: '',
      packageType: '',
      trainingMode: '',
    });
    setStartDate(new Date());
    setErrors({});
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onClose();
    }
  }, [loading, resetForm, onClose]);

  // Handle success modal close
  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    setCreatedBMIData(null);
    setCreatedLoginCode('');
    resetForm();
  }, [resetForm]);

  // Handle client created
  const handleClientCreated = useCallback((loginCode, bmiAnalysis) => {
    setCreatedLoginCode(loginCode);
    setCreatedBMIData(bmiAnalysis);
    onClose();
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
  }, [onClose]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return Object.values(formData).every(value => value.trim() !== '');
  }, [formData]);

  return (
    <>
      {/* Main Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex1}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  {isEditMode ? 'Edit Client' : 'Add New Client'}
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={loading}
                  style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Name Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Full Name"
                    value={formData.name}
                    onChangeText={(text) => updateField('name', text)}
                    placeholder="Enter client's full name"
                    autoCapitalize="words"
                    error={errors.name}
                    editable={!loading}
                  />
                </View>

                {/* Mobile Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Mobile Number"
                    value={formData.mobile}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9+]/g, '').slice(0, 16);
                      updateField('mobile', cleaned);
                    }}
                    placeholder="Enter mobile number with country code"
                    keyboardType="phone-pad"
                    error={errors.mobile}
                    editable={!loading}
                  />
                  <Text style={styles.helperText}>
                    Enter mobile number with country code (e.g., +1234567890)
                  </Text>
                </View>

                {/* Package Dropdown */}
                <View style={styles.inputWrapper}>
                  <Dropdown
                    label="Package"
                    value={formData.packageType}
                    onValueChange={(value) => updateField('packageType', value)}
                    items={PACKAGE_OPTIONS}
                    placeholder="Select package duration"
                    error={errors.packageType}
                    disabled={loading}
                  />
                </View>

                {/* Training Mode Dropdown */}
                <View style={styles.inputWrapper}>
                  <Dropdown
                    label="Training Mode"
                    value={formData.trainingMode}
                    onValueChange={(value) => updateField('trainingMode', value)}
                    items={TRAINING_MODE_OPTIONS}
                    placeholder="Select training mode"
                    error={errors.trainingMode}
                    disabled={loading}
                  />
                </View>

                {/* Blood Group Dropdown */}
                <View style={styles.inputWrapper}>
                  <Dropdown
                    label="Blood Group"
                    value={formData.bloodGroup}
                    onValueChange={(value) => updateField('bloodGroup', value)}
                    items={BLOOD_GROUP_OPTIONS}
                    placeholder="Select blood group"
                    error={errors.bloodGroup}
                    disabled={loading}
                  />
                </View>

                {/* Age Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Age"
                    value={formData.age}
                    onChangeText={(text) => {
                      const numbers = text.replace(/\D/g, '').slice(0, 3);
                      updateField('age', numbers);
                    }}
                    placeholder="Enter age"
                    keyboardType="numeric"
                    error={errors.age}
                    editable={!loading}
                  />
                </View>

                {/* Gender Dropdown */}
                <View style={styles.inputWrapper}>
                  <Dropdown
                    label="Gender"
                    value={formData.gender}
                    onValueChange={(value) => updateField('gender', value)}
                    items={GENDER_OPTIONS}
                    placeholder="Select gender"
                    error={errors.gender}
                    disabled={loading}
                  />
                </View>

                {/* Start Date Picker */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.dateLabel}>
                    Start Date
                  </Text>
                  <TouchableOpacity
                    onPress={openDatePicker}
                    disabled={loading}
                    style={[
                      styles.datePickerButton,
                      errors.startDate && styles.datePickerButtonError,
                      loading && styles.datePickerButtonDisabled,
                    ]}>
                    <Text
                      style={[
                        styles.datePickerText,
                        !startDate && styles.datePickerTextPlaceholder,
                      ]}>
                      {startDate ? formatDate(startDate) : 'Select start date'}
                    </Text>
                  </TouchableOpacity>
                  {errors.startDate ? (
                    <Text style={styles.errorText}>
                      {errors.startDate}
                    </Text>
                  ) : null}

                  {/* iOS Inline Date Picker */}
                  {Platform.OS === 'ios' && showDatePicker && (
                    <View style={{
                      marginTop: 12,
                      backgroundColor: '#ffffff',
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: '#e0fe66',
                      padding: 16,
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 4,
                    }}>
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="inline"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(2020, 0, 1)}
                        themeVariant="light"
                      />
                      <View style={{
                        flexDirection: 'row',
                        gap: 12,
                        marginTop: 16,
                      }}>
                        <TouchableOpacity
                          onPress={handleIOSDateCancel}
                          style={{
                            flex: 1,
                            paddingVertical: 14,
                            paddingHorizontal: 20,
                            backgroundColor: '#ffffff',
                            borderWidth: 2,
                            borderColor: '#e5e5e5',
                            borderRadius: 12,
                            alignItems: 'center',
                          }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#3c3c3c',
                          }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleIOSDateConfirm}
                          style={{
                            flex: 1,
                            paddingVertical: 14,
                            paddingHorizontal: 20,
                            backgroundColor: '#040404',
                            borderWidth: 2,
                            borderColor: '#e0fe66',
                            borderRadius: 12,
                            alignItems: 'center',
                          }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: '#e0fe66',
                          }}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Height Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Height (cm)"
                    value={formData.height}
                    onChangeText={(text) => {
                      const numbers = text.replace(/[^0-9.]/g, '');
                      updateField('height', numbers);
                    }}
                    placeholder="Enter height in cm"
                    keyboardType="numeric"
                    error={errors.height}
                    editable={!loading}
                  />
                  <Text style={styles.helperText}>
                    Height will be saved as "X cm"
                  </Text>
                </View>

                {/* Starting Weight Input */}
                <View style={styles.inputWrapperLarge}>
                  <TextInput
                    label="Starting Weight (kg)"
                    value={formData.startingWeight}
                    onChangeText={(text) => {
                      const numbers = text.replace(/[^0-9.]/g, '');
                      updateField('startingWeight', numbers);
                    }}
                    placeholder="Enter starting weight in kg"
                    keyboardType="numeric"
                    error={errors.startingWeight}
                    editable={!loading}
                  />
                  <Text style={styles.helperText}>
                    Weight will be saved as "X KG"
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <View style={styles.flex1}>
                    <Button
                      title="Cancel"
                      onPress={handleClose}
                      variant="outline"
                      disabled={loading}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Button
                      title={isEditMode ? 'Update Client' : 'Create Client'}
                      onPress={handleSubmit}
                      loading={loading}
                      disabled={loading || !isFormValid}
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker - Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(2020, 0, 1)}
        />
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleSuccessModalClose}>
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successCheckmark}>
                  ✓
                </Text>
              </View>
              <Text style={styles.successTitle}>
                Client Created Successfully
              </Text>
              <Text style={styles.successSubtitle}>
                Client has been added to the system!
              </Text>
            </View>

            {/* Login Code */}
            <View style={styles.loginCodeContainer}>
              <Text style={styles.loginCodeLabel}>
                CLIENT LOGIN CODE
              </Text>
              <View style={styles.loginCodeRow}>
                <Text style={styles.loginCodeText}>
                  {createdLoginCode}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(createdLoginCode, 'Login Code')}
                  style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>
                    COPY
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BMI Analysis */}
            {createdBMIData && (
              <View style={styles.bmiContainer}>
                <Text style={styles.bmiTitle}>
                  BMI ANALYSIS
                </Text>

                {/* BMI Score */}
                <View style={styles.bmiRow}>
                  <Text style={styles.bmiLabel}>
                    BMI Score:
                  </Text>
                  <Text style={styles.bmiValue}>
                    {createdBMIData.bmi}
                  </Text>
                </View>

                {/* BMI Category */}
                <View style={styles.bmiRow}>
                  <Text style={styles.bmiLabel}>
                    Category:
                  </Text>
                  <View style={styles.bmiCategoryRow}>
                    <View
                      style={[styles.bmiColorDot, {backgroundColor: createdBMIData.color}]}
                    />
                    <Text style={styles.bmiCategoryText}>
                      {createdBMIData.category}
                    </Text>
                  </View>
                </View>

                {/* Target Weight Range */}
                <View style={styles.bmiRow}>
                  <Text style={styles.bmiLabel}>
                    Target Weight:
                  </Text>
                  <Text style={styles.bmiCategoryText}>
                    {createdBMIData.targetWeightRange?.min} -{' '}
                    {createdBMIData.targetWeightRange?.max} kg
                  </Text>
                </View>

                {/* Target BMI Range */}
                <View style={styles.bmiRow}>
                  <Text style={styles.bmiLabel}>
                    Target BMI:
                  </Text>
                  <Text style={styles.bmiCategoryText}>
                    {createdBMIData.targetBMIRange?.min} -{' '}
                    {createdBMIData.targetBMIRange?.max}
                  </Text>
                </View>

                {/* Weight Recommendation */}
                {createdBMIData.weightToLose > 0 && (
                  <View style={styles.recommendationOrange}>
                    <Text style={styles.recommendationOrangeText}>
                      {createdBMIData.recommendation}
                    </Text>
                  </View>
                )}

                {createdBMIData.weightToGain > 0 && (
                  <View style={styles.recommendationGreen}>
                    <Text style={styles.recommendationGreenText}>
                      {createdBMIData.recommendation}
                    </Text>
                  </View>
                )}

                {createdBMIData.weightToLose === 0 &&
                  createdBMIData.weightToGain === 0 && (
                    <View style={styles.recommendationGreen}>
                      <Text style={styles.recommendationGreenText}>
                        {createdBMIData.recommendation}
                      </Text>
                    </View>
                  )}

                {/* Remark */}
                <Text style={styles.bmiRemark}>
                  {createdBMIData.remark}
                </Text>
              </View>
            )}

            {/* Info Message */}
            <View style={styles.infoMessage}>
              <Text style={styles.infoMessageText}>
                This login code will be used for client authentication in the
                system.
              </Text>
            </View>

            {/* OK Button */}
            <Button title="OK" onPress={handleSuccessModalClose} />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.gray500,
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.medium,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputWrapperLarge: {
    marginBottom: 24,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.darkest,
    marginBottom: 8,
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  datePickerButtonError: {
    borderColor: '#ef4444',
  },
  datePickerButtonDisabled: {
    opacity: 0.5,
  },
  datePickerText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.darkest,
  },
  datePickerTextPlaceholder: {
    color: COLORS.textSecondary,
  },
  errorText: {
    color: '#ef4444',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  successModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
  },
  successModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    backgroundColor: COLORS.brandDark,
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successCheckmark: {
    color: COLORS.brandSecondary,
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.bold,
  },
  successTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    fontFamily: FONTS.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  loginCodeContainer: {
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  loginCodeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  loginCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loginCodeText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.gray900,
    fontFamily: FONTS.bold,
    flex: 1,
  },
  copyButton: {
    marginLeft: 8,
    backgroundColor: COLORS.brandDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButtonText: {
    color: COLORS.brandSecondary,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
  },
  bmiContainer: {
    backgroundColor: COLORS.blue50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bmiTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.blue600,
    fontFamily: FONTS.bold,
    marginBottom: 12,
    textAlign: 'center',
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bmiLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.blue800,
    fontFamily: FONTS.medium,
  },
  bmiValue: {
    fontSize: FONT_SIZES.lg,
    color: '#1e3a8a',
    fontFamily: FONTS.bold,
  },
  bmiCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bmiColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  bmiCategoryText: {
    fontSize: FONT_SIZES.sm,
    color: '#1e3a8a',
    fontFamily: FONTS.bold,
  },
  recommendationOrange: {
    backgroundColor: '#fed7aa',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationOrangeText: {
    fontSize: FONT_SIZES.xs,
    color: '#9a3412',
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  recommendationGreen: {
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationGreenText: {
    fontSize: FONT_SIZES.xs,
    color: '#166534',
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  bmiRemark: {
    fontSize: FONT_SIZES.xs,
    color: '#1d4ed8',
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  infoMessage: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoMessageText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.dark,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
});

export default ClientFormModal;
