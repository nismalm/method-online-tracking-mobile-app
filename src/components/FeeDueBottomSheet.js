import React, {useEffect, useRef, useMemo, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';
import ChevronRightIcon from '../../assets/icons/chevronRightIcon';

const FeeDueBottomSheet = ({visible, onClose, clients, onClientPress}) => {
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['50%', '85%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerDot} />
          <Text style={styles.headerTitle}>Fee Due Tomorrow</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{clients.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {clients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No fees due tomorrow</Text>
          </View>
        ) : (
          clients.map(({client}) => (
            <TouchableOpacity
              key={client.id}
              style={styles.clientRow}
              onPress={() => onClientPress(client)}
              activeOpacity={0.7}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>
                  {client.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName} numberOfLines={1}>
                  {client.name}
                </Text>
                <Text style={styles.clientSubtext}>
                  Package ends {client.endDate}
                </Text>
              </View>
              <ChevronRightIcon
                width={16}
                height={16}
                stroke={COLORS.gray400}
              />
            </TouchableOpacity>
          ))
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: COLORS.gray300,
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f97316',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  countBadge: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: '#c2410c',
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
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: 14,
  },
  clientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: '#c2410c',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
    marginBottom: 2,
  },
  clientSubtext: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.gray400,
  },
});

export default FeeDueBottomSheet;
