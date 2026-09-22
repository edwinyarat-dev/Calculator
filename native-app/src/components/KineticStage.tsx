import React from 'react';
import { StyleSheet, View } from 'react-native';
import ArithmeticGameModule from '../../components/ArithmeticGameModule';
import DataDetectiveGameModule from '../../components/DataDetectiveGameModule';
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

// Every realm runs the same 4-stage deep-learning engine (see
// components/*GameModule.tsx) inside this fantasy-themed frame.
const REALM_COMPONENTS: Record<ModuleKey, React.ComponentType<{ onNextRealm?: () => void }>> = {
  arithmetic: ArithmeticGameModule,
  trigonometry: TrigonometryGameModule,
  compoundInterest: MoneyGrowerGameModule,
  geometry: ShapeArchitectGameModule,
  statistics: DataDetectiveGameModule,
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
