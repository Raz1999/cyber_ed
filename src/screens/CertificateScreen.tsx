import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Share, Platform, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

type CertificateRouteProp = RouteProp<RootStackParamList, 'Certificate'>;
type CertificateNavProp = StackNavigationProp<RootStackParamList>;

const isMobileWeb = Platform.OS === 'web' && Dimensions.get('window').width < 768;

export default function CertificateScreen() {
  const navigation = useNavigation<CertificateNavProp>();
  const route = useRoute<CertificateRouteProp>();
  const { totalPoints } = route.params;

  const shareText = `🛡️ סיימתי את אימון הגנת הסייבר!\nצברתי ${totalPoints} נקודות.\nאני יודע עכשיו לזהות הונאות ברשת. 💪`;

  const handleShare = async () => {
    if (Platform.OS !== 'web' || isMobileWeb) {
      await Share.share({ message: shareText });
    } else {
      await Clipboard.setStringAsync(shareText);
      alert('הטקסט הועתק! תוכל לשתף אותו בוואטסאפ.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.title}>כל הכבוד!</Text>
        <Text style={styles.subtitle}>סיימת את כל התרגילים בהצלחה</Text>
        <View style={styles.certificate}>
          <Text style={styles.certLabel}>תעודת מגן דיגיטלי</Text>
          <Text style={styles.points}>{totalPoints}</Text>
          <Text style={styles.pointsLabel}>נקודות סייבר</Text>
          <Text style={styles.certMessage}>
            אתה יודע עכשיו לזהות ולהתמודד עם הונאות נפוצות ברשת. שתף את הידע שלך עם המשפחה!
          </Text>
        </View>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>
            {Platform.OS === 'web' && !isMobileWeb ? 'העתק טקסט לשיתוף' : 'שתף בוואטסאפ'}
          </Text>
        </Pressable>
        <Pressable style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeButtonText}>חזור לתפריט הראשי</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  emoji: { fontSize: 72 },
  title: { fontFamily: Typography.fontFamilyBold, fontSize: 32, color: Colors.text, textAlign: 'center' },
  subtitle: { fontFamily: Typography.fontFamily, fontSize: Typography.subtitleSize, color: Colors.locked, textAlign: 'center' },
  certificate: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  certLabel: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.locked },
  points: { fontFamily: Typography.fontFamilyBold, fontSize: 56, color: Colors.primary },
  pointsLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.text },
  certMessage: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.text, textAlign: 'center', lineHeight: 26, marginTop: Spacing.sm },
  shareButton: { backgroundColor: '#25D366', borderRadius: Radius.button, minHeight: TouchTarget.min, paddingHorizontal: Spacing.xl, alignItems: 'center', justifyContent: 'center', width: '100%' },
  shareButtonText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.surface },
  homeButton: { backgroundColor: 'transparent', borderRadius: Radius.button, minHeight: TouchTarget.min, paddingHorizontal: Spacing.xl, alignItems: 'center', justifyContent: 'center', width: '100%', borderWidth: 2, borderColor: Colors.primary },
  homeButtonText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.primary },
});
