import React, {useState} from 'react';
import {View, Text} from 'react-native';
import {Dropdown as ElementDropdown} from 'react-native-element-dropdown';

const Dropdown = ({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = 'Select...',
  error,
  searchable = true,
  searchPlaceholder = 'Search...',
  className = '',
}) => {
  const [isFocus, setIsFocus] = useState(false);

  // NativeWind classes for container
  const getContainerClass = () => {
    let baseClass = 'rounded-xl bg-white h-12 px-4 flex justify-center';
    if (error) return `${baseClass} border-2 border-black`;
    if (isFocus) return `${baseClass} border-2 border-black`;
    return `${baseClass} border border-gray-200`;
  };

  // Minimal required styles for ElementDropdown (library requirement)
  const dropdownStyles = {
    dropdown: { height: 48 },
    placeholder: { fontSize: 16, color: '#999999', fontFamily: 'Barlow-Regular' },
    selectedText: { fontSize: 16, color: '#000000', fontFamily: 'Barlow-Regular' },
    icon: { width: 20, height: 20 },
    inputSearch: {
      height: 40, fontSize: 16, borderRadius: 8, paddingHorizontal: 12,
      borderWidth: 0, borderColor: '#e5e5e5', color: '#000000',
      fontFamily: 'Barlow-Regular', marginHorizontal: 12, marginVertical: 8,
      backgroundColor: '#ffffff'
    },
    container: { borderRadius: 12, borderWidth: 0, marginTop: 4 },
    item: { fontSize: 16, color: '#000000', fontFamily: 'Barlow-Regular' },
    itemContainer: { paddingVertical: 2, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' }
  };

  return (
    <View className={className}>
      {label && (
        <Text className="text-black text-sm font-barlow-semibold mb-2">
          {label}
        </Text>
      )}

      <View className={getContainerClass()}>
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
        <Text className="text-black text-xs mt-1.5 font-barlow-medium">
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
};

export default Dropdown;