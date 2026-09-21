import React from 'react';
import { StyleSheet, View } from 'react-native';
import ArithmeticGameModule from '../../components/ArithmeticGameModule';
import CalculusLimitVisualizer from '../../components/CalculusLimitVisualizer';
import CompoundInterestModule from '../../components/CompoundInterestModule';
import DataStatisticsModule from '../../components/DataStatisticsModule';
import GeometryModule from '../../components/GeometryModule';
import TrigonometryGameModule from '../../components/TrigonometryGameModule';
import { ModuleKey } from '../../theme';
import { DL_COLORS } from '../features/deep-learning/theme';

export interface KineticStageProps {
  activeRealm: ModuleKey;
}

// Number Ninja and Circle Spinner are the two modules already rebuilt as
// full 4-stage deep-learning games (see components/*GameModule.tsx) — they
// run here unmodified, just inside this fantasy-themed frame. The remaining
// four modules still run their original calculator/graph UI until they get
// the same 4-stage treatment.
const REALM_COMPONENTS: Record<ModuleKey, React.ComponentType> = {
  arithmetic: ArithmeticGameModule,
  trigonometry: TrigonometryGameModule,
  compoundInterest: CompoundInterestModule,
  geometry: GeometryModule,
  statistics: DataStatisticsModule,
  calculus: CalculusLimitVisualizer,
};

/** The active game viewport — renders whichever realm the player has selected in the RealmViewport. */
export function KineticStage({ activeRealm }: KineticStageProps) {
  const ActiveModule = REALM_COMPONENTS[activeRealm];

  return (
    <View style={styles.frame}>
      <ActiveModule />
    </View>
  );
}

export default KineticStage;

const styles = StyleSheet.create({
  frame: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    overflow: 'hidden',
    minHeight: 420,
  },
});
