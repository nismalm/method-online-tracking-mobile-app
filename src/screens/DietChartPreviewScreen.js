import React, {useRef, useState, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {captureRef} from 'react-native-view-shot';
import Share from 'react-native-share';
import {COLORS, FONTS, FONT_SIZES} from '../constants/theme';

const PREVIEW_WIDTH = 794; // A4 portrait width for high-quality export

const DietChartPreviewScreen = ({navigation, route}) => {
  const {dietData} = route.params;
  const viewRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  // Calculate scale to fit screen width while maintaining quality for export
  const scale = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const availableWidth = screenWidth - 32; // Account for padding
    return availableWidth / PREVIEW_WIDTH;
  }, []);

  const handleShare = async () => {
    setIsSharing(true);

    try {
      // Small delay to ensure view is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the view as high-resolution image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // Share the image
      await Share.open({
        title: `${dietData.clientName}'s Diet Chart`,
        message: `Diet Chart for ${dietData.clientName}`,
        url: `file://${uri}`,
        type: 'image/png',
        subject: 'Diet Chart',
      });

      // Navigate back after successful share
      navigation.goBack();
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing diet chart:', error);
        Alert.alert('Error', 'Failed to share diet chart. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const formatFoodItems = (items, isProtein = false) => {
    if (!items || items.length === 0) return '';
    return items
      .filter((item) => item.name.trim())
      .map((item) => {
        const name = item.name.trim();
        const qty = item.quantity.trim();
        const proteinGrams = isProtein && item.proteinGrams ? item.proteinGrams.trim() : '';

        if (qty && proteinGrams) {
          return `• ${name} (${qty}) [${proteinGrams}g]`;
        } else if (qty) {
          return `• ${name} (${qty})`;
        } else if (proteinGrams) {
          return `• ${name} [${proteinGrams}g]`;
        } else {
          return `• ${name}`;
        }
      })
      .join('\n');
  };

  const renderMealRow = (meal) => {
    const carbsText = formatFoodItems(meal.carbs, false);
    const proteinsText = formatFoodItems(meal.proteins, true);
    const othersText = formatFoodItems(meal.others, false);

    return (
      <View key={meal.id} style={styles.tableRow}>
        <View style={styles.mealNameCell}>
          <Text style={styles.cellText}>{meal.name}</Text>
        </View>
        <View style={styles.timeCell}>
          <Text style={styles.cellText}>{meal.time}</Text>
        </View>
        <View style={styles.foodCell}>
          <Text style={styles.cellTextSmall}>{carbsText}</Text>
        </View>
        <View style={styles.foodCell}>
          <Text style={styles.cellTextSmall}>{proteinsText}</Text>
        </View>
        <View style={styles.foodCell}>
          <Text style={styles.cellTextSmall}>{othersText}</Text>
        </View>
        <View style={styles.notesCell}>
          <Text style={styles.cellTextSmall}>{meal.notes}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
          <View style={[styles.previewWrapper, {transform: [{scale}]}]}>
            <View style={styles.previewContainer} ref={viewRef} collapsable={false}>
            {/* Watermark */}
            <Image
              source={require('../../assets/logo/footerImgSm.png')}
              style={styles.watermark}
              resizeMode="contain"
            />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.clientName}>
                {dietData.clientName.toUpperCase()}'S DIET CHART
              </Text>
              <Text style={styles.date}>{dietData.date}</Text>
            </View>
            {/* <View style={styles.headerSpacer} /> */}

            {/* Meals Table */}
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <View style={styles.mealNameCell}>
                  <Text style={styles.headerText}>Meal Name</Text>
                </View>
                <View style={styles.timeCell}>
                  <Text style={styles.headerText}>Time</Text>
                </View>
                <View style={styles.foodCell}>
                  <Text style={styles.headerText}>Carb</Text>
                </View>
                <View style={styles.foodCell}>
                  <Text style={styles.headerText}>Protien</Text>
                </View>
                <View style={styles.foodCell}>
                  <Text style={styles.headerText}>Others</Text>
                </View>
                <View style={styles.notesCell}>
                  <Text style={styles.headerText}>Notes</Text>
                </View>
              </View>
              {/* Table Rows */}
              {dietData.meals.map((meal) => renderMealRow(meal))}
            </View>

            {/* Bottom Sections in 3 Columns */}
            <View style={styles.bottomSectionsContainer}>
              {/* Daily Goals */}
              <View style={styles.bottomSectionColumn}>
                <Text style={styles.sectionHeader}>DAILY GOALS</Text>
                {dietData.dailyGoals
                  .filter((goal) => goal.text.trim())
                  .map((goal) => (
                    <Text key={goal.id} style={styles.bulletPoint}>
                      • {goal.text}
                    </Text>
                  ))}
              </View>

              {/* Supplements */}
              <View style={styles.bottomSectionColumn}>
                <Text style={styles.sectionHeader}>SUPPLEMENTS</Text>
                {dietData.supplements && dietData.supplements.length > 0 ? (
                  dietData.supplements
                    .filter((sup) => sup.name.trim())
                    .map((supplement) => (
                      <Text key={supplement.id} style={styles.bulletPoint}>
                        • {supplement.name}
                        {supplement.timing ? `: After Meal ${supplement.timing}` : ''}
                        {supplement.note ? ` (${supplement.note})` : ''}
                      </Text>
                    ))
                ) : (
                  <Text style={styles.bulletPoint}>• None</Text>
                )}
              </View>

              {/* General Notes */}
              <View style={styles.bottomSectionColumn}>
                <Text style={styles.sectionHeader}>GENERAL THINGS TO NOTICE</Text>
                {dietData.generalNotes
                  .filter((note) => note.text.trim())
                  .map((note) => (
                    <Text key={note.id} style={styles.bulletPoint}>
                      • {note.text}
                    </Text>
                  ))}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Image
                source={require('../../assets/logo/footerImgLg.png')}
                style={styles.footerLogo}
                resizeMode="contain"
              />
            </View>
            </View>
          </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
          onPress={handleShare}
          activeOpacity={0.7}
          disabled={isSharing}>
          {isSharing ? (
            <ActivityIndicator color={COLORS.brandDarkest} />
          ) : (
            <Text style={styles.shareButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  previewWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    width: PREVIEW_WIDTH,
    backgroundColor: COLORS.white,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '65%',
    width: 300,
    height: 180,
    transform: [{translateX: -250}, {translateY: -125}],
    opacity: 0.15,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerSpacer: {
    height: 20,
  },
  clientName: {
    fontSize: 28,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
    letterSpacing: 0,
    flex: 1,
  },
  date: {
    fontSize: 28,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
  },
  table: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.brandDarkest,
    marginBottom: 24,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandDarkest,
    minHeight: 45,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandDarkest,
    minHeight: 120,
  },
  mealNameCell: {
    flex: 1.3,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.brandDarkest,
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  timeCell: {
    flex: 0.9,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.brandDarkest,
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  foodCell: {
    flex: 1.5,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.brandDarkest,
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  notesCell: {
    flex: 1.3,
    padding: 10,
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  headerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
  },
  cellTextSmall: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
    lineHeight: 18,
  },
  bottomSectionsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  bottomSectionColumn: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bulletPoint: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.brandDarkest,
    marginBottom: 4,
    lineHeight: 18,
  },
  footer: {
    marginTop: 8,
    alignItems: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.brandDarkest,
  },
  footerLogo: {
    width: 170,
    height: 100,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDark,
  },
  shareButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandPrimary,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
});

export default DietChartPreviewScreen;
