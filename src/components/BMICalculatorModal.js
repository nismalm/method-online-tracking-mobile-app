import React, {useState, useRef} from 'react';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import {captureRef} from 'react-native-view-shot';
import Share from 'react-native-share';
import {TextInput, Button, Dropdown} from '../components';
import {getCompleteBMIAnalysis} from '../utils/bmiCalculator';
import {GENDER_OPTIONS} from '../constants';
import ShareIcon from '../../assets/icons/shareIcon';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

const BMICalculatorModal = ({visible, onClose}) => {
  // Form state
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');

  // BMI result state
  const [bmiResult, setBmiResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Share functionality
  const bmiResultRef = useRef();
  const [isSharing, setIsSharing] = useState(false);

  // Reset form
  const resetForm = () => {
    setAge('');
    setHeight('');
    setWeight('');
    setGender('');
    setBmiResult(null);
    setShowResult(false);
  };

  // Handle calculate BMI
  const handleCalculate = () => {
    // Validate inputs
    if (!age || !height || !weight || !gender) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const ageNum = parseInt(age, 10);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (ageNum < 1 || ageNum > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120');
      return;
    }

    if (heightNum < 50 || heightNum > 300) {
      Alert.alert('Invalid Height', 'Please enter a valid height between 50 and 300 cm');
      return;
    }

    if (weightNum < 10 || weightNum > 500) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 10 and 500 kg');
      return;
    }

    // Calculate BMI
    const result = getCompleteBMIAnalysis(weightNum, heightNum, gender, ageNum);
    setBmiResult(result);
    setShowResult(true);
  };

  // Handle share BMI result
  const handleShareBMI = async () => {
    try {
      setIsSharing(true);

      // Capture the BMI result section as PNG
      const uri = await captureRef(bmiResultRef, {
        format: 'png',
        quality: 1.0,
      });

      const fileName = 'BMI_Analysis.png';
      const messageToShare =
        'Check out your BMI Analysis!\n\n– Powered by METHOD';

      // Share the captured image
      await Share.open({
        url: `file://${uri}`,
        title: 'Share BMI Analysis',
        message: messageToShare,
        filename: fileName,
      });

      setIsSharing(false);
    } catch (error) {
      setIsSharing(false);

      // User cancelled share - not an error
      if (error.message && error.message.includes('User did not share')) {
        return;
      }

      console.error('Share failed:', error);
      Alert.alert('Error', 'Failed to share BMI analysis. Please try again.');
    }
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle back from result
  const handleBackFromResult = () => {
    setShowResult(false);
  };

  return (
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
                {showResult ? 'BMI Analysis Result' : 'BMI Calculator'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {!showResult ? (
              // Input Form
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.description}>
                  Enter your details below to calculate your Body Mass Index (BMI)
                </Text>

                {/* Age Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Age"
                    value={age}
                    onChangeText={(text) => {
                      const numbers = text.replace(/\D/g, '').slice(0, 3);
                      setAge(numbers);
                    }}
                    placeholder="Enter your age"
                    keyboardType="numeric"
                  />
                </View>

                {/* Gender Dropdown */}
                <View style={styles.inputWrapper}>
                  <Dropdown
                    label="Gender"
                    value={gender}
                    onValueChange={setGender}
                    items={GENDER_OPTIONS}
                    placeholder="Select gender"
                  />
                </View>

                {/* Height Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Height (cm)"
                    value={height}
                    onChangeText={(text) => {
                      const numbers = text.replace(/[^0-9.]/g, '');
                      setHeight(numbers);
                    }}
                    placeholder="Enter height in cm"
                    keyboardType="numeric"
                  />
                </View>

                {/* Weight Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Weight (kg)"
                    value={weight}
                    onChangeText={(text) => {
                      const numbers = text.replace(/[^0-9.]/g, '');
                      setWeight(numbers);
                    }}
                    placeholder="Enter weight in kg"
                    keyboardType="numeric"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <View style={styles.flex1}>
                    <Button title="Cancel" onPress={handleClose} variant="outline" />
                  </View>
                  <View style={styles.flex1}>
                    <Button
                      title="Calculate BMI"
                      onPress={handleCalculate}
                      disabled={!age || !height || !weight || !gender}
                    />
                  </View>
                </View>
              </ScrollView>
            ) : (
              // BMI Result Display
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* BMI Result Box - This will be captured for sharing */}
                <View
                  ref={bmiResultRef}
                  collapsable={false}
                  style={styles.resultBox}>
                  {/* Logo */}
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('../../assets/logo/method_logo_lg.png')}
                      style={styles.modalLogo}
                      resizeMode="contain"
                    />
                  </View>

                  {/* BMI Analysis */}
                  {bmiResult && (
                    <View style={styles.bmiContainer}>
                      <Text style={styles.bmiTitle}>BMI ANALYSIS</Text>

                      {/* BMI Score */}
                      <View style={styles.bmiRow}>
                        <Text style={styles.bmiLabel}>BMI Score:</Text>
                        <Text style={styles.bmiValue}>{bmiResult.bmi}</Text>
                      </View>

                      {/* BMI Category */}
                      <View style={styles.bmiRow}>
                        <Text style={styles.bmiLabel}>Category:</Text>
                        <View style={styles.bmiCategoryRow}>
                          <View
                            style={[
                              styles.bmiColorDot,
                              {backgroundColor: bmiResult.color},
                            ]}
                          />
                          <Text style={styles.bmiCategoryText}>
                            {bmiResult.category}
                          </Text>
                        </View>
                      </View>

                      {/* Current Weight */}
                      <View style={styles.bmiRow}>
                        <Text style={styles.bmiLabel}>Current Weight:</Text>
                        <Text style={styles.bmiCategoryText}>
                          {weight} kg
                        </Text>
                      </View>

                      {/* Target Weight Range */}
                      <View style={styles.bmiRow}>
                        <Text style={styles.bmiLabel}>Target Weight:</Text>
                        <Text style={styles.bmiCategoryText}>
                          {bmiResult.targetWeightRange?.min} -{' '}
                          {bmiResult.targetWeightRange?.max} kg
                        </Text>
                      </View>

                      {/* Target BMI Range */}
                      <View style={styles.bmiRow}>
                        <Text style={styles.bmiLabel}>Target BMI:</Text>
                        <Text style={styles.bmiCategoryText}>
                          {bmiResult.targetBMIRange?.min} -{' '}
                          {bmiResult.targetBMIRange?.max}
                        </Text>
                      </View>

                      {/* Weight Recommendation */}
                      {bmiResult.weightToLose > 0 && (
                        <View style={styles.recommendationOrange}>
                          <Text style={styles.recommendationOrangeText}>
                            {bmiResult.recommendation}
                          </Text>
                        </View>
                      )}

                      {bmiResult.weightToGain > 0 && (
                        <View style={styles.recommendationGreen}>
                          <Text style={styles.recommendationGreenText}>
                            {bmiResult.recommendation}
                          </Text>
                        </View>
                      )}

                      {bmiResult.weightToLose === 0 &&
                        bmiResult.weightToGain === 0 && (
                          <View style={styles.recommendationGreen}>
                            <Text style={styles.recommendationGreenText}>
                              {bmiResult.recommendation}
                            </Text>
                          </View>
                        )}

                      {/* Remark */}
                      <Text style={styles.bmiRemark}>{bmiResult.remark}</Text>
                    </View>
                  )}
                </View>

                {/* Share Button */}
                <TouchableOpacity
                  onPress={handleShareBMI}
                  disabled={isSharing}
                  style={[styles.shareButton, isSharing && styles.disabledButton]}>
                  {isSharing ? (
                    <ActivityIndicator size="small" color={COLORS.brandSecondary} />
                  ) : (
                    <View style={styles.shareButtonContent}>
                      <ShareIcon width={18} height={18} fill={COLORS.brandSecondary} />
                      <Text style={styles.shareButtonText}>Share</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <View style={styles.flex1}>
                    <Button
                      title="Calculate Again"
                      onPress={handleBackFromResult}
                      variant="outline"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Button title="Done" onPress={handleClose} />
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    lineHeight: 32,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resultBox: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalLogo: {
    width: 200,
    height: 60,
  },
  bmiContainer: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
  },
  bmiTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bmiLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandTextSecondary,
  },
  bmiValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
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
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
  recommendationOrange: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  recommendationOrangeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: '#92400E',
    textAlign: 'center',
  },
  recommendationGreen: {
    backgroundColor: '#D1FAE5',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  recommendationGreenText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: '#065F46',
    textAlign: 'center',
  },
  bmiRemark: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  shareButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandSecondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandSecondary,
    marginLeft: 8,
  },
});

export default BMICalculatorModal;
