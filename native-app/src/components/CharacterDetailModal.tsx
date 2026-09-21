import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from '../features/deep-learning/theme';

export interface CharacterDetailModalProps {
  visible: boolean;
  onClose: () => void;
  emoji: string;
  name: string;
  subtitle: string;
  purpose: string;
  accentColor?: string;
}

/** A full-screen popup showing who a tapped character is and what they're for — the same component backs both the hero (home screen + battle arena) and every realm's guardian, so their identity always reads the same way wherever they're tapped from. */
export function CharacterDetailModal({
  visible,
  onClose,
  emoji,
  name,
  subtitle,
  purpose,
  accentColor = DL_COLORS.amethyst,
}: CharacterDetailModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { borderColor: accentColor, shadowColor: accentColor }]} onPress={() => {}}>
          <View style={[styles.portrait, { borderColor: accentColor, backgroundColor: `${accentColor}26`, shadowColor: accentColor }]}>
            <Text style={styles.portraitEmoji}>{emoji}</Text>
          </View>
          <Text style={[styles.name, { color: accentColor }]}>{name}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.divider} />
          <Text style={styles.purposeLabel}>Purpose</Text>
          <Text style={styles.purposeText}>{purpose}</Text>
          <Pressable style={[styles.closeButton, { backgroundColor: accentColor }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default CharacterDetailModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 18, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderRadius: 26,
    padding: 26,
    alignItems: 'center',
    gap: 4,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  portrait: {
    width: 96,
    height: 96,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    marginBottom: 10,
  },
  portraitEmoji: {
    fontSize: 52,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: DL_COLORS.border,
    marginVertical: 14,
  },
  purposeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  purposeText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: DL_COLORS.text,
    lineHeight: 21,
  },
  closeButton: {
    marginTop: 20,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
