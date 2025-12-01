import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {TextInput, Button} from '../index';
import FoodItemRow from './FoodItemRow';
import TimePickerModal from './TimePickerModal';
import {generateId} from '../../constants/dietDefaults';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';

const MealCard = ({meal, onUpdate, onDelete, showDelete}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleAddFoodItem = (category) => {
    const newItem = {
      id: generateId(),
      name: '',
      quantity: '',
      ...(category === 'proteins' && {proteinGrams: ''}),
    };

    const updatedMeal = {
      ...meal,
      [category]: [...meal[category], newItem],
    };

    onUpdate(updatedMeal);
  };

  const handleUpdateFoodItem = (category, itemId, field, value) => {
    const updatedItems = meal[category].map((item) =>
      item.id === itemId ? {...item, [field]: value} : item
    );

    const updatedMeal = {
      ...meal,
      [category]: updatedItems,
    };

    onUpdate(updatedMeal);
  };

  const handleDeleteFoodItem = (category, itemId) => {
    const updatedItems = meal[category].filter((item) => item.id !== itemId);

    const updatedMeal = {
      ...meal,
      [category]: updatedItems,
    };

    onUpdate(updatedMeal);
  };

  const handleTimeSelect = (time) => {
    const updatedMeal = {
      ...meal,
      time: time,
    };
    onUpdate(updatedMeal);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.mealNameInput}>
          <TextInput
            placeholder="Meal name"
            value={meal.name}
            onChangeText={(text) => onUpdate({...meal, name: text})}
          />
        </View>
        {showDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(meal.id)}
            activeOpacity={0.7}>
            <View style={styles.deleteIcon}>
              <View style={styles.deleteLine} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Time</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.7}>
          <Text style={styles.timeButtonText}>
            {meal.time || 'Select Time'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Carbs Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Carbohydrates</Text>
        {meal.carbs.map((item) => (
          <FoodItemRow
            key={item.id}
            foodItem={item}
            onUpdate={(id, field, value) =>
              handleUpdateFoodItem('carbs', id, field, value)
            }
            onDelete={(id) => handleDeleteFoodItem('carbs', id)}
          />
        ))}
        <Button
          title="+ Add Carb"
          onPress={() => handleAddFoodItem('carbs')}
          variant="secondary"
          size="small"
        />
      </View>

      {/* Proteins Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Proteins</Text>
        {meal.proteins.map((item) => (
          <FoodItemRow
            key={item.id}
            foodItem={item}
            onUpdate={(id, field, value) =>
              handleUpdateFoodItem('proteins', id, field, value)
            }
            onDelete={(id) => handleDeleteFoodItem('proteins', id)}
            isProtein={true}
          />
        ))}
        <Button
          title="+ Add Protein"
          onPress={() => handleAddFoodItem('proteins')}
          variant="secondary"
          size="small"
        />
      </View>

      {/* Others Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Others</Text>
        {meal.others.map((item) => (
          <FoodItemRow
            key={item.id}
            foodItem={item}
            onUpdate={(id, field, value) =>
              handleUpdateFoodItem('others', id, field, value)
            }
            onDelete={(id) => handleDeleteFoodItem('others', id)}
          />
        ))}
        <Button
          title="+ Add Other"
          onPress={() => handleAddFoodItem('others')}
          variant="secondary"
          size="small"
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notes (Optional)</Text>
        <TextInput
          placeholder="Add meal notes"
          value={meal.notes}
          onChangeText={(text) => onUpdate({...meal, notes: text})}
          multiline
        />
      </View>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelectTime={handleTimeSelect}
        initialTime={meal.time}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealNameInput: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.brandDarkest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLine: {
    width: 14,
    height: 2,
    backgroundColor: COLORS.white,
    borderRadius: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDark,
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  timeButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
  },
});

export default MealCard;
