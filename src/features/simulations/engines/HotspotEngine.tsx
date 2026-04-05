import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Platform } from 'react-native';
import { BaseSimulationProps } from './BaseSimulationProps';
import { HotspotScenario, Hotspot } from '../../../types/scenario';
import { Colors, Typography, Spacing, Radius } from '../../../theme';

// Pure function — exported for unit testing
export function findHotspotHit(
  hotspots: Hotspot[],
  tapX: number,
  tapY: number
): Hotspot | null {
  return hotspots.find(hs =>
    tapX >= hs.region.x &&
    tapX <= hs.region.x + hs.region.width &&
    tapY >= hs.region.y &&
    tapY <= hs.region.y + hs.region.height
  ) ?? null;
}

// Exported for unit testing — extracts normalized (0–1) tap coordinates
// cross-platform: uses getBoundingClientRect on web, locationX/Y on native
export function extractNormalizedTapCoords(
  event: any,
  layout: { width: number; height: number },
  containerRef: React.RefObject<any>
): { tapX: number; tapY: number } {
  if (Platform.OS === 'web' && containerRef.current) {
    const rect = (containerRef.current as any).getBoundingClientRect();
    const rawX = event.nativeEvent.clientX - rect.left;
    const rawY = event.nativeEvent.clientY - rect.top;
    return { tapX: rawX / layout.width, tapY: rawY / layout.height };
  }
  return {
    tapX: event.nativeEvent.locationX / layout.width,
    tapY: event.nativeEvent.locationY / layout.height,
  };
}

const prefersReducedMotion =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function HotspotEngine({
  scenario,
  attemptNumber,
  isEnabled,
  onAnswer,
}: BaseSimulationProps) {
  const hs = scenario as HotspotScenario;
  const containerRef = useRef<View>(null);
  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [revealCorrect, setRevealCorrect] = useState(false);

  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setRevealCorrect(false);
    setRipple(null);
  }, [attemptNumber]);

  const triggerRipple = (x: number, y: number) => {
    setRipple({ x, y });
    rippleScale.setValue(0);
    rippleOpacity.setValue(1);
    if (prefersReducedMotion) {
      setTimeout(() => setRipple(null), 100);
      return;
    }
    Animated.parallel([
      Animated.timing(rippleScale, { toValue: 1.5, duration: 400, useNativeDriver: true }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setRipple(null));
  };

  const handlePress = (event: any) => {
    if (!isEnabled) return;
    const { tapX, tapY } = extractNormalizedTapCoords(event, layout, containerRef);
    triggerRipple(tapX * layout.width, tapY * layout.height);
    const hit = findHotspotHit(hs.hotspots, tapX, tapY);
    if (!hit) {
      onAnswer({ isCorrect: false, feedbackText: hs.missedFeedback });
      return;
    }
    if (attemptNumber === 2 && !hit.isCorrect) setRevealCorrect(true);
    onAnswer({ isCorrect: hit.isCorrect, feedbackText: hit.feedback });
  };

  const correctHotspot = hs.hotspots.find(h => h.isCorrect);

  return (
    <View style={styles.container}>
      <Text style={styles.task}>{hs.task}</Text>
      <View
        ref={containerRef}
        style={styles.messageContainer}
        onLayout={e => setLayout(e.nativeEvent.layout)}
        accessible={true}
        accessibilityLabel={hs.imageAltText}
      >
        <View style={styles.messageBubble}>
          <Text style={styles.sender}>הודעה</Text>
          <Text style={styles.messageText}>{hs.description}</Text>
        </View>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="לחץ על החלק החשוד בהודעה"
        />
        {revealCorrect && correctHotspot && (
          <View
            style={[
              styles.hotspotReveal,
              {
                left: `${correctHotspot.region.x * 100}%`,
                top: `${correctHotspot.region.y * 100}%`,
                width: `${correctHotspot.region.width * 100}%`,
                height: `${correctHotspot.region.height * 100}%`,
              } as any,
            ]}
            pointerEvents="none"
          />
        )}
        {ripple && (
          <Animated.View
            style={[
              styles.ripple,
              { left: ripple.x - 25, top: ripple.y - 25, transform: [{ scale: rippleScale }], opacity: rippleOpacity },
            ]}
            pointerEvents="none"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  task: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.subtitleSize,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.lg,
    lineHeight: 32,
  },
  messageContainer: {
    position: 'relative',
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  messageBubble: { padding: Spacing.md, minHeight: 200 },
  sender: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.captionSize,
    color: Colors.locked,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  messageText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'right',
    lineHeight: 28,
  },
  hotspotReveal: {
    position: 'absolute',
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    borderWidth: 2,
    borderColor: Colors.success,
    borderRadius: Radius.sm,
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(245, 124, 0, 0.4)',
  },
});
