import { RotateCcw, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from '../features/deep-learning/theme';

export interface RestartConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Guards the Restart button's actual wipe behind an explicit confirmation —
 * clearing every realm's progress, XP, level, and badges is hard to walk
 * back, so this is the one place that action can be canceled before it
 * happens. The hero avatar itself is untouched (see resetGameState), so the
 * copy here only promises what's actually being reset.
 */
export function RestartConfirmModal({ visible, onCancel, onConfirm }: RestartConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <TriangleAlert size={26} color={DL_COLORS.danger} strokeWidth={2.2} />
          </View>
          <Text style={styles.heading}>Restart MathQuest?</Text>
          <Text style={styles.body}>
            This clears every stage, un-clears every realm, and resets your level, XP, and badges back to zero. Your
            hero stays the same — every realm will greet you with a brand new set of questions.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button" accessibilityLabel="Cancel restart">
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.confirmButton} accessibilityRole="button" accessibilityLabel="Confirm restart, clearing all progress">
              <RotateCcw size={15} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.confirmButtonText}>Restart Everything</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default RestartConfirmModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: DL_COLORS.surface,
    borderWidth: 2,
    borderColor: DL_COLORS.danger,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: DL_COLORS.danger,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: DL_COLORS.danger,
    backgroundColor: DL_COLORS.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: DL_COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 13.5,
    fontWeight: '600',
    color: DL_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: DL_COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: DL_COLORS.danger,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  confirmButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
