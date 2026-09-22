import React from 'react';
import { StyleSheet, View } from 'react-native';
import ArithmeticGameModule from '../../components/ArithmeticGameModule';
import DataDetectiveGameModule from '../../components/DataDetectiveGameModule';
import LimitChaserGameModule from '../../components/LimitChaserGameModule';
import MoneyGrowerGameModule from '../../components/MoneyGrowerGameModule';
import ShapeArchitectGameModule from '../../components/ShapeArchitectGameModule';
import TrigonometryGameModule from '../../components/TrigonometryGameModule';
import { ModuleKey } from '../../theme';
import { DL_COLORS } from '../features/deep-learning/theme';

export interface KineticStageProps {
  activeRealm: ModuleKey;
  /** Forwarded into the active module's "Continue to Next Realm" button on its realm-complete screen. */
  onNextRealm?: () => void;
}

// Number Ninja and Circle Spinner are the two modules already rebuilt as
// full 4-stage deep-learning games (see components/*GameModule.tsx) — they
// run here unmodified, just inside this fantasy-themed frame. The remaining
// four modules still run their original calculator/graph UI until they get
// the same 4-stage treatment.
const REALM_COMPONENTS: Record<ModuleKey, React.ComponentType<{ onNextRealm?: () => void }>> = {
  arithmetic: ArithmeticGameModule,
  trigonometry: TrigonometryGameModule,
  compoundInterest: MoneyGrowerGameModule,
  geometry: ShapeArchitectGameModule,
  statistics: DataDetectiveGameModule,
  calculus: LimitChaserGameModule,
};

/** The active game viewport — renders whichever realm the player has selected in the RealmViewport. */
export function KineticStage({ activeRealm, onNextRealm }: KineticStageProps) {
  const ActiveModule = REALM_COMPONENTS[activeRealm];

  return (
    <View style={styles.frame}>
      <ActiveModule onNextRealm={onNextRealm} />
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
