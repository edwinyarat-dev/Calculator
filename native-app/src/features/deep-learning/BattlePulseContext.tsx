import React, { createContext, useContext } from 'react';

// A tiny, deliberately dumb channel: shared widgets that live inside the
// Magic Deck (AnswerBlocks, the numeric keypad) call `pulse()` on every
// tap — not just on a final correct/wrong result — so the hero in the
// Battle Arena above can spark in real time while the player is still
// mid-decision. This carries no game data (no score, no answer value),
// just a "something happened" signal, so it can't affect scoring even by
// accident.

export type BattlePulse = () => void;

const BattlePulseContext = createContext<BattlePulse>(() => {});

export const BattlePulseProvider = BattlePulseContext.Provider;

export function useBattlePulse(): BattlePulse {
  return useContext(BattlePulseContext);
}
