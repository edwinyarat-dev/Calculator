import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from '../features/deep-learning/theme';
import { HERO_CHARACTERS } from '../../theme';

export interface CharacterSelectModalProps {
  visible: boolean;
  onSelect: (characterId: string) => void;
}

/**
 * The second onboarding popup — shown right after `WelcomeModal`. Lets a
 * new player pick which of the two original heroes represents them for
 * the rest of the app (portrait, name, and flavor text everywhere the hero
 * is shown). The pick only changes cosmetics/identity: level, XP, streaks,
 * and every stage's scoring are completely unaffected by which hero is
 * chosen — that's called out explicitly so nobody worries a "wrong" pick
 * costs them progress.
 */
export function CharacterSelectModal({ visible, onSelect }: CharacterSelectModalProps) {
  const [pickedId, setPickedId] = useState<string>(HERO_CHARACTERS[0].id);
  const picked = HERO_CHARACTERS.find((c) => c.id === pickedId) ?? HERO_CHARACTERS[0];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.heading}>Choose Your Hero</Text>
          <Text style={styles.subheading}>Every hero levels up the same way — pick whoever feels like you.</Text>

          <View style={styles.grid}>
            {HERO_CHARACTERS.map((c) => {
              const isSelected = c.id === pickedId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setPickedId(c.id)}
                  style={[styles.charCard, isSelected && styles.charCardSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${c.name}, the ${c.className}${isSelected ? ' (currently selected)' : ''}`}
                >
                  <Text style={styles.charEmoji}>{c.emoji}</Text>
                  <Text style={[styles.charName, isSelected && styles.charNameSelected]}>{c.name}</Text>
                  <Text style={styles.charClass}>{c.className}</Text>
                  {isSelected && <View style={styles.selectedDot} />}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.tagline}>{picked.tagline}</Text>

          <Pressable
            style={styles.confirmButton}
            onPress={() => onSelect(pickedId)}
            accessibilityRole="button"
            accessibilityLabel={`Begin your journey as ${picked.name}`}
          >
            <Text style={styles.confirmButtonText}>Begin Your Journey ➔</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default CharacterSelectModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 18, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderColor: DL_COLORS.amethyst,
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    gap: 4,
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 12.5,
    fontWeight: '600',
    color: DL_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  charCard: {
    width: 120,
    borderWidth: 2,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surfaceMuted,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  charCardSelected: {
    borderColor: DL_COLORS.amethyst,
    backgroundColor: DL_COLORS.amethystSoft,
    shadowColor: DL_COLORS.amethyst,
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  charEmoji: {
    fontSize: 40,
    marginBottom: 2,
  },
  charName: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  charNameSelected: {
    color: DL_COLORS.amethyst,
  },
  charClass: {
    fontSize: 10.5,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: DL_COLORS.lime,
    marginTop: 4,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: DL_COLORS.text,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  confirmButton: {
    marginTop: 16,
    backgroundColor: DL_COLORS.amethyst,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
