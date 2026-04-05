import React from 'react';
import { View, Text } from 'react-native';
import { BaseSimulationProps } from './BaseSimulationProps';

export default function MultipleChoiceEngine({ scenario }: BaseSimulationProps) {
  return <View><Text>{scenario.task}</Text></View>;
}
