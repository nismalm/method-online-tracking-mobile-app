import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {TextInput} from '../index';
import {COLORS} from '../../constants/theme';

const FoodItemRow = ({foodItem, onUpdate, onDelete, isProtein = false}) => {
  return (
    <View style={styles.container}>
      <View style={styles.nameInput}>
        <TextInput
          placeholder="Food item"
          value={foodItem.name}
          onChangeText={(text) => onUpdate(foodItem.id, 'name', text)}
        />
      </View>
      <View style={styles.quantityInput}>
        <TextInput
          placeholder="Qty"
          value={foodItem.quantity}
          onChangeText={(text) => onUpdate(foodItem.id, 'quantity', text)}
        />
      </View>
      {isProtein && (
        <View style={styles.proteinGramsInput}>
          <TextInput
            placeholder="P (g)"
            value={foodItem.proteinGrams}
            onChangeText={(text) => onUpdate(foodItem.id, 'proteinGrams', text)}
            keyboardType="numeric"
          />
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(foodItem.id)}
        activeOpacity={0.7}>
        <View style={styles.deleteIcon}>
          <View style={styles.deleteLine} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameInput: {
    flex: 2,
    marginRight: 8,
  },
  quantityInput: {
    flex: 1,
    marginRight: 8,
  },
  proteinGramsInput: {
    flex: 0.8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.brandDarkest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLine: {
    width: 12,
    height: 2,
    backgroundColor: COLORS.white,
    borderRadius: 1,
  },
});

export default FoodItemRow;
