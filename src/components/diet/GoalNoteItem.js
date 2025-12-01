import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {TextInput} from '../index';
import {COLORS} from '../../constants/theme';

const GoalNoteItem = ({item, onUpdate, onDelete, placeholder}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={placeholder || 'Enter text'}
          value={item.text}
          onChangeText={(text) => onUpdate(item.id, text)}
          multiline
        />
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
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
  inputContainer: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 8,
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

export default GoalNoteItem;
