import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TextInput, Button} from '../components';
import Header from '../components/Header';
import MealCard from '../components/diet/MealCard';
import SupplementRow from '../components/diet/SupplementRow';
import GoalNoteItem from '../components/diet/GoalNoteItem';
import {
  generateId,
  DEFAULT_DAILY_GOALS,
  DEFAULT_GENERAL_NOTES,
  DEFAULT_MEAL_NAMES,
  VALIDATION_RULES,
} from '../constants/dietDefaults';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

const DietChartBuilderScreen = ({navigation}) => {
  const scrollViewRef = useRef(null);
  const [scrollToMealId, setScrollToMealId] = useState(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [meals, setMeals] = useState([
    {
      id: generateId(),
      name: DEFAULT_MEAL_NAMES[0],
      time: '',
      carbs: [],
      proteins: [],
      others: [],
      notes: '',
    },
  ]);
  const [dailyGoals, setDailyGoals] = useState(
    DEFAULT_DAILY_GOALS.map((text) => ({id: generateId(), text}))
  );
  const [showSupplements, setShowSupplements] = useState(false);
  const [supplements, setSupplements] = useState([]);
  const [generalNotes, setGeneralNotes] = useState(
    DEFAULT_GENERAL_NOTES.map((text) => ({id: generateId(), text}))
  );
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate client name
    const trimmedName = clientName.trim();
    if (!trimmedName) {
      newErrors.clientName = 'Client name is required';
    } else if (trimmedName.length < VALIDATION_RULES.clientName.minLength) {
      newErrors.clientName = 'Name must be at least 2 characters';
    } else if (trimmedName.length > VALIDATION_RULES.clientName.maxLength) {
      newErrors.clientName = 'Name must not exceed 50 characters';
    } else if (!VALIDATION_RULES.clientName.pattern.test(trimmedName)) {
      newErrors.clientName = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Validate meals
    meals.forEach((meal, index) => {
      const hasFoodItems =
        meal.carbs.length > 0 || meal.proteins.length > 0 || meal.others.length > 0;

      if (!hasFoodItems) {
        newErrors[`meal_${meal.id}`] = 'Each meal must have at least one food item';
      }

      if (!meal.time) {
        newErrors[`meal_time_${meal.id}`] = 'Time is required for each meal';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [clientName, meals]);

  // Meal Handlers
  const handleAddMeal = useCallback(() => {
    if (meals.length >= VALIDATION_RULES.maxMeals) {
      Alert.alert('Maximum Meals', `You can add maximum ${VALIDATION_RULES.maxMeals} meals`);
      return;
    }

    const newMeal = {
      id: generateId(),
      name: DEFAULT_MEAL_NAMES[meals.length] || `Meal ${meals.length + 1}`,
      time: '',
      carbs: [],
      proteins: [],
      others: [],
      notes: '',
    };

    setMeals([...meals, newMeal]);
    setScrollToMealId(newMeal.id);
  }, [meals]);

  // Handle meal layout - scroll to position when new meal is rendered
  const handleMealLayout = useCallback((mealId, event) => {
    if (scrollToMealId === mealId) {
      const {y} = event.nativeEvent.layout;

      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, y - 20),
          animated: true,
        });
        setScrollToMealId(null);
      });
    }
  }, [scrollToMealId]);

  const handleUpdateMeal = useCallback((updatedMeal) => {
    setMeals((prevMeals) =>
      prevMeals.map((meal) => (meal.id === updatedMeal.id ? updatedMeal : meal))
    );
  }, []);

  const handleDeleteMeal = useCallback((mealId) => {
    setMeals((prevMeals) => {
      if (prevMeals.length <= VALIDATION_RULES.minMeals) {
        Alert.alert('Minimum Meals', 'At least one meal is required');
        return prevMeals;
      }
      return prevMeals.filter((meal) => meal.id !== mealId);
    });
  }, []);

  // Supplement Handlers
  const handleAddSupplement = useCallback(() => {
    const newSupplement = {
      id: generateId(),
      name: '',
      timing: '',
      note: '',
    };
    setSupplements([...supplements, newSupplement]);
  }, [supplements]);

  const handleUpdateSupplement = useCallback((id, field, value) => {
    setSupplements((prevSupplements) =>
      prevSupplements.map((supplement) =>
        supplement.id === id ? {...supplement, [field]: value} : supplement
      )
    );
  }, []);

  const handleDeleteSupplement = useCallback((id) => {
    setSupplements((prevSupplements) =>
      prevSupplements.filter((supplement) => supplement.id !== id)
    );
  }, []);

  // Daily Goal Handlers
  const handleAddDailyGoal = useCallback(() => {
    const newGoal = {id: generateId(), text: ''};
    setDailyGoals([...dailyGoals, newGoal]);
  }, [dailyGoals]);

  const handleUpdateDailyGoal = useCallback((id, text) => {
    setDailyGoals((prevGoals) =>
      prevGoals.map((goal) => (goal.id === id ? {...goal, text} : goal))
    );
  }, []);

  const handleDeleteDailyGoal = useCallback((id) => {
    setDailyGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));
  }, []);

  // General Note Handlers
  const handleAddGeneralNote = useCallback(() => {
    const newNote = {id: generateId(), text: ''};
    setGeneralNotes([...generalNotes, newNote]);
  }, [generalNotes]);

  const handleUpdateGeneralNote = useCallback((id, text) => {
    setGeneralNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? {...note, text} : note))
    );
  }, []);

  const handleDeleteGeneralNote = useCallback((id) => {
    setGeneralNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
  }, []);

  // Generate and Share
  const handleGenerateAndShare = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before generating');
      return;
    }

    setIsGenerating(true);

    try {
      // Format current date as DD-MM-YYYY
      const today = new Date();
      const date = `${String(today.getDate()).padStart(2, '0')}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${today.getFullYear().toString().slice(-2)}`;

      const dietData = {
        clientName: clientName.trim(),
        date,
        meals,
        dailyGoals,
        supplements: showSupplements ? supplements : [],
        generalNotes,
      };

      // Navigate to preview/export screen
      navigation.navigate('DietChartPreview', {dietData});
    } catch (error) {
      console.error('Error generating diet chart:', error);
      Alert.alert('Error', 'Failed to generate diet chart. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [validateForm, clientName, meals, dailyGoals, supplements, generalNotes, showSupplements, navigation]);

  // Clear All
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all data?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setClientName('');
            setMeals([
              {
                id: generateId(),
                name: DEFAULT_MEAL_NAMES[0],
                time: '',
                carbs: [],
                proteins: [],
                others: [],
                notes: '',
              },
            ]);
            setDailyGoals(
              DEFAULT_DAILY_GOALS.map((text) => ({id: generateId(), text}))
            );
            setSupplements([]);
            setShowSupplements(false);
            setGeneralNotes(
              DEFAULT_GENERAL_NOTES.map((text) => ({id: generateId(), text}))
            );
            setErrors({});
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Header
            title="Diet Chart"
          />
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Client Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Name</Text>
            <TextInput
              placeholder="Enter client name"
              value={clientName}
              onChangeText={setClientName}
              error={errors.clientName}
            />
          </View>

          {/* Meals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meals</Text>
            {meals.map((meal, index) => (
              <View
                key={meal.id}
                onLayout={(event) => handleMealLayout(meal.id, event)}>
                <MealCard
                  meal={meal}
                  onUpdate={handleUpdateMeal}
                  onDelete={handleDeleteMeal}
                  showDelete={meals.length > 1}
                />
              </View>
            ))}
            {meals.length < VALIDATION_RULES.maxMeals && (
              <Button
                title="+ Add Meal"
                onPress={handleAddMeal}
                variant="secondary"
              />
            )}
          </View>

          {/* Daily Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Goals</Text>
            {dailyGoals.map((goal) => (
              <GoalNoteItem
                key={goal.id}
                item={goal}
                onUpdate={handleUpdateDailyGoal}
                onDelete={handleDeleteDailyGoal}
                placeholder="Enter daily goal"
              />
            ))}
            <Button
              title="+ Add Goal"
              onPress={handleAddDailyGoal}
              variant="secondary"
              size="small"
            />
          </View>

          {/* Supplements (Optional) */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleHeader}
              onPress={() => setShowSupplements(!showSupplements)}
              activeOpacity={0.7}>
              <Text style={styles.sectionTitle}>Supplements (Optional)</Text>
              <Text style={styles.toggleIcon}>
                {showSupplements ? '−' : '+'}
              </Text>
            </TouchableOpacity>

            {showSupplements && (
              <>
                {supplements.map((supplement) => (
                  <SupplementRow
                    key={supplement.id}
                    supplement={supplement}
                    onUpdate={handleUpdateSupplement}
                    onDelete={handleDeleteSupplement}
                  />
                ))}
                <Button
                  title="+ Add Supplement"
                  onPress={handleAddSupplement}
                  variant="secondary"
                  size="small"
                />
              </>
            )}
          </View>

          {/* General Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Things to Notice</Text>
            {generalNotes.map((note) => (
              <GoalNoteItem
                key={note.id}
                item={note}
                onUpdate={handleUpdateGeneralNote}
                onDelete={handleDeleteGeneralNote}
                placeholder="Enter general note"
              />
            ))}
            <Button
              title="+ Add Note"
              onPress={handleAddGeneralNote}
              variant="secondary"
              size="small"
            />
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
              activeOpacity={0.7}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
              onPress={handleGenerateAndShare}
              activeOpacity={0.7}
              disabled={isGenerating}>
              {isGenerating ? (
                <ActivityIndicator color={COLORS.brandDarkest} />
              ) : (
                <Text style={styles.generateButtonText}>Generate & Share</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    // paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 30,
    color: COLORS.brandDarkest,
    fontFamily: FONTS.regular,
    lineHeight: 40,
  },
  headerContent: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
    marginBottom: 12,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleIcon: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  bottomActions: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    marginRight: 12,
  },
  clearButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDark,
  },
  generateButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandPrimary,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
});

export default DietChartBuilderScreen;
