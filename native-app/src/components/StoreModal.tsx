import { Gem, Sparkles, Store as StoreIcon } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DL_COLORS } from '../features/deep-learning/theme';

export interface StoreModalProps {
  visible: boolean;
  onClose: () => void;
  chronoShards: number;
}

/**
 * The Chrono Shop — where Chrono-Shards (currently just XP relabeled) will
 * eventually have somewhere to go. Empty on purpose for now: this is the
 * placeholder the real catalog gets built into later, not a finished
 * feature. Opened from the shop icon next to the Chrono-Shards pill in the
 * dashboard header.
 */
export function StoreModal({ visible, onClose, chronoShards }: StoreModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <StoreIcon size={20} color={DL_COLORS.reward} strokeWidth={2.2} />
              <Text style={styles.heading}>Chrono Shop</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close shop" style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.balancePill}>
            <Gem size={14} color={DL_COLORS.amethyst} strokeWidth={2.2} />
            <Text style={styles.balanceValue}>{chronoShards.toLocaleString()}</Text>
            <Text style={styles.balanceLabel}>Chrono-Shards</Text>
          </View>

          <View style={styles.emptyState}>
            <Sparkles size={32} color={DL_COLORS.textMuted} strokeWidth={1.6} />
            <Text style={styles.emptyTitle}>Coming soon</Text>
            <Text style={styles.emptyBody}>
              Nothing to spend your shards on yet — this is where new heroes, gear, and other rewards will land.
            </Text>
          </View>

          <Pressable style={styles.closeCardButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close shop">
            <Text style={styles.closeCardButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default StoreModal;

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
    borderColor: DL_COLORS.reward,
    borderRadius: 24,
    padding: 22,
    gap: 16,
    shadowColor: DL_COLORS.reward,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DL_COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.textMuted,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    borderWidth: 1,
    borderColor: DL_COLORS.border,
    backgroundColor: DL_COLORS.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DL_COLORS.text,
  },
  emptyBody: {
    fontSize: 12.5,
    fontWeight: '600',
    color: DL_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  closeCardButton: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: DL_COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  closeCardButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DL_COLORS.textMuted,
  },
});
