import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import { I18nManager, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Heebo_400Regular, Heebo_700Bold } from '@expo-google-fonts/heebo';
import AppNavigator from './src/navigation/AppNavigator';

// Force RTL for Hebrew — called unconditionally on every app start
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function App() {
  const [fontsLoaded] = useFonts({
    Heebo_400Regular,
    Heebo_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>טוען...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  loadingText: {
    fontSize: 18,
    color: '#212121',
  },
});
