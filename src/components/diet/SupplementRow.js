import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {TextInput} from '../index';
import {COLORS} from '../../constants/theme';

const SupplementRow = ({supplement, onUpdate, onDelete}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.nameInput}>
          <TextInput
            placeholder="Supplement name"
            value={supplement.name}
            onChangeText={(text) => onUpdate(supplement.id, 'name', text)}
          />
        </View>
        <View style={styles.timingInput}>
          <TextInput
            placeholder="Timing"
            value={supplement.timing}
            onChangeText={(text) => onUpdate(supplement.id, 'timing', text)}
          />
        </View>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.noteInput}>
          <TextInput
            placeholder="Dosage / Instructions"
            value={supplement.note}
            onChangeText={(text) => onUpdate(supplement.id, 'note', text)}
          />
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(supplement.id)}
          activeOpacity={0.7}>
          <View style={styles.deleteIcon}>
            <View style={styles.deleteLine} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 2,
    marginRight: 8,
  },
  timingInput: {
    flex: 1,
  },
  noteInput: {
    flex: 1,
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

export default SupplementRow;
