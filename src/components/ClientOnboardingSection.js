import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Linking, StyleSheet, Alert} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import ShareIcon from '../../assets/icons/shareIcon';
import {CLIENT_INTAKE_URL} from '../config/env';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

const buildWhatsAppMessage = () =>
`Hi!

Please fill in your fitness intake form before your first session with us:

${CLIENT_INTAKE_URL}

Takes less than 2 minutes. See you soon! 💪`;

const ClientOnboardingSection = () => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const message = encodeURIComponent(buildWhatsAppMessage());
    const url = `whatsapp://send?text=${message}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/?text=${message}`);
      }
    } catch (error) {
      Alert.alert('Unable to open WhatsApp', 'Please install WhatsApp or share the link manually.');
    }
  };

  const handleCopy = () => {
    Clipboard.setString(CLIENT_INTAKE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Client Intake Link</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Public</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>
        Share this link with a client to have them fill their own intake details before you create their account.
      </Text>

      <View style={styles.qrWrapper}>
        <View style={styles.qrInner}>
          <QRCode
            value={CLIENT_INTAKE_URL}
            size={168}
            backgroundColor={COLORS.white}
            color={COLORS.brandDarkest}
          />
        </View>
      </View>

      <View style={styles.linkBox}>
        <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
          {CLIENT_INTAKE_URL}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={handleShare}>
          <ShareIcon width={16} height={16} fill={COLORS.brandDarkest} />
          <Text style={styles.primaryBtnText}>Share Invite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={handleCopy}>
          <Text style={styles.secondaryBtnText}>
            {copied ? 'Copied' : 'Copy Link'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    borderRadius: BORDER_RADIUS.xl,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  badge: {
    backgroundColor: COLORS.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  qrWrapper: {
    alignItems: 'center',
    marginVertical: 8,
  },
  qrInner: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
  },
  linkBox: {
    marginTop: 16,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.brandDarkest,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brandPrimary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
  },
  primaryBtnText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandDarkest,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
  },
  secondaryBtnText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
});

export default ClientOnboardingSection;
