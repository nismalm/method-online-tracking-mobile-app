import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';

/**
 * Package Selector Component
 * Dropdown to select different packages for viewing activities
 *
 * Props:
 * - packages: Array of package options [{label, value, packageData}]
 * - selectedPackageId: Currently selected package ID
 * - onPackageChange: Callback when package is selected
 * - loading: Boolean indicating if packages are loading
 */

const PackageSelector = ({
  packages = [],
  selectedPackageId,
  onPackageChange,
  loading = false,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Package Period</Text>
        <View style={styles.dropdownContainer}>
          <Text style={styles.loadingText}>Loading packages...</Text>
        </View>
      </View>
    );
  }

  if (packages.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Package Period</Text>
        <View style={styles.dropdownContainer}>
          <Text style={styles.emptyText}>No packages found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Package Period</Text>
      <Dropdown
        data={packages}
        labelField="label"
        valueField="value"
        value={selectedPackageId}
        onChange={item => {
          if (onPackageChange) {
            onPackageChange(item.value, item.packageData);
          }
        }}
        style={styles.dropdown}
        placeholderStyle={styles.placeholderText}
        selectedTextStyle={styles.selectedText}
        containerStyle={styles.dropdownList}
        itemTextStyle={styles.itemText}
        activeColor={COLORS.brandPrimaryLight}
        placeholder="Select package"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.brandTextSecondary,
    marginBottom: 8,
  },
  dropdownContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    padding: 16,
    justifyContent: 'center',
    minHeight: 52,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 52,
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    marginTop: 4,
  },
  placeholderText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
  selectedText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.brandDarkest,
  },
  itemText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    textAlign: 'center',
  },
});

export default PackageSelector;
