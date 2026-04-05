import React from 'react';
import { Scenario } from '../../types/scenario';
import { BaseSimulationProps } from './engines/BaseSimulationProps';
import HotspotEngine from './engines/HotspotEngine';
import MultipleChoiceEngine from './engines/MultipleChoiceEngine';

export const ENGINE_REGISTRY: Record<
  Scenario['type'],
  React.ComponentType<BaseSimulationProps>
> = {
  hotspot: HotspotEngine,
  multipleChoice: MultipleChoiceEngine,
};
