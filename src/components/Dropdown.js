import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Dropdown as ElementDropdown} from 'react-native-element-dropdown';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

const Dropdown = ({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = 'Select...',
  error,
  searchable = true,
  searchPlaceholder = 'Search...',
  style,
}) => {
  const [isFocus, setIsFocus] = useState(false);

  const getContainerStyle = () => {
    const styles = [containerStyles.base];
    
    if (error) {
      styles.push(containerStyles.error);
    } else if (isFocus) {
      styles.push(containerStyles.focused);
    } else {
      styles.push(containerStyles.normal);
    }
    
    if (style) {
      styles.push(style);
    }
    
    return styles;
  };

  // Styles required by ElementDropdown library
  const dropdownStyles = {
    dropdown: { height: 48 },
    placeholder: { fontSize: 16, color: COLORS.gray400, fontFamily: FONTS.regular },
    selectedText: { fontSize: 16, color: COLORS.black, fontFamily: FONTS.regular },
    icon: { width: 20, height: 20 },
    inputSearch: {
      height: 40, 
      fontSize: 16, 
      borderRadius: 8, 
      paddingHorizontal: 0,
      borderWidth: 0, 
      borderColor: COLORS.brandBorder, 
      color: COLORS.black,
      fontFamily: FONTS.regular, 
      marginHorizontal: 5, 
      marginVertical: 8,
      backgroundColor: COLORS.white
    },
    container: { borderRadius: 12, borderWidth: 0, marginTop: 4 },
    item: { fontSize: 16, color: COLORS.black, fontFamily: FONTS.regular },
    itemContainer: { 
      paddingVertical: 1, 
      paddingHorizontal: 1, 
      borderBottomWidth: 0.5, 
      borderBottomColor: '#f0f0f0' 
    }
  };

  return (
    <View>
      {label && (
        <Text style={labelStyles.label}>
          {label}
        </Text>
      )}

      <View style={getContainerStyle()}>
        <ElementDropdown
          data={items}
          search={searchable}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            onValueChange(item.value);
            setIsFocus(false);
          }}
          style={dropdownStyles.dropdown}
          placeholderStyle={dropdownStyles.placeholder}
          selectedTextStyle={dropdownStyles.selectedText}
          iconStyle={dropdownStyles.icon}
          inputSearchStyle={dropdownStyles.inputSearch}
          containerStyle={dropdownStyles.container}
          itemTextStyle={dropdownStyles.item}
          itemContainerStyle={dropdownStyles.itemContainer}
          activeColor="#f8f9fa"
        />
      </View>

      {error && (
        <Text style={errorStyles.text}>
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
};

const labelStyles = StyleSheet.create({
  label: {
    color: COLORS.black,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
  },
});

const containerStyles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  normal: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  focused: {
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  error: {
    borderWidth: 2,
    borderColor: COLORS.black,
  },
});

const errorStyles = StyleSheet.create({
  text: {
    color: COLORS.black,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginTop: 6,
  },
});

export default Dropdown;
