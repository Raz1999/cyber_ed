import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import SimulationScreen from '../features/simulations/SimulationScreen';
import CertificateScreen from '../screens/CertificateScreen';

export type RootStackParamList = {
  Home: undefined;
  Simulation: { levelId: number };
  Certificate: { totalPoints: number };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FAF9F6' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Simulation" component={SimulationScreen} />
      <Stack.Screen name="Certificate" component={CertificateScreen} />
    </Stack.Navigator>
  );
}
