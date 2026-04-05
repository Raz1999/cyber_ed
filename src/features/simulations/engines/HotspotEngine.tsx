import React from 'react';
import { View, Text } from 'react-native';
import { BaseSimulationProps } from './BaseSimulationProps';

export function findHotspotHit() { return null; }

export default function HotspotEngine({ scenario }: BaseSimulationProps) {
  return <View><Text>{scenario.task}</Text></View>;
}
