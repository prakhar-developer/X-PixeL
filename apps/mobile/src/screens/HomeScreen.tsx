import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const PROTOCOLS = [
  {
    id: 'QR_DYNAMIC',
    name: 'QR Dynamic',
    tagline: 'Max Compatibility',
    throughput: '~10 KB/f',
    fps: 15,
    color: '#7c3aed',
    icon: '◼',
    description: 'Works with any camera, any lighting.',
  },
  {
    id: 'RGB_LSB',
    name: 'RGB LSB',
    tagline: '5× Faster',
    throughput: '~50 KB/f',
    fps: 30,
    color: '#0ea5e9',
    icon: '◈',
    description: 'Pixel-level color encoding.',
  },
  {
    id: 'INVISIBLE_FLICKER',
    name: 'Flicker',
    tagline: 'Ultra Speed',
    throughput: '~100 KB/f',
    fps: 60,
    color: '#f59e0b',
    icon: '◉',
    description: 'Rapid brightness modulation.',
  },
  {
    id: 'HYBRID',
    name: 'Hybrid',
    tagline: 'Auto-Adapt',
    throughput: '~75 KB/f',
    fps: 45,
    color: '#10b981',
    icon: '◎',
    description: 'QR sync + RGB payload frames.',
  },
];

const FEATURES = [
  { icon: '📡', label: '4 Protocols', sub: 'QR · RGB · Flicker · Hybrid' },
  { icon: '🔒', label: 'AES-256', sub: 'End-to-end encrypted' },
  { icon: '✈️', label: 'Offline', sub: 'No internet required' },
  { icon: '⚡', label: '< 1ms latency', sub: 'GPU-accelerated frames' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <LinearGradient
        colors={['#0a0a0f', '#0d0b1a', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Purple radial glow */}
      <View style={styles.glowBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>100% Offline · Air-Gapped</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={['#7c3aed', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <View style={styles.logoGrid}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.logoCell,
                        { opacity: [0, 2, 4, 6, 8].includes(i) ? 1 : 0.3 },
                      ]}
                    />
                  ))}
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          <Text style={styles.heroTitle}>
            X<Text style={styles.heroTitleAccent}>-</Text>Pixel
          </Text>
          <Text style={styles.heroSub}>
            Transfer files at the{' '}
            <Text style={styles.heroSubAccent}>speed of light</Text>
            {'\n'}No internet. No Bluetooth. No cables.
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.btnSend}
            onPress={() => navigation.navigate('Send')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7c3aed', '#6d28d9']}
              style={styles.btnGradient}
            >
              <Text style={styles.btnIcon}>📡</Text>
              <Text style={styles.btnLabel}>Send File</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnReceive}
            onPress={() => navigation.navigate('Receive')}
            activeOpacity={0.85}
          >
            <View style={styles.btnGhostInner}>
              <Text style={styles.btnIcon}>📷</Text>
              <Text style={styles.btnLabelGhost}>Receive File</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Protocol cards */}
        <Text style={styles.sectionLabel}>TRANSMISSION PROTOCOLS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.protoScroll}
        >
          {PROTOCOLS.map((p) => (
            <View key={p.id} style={[styles.protoCard, { borderColor: `${p.color}40` }]}>
              <View style={[styles.protoDot, { backgroundColor: p.color }]} />
              <Text style={[styles.protoIcon, { color: p.color }]}>{p.icon}</Text>
              <Text style={styles.protoName}>{p.name}</Text>
              <Text style={[styles.protoTagline, { color: p.color }]}>{p.tagline}</Text>
              <Text style={styles.protoStat}>{p.throughput}</Text>
              <Text style={styles.protoStat}>{p.fps} FPS</Text>
              <Text style={styles.protoDesc}>{p.description}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Feature pills */}
        <Text style={styles.sectionLabel}>CAPABILITIES</Text>
        <View style={styles.featGrid}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featCard}>
              <Text style={styles.featIcon}>{f.icon}</Text>
              <Text style={styles.featLabel}>{f.label}</Text>
              <Text style={styles.featSub}>{f.sub}</Text>
            </View>
          ))}
        </View>

        {/* Bottom nav hint */}
        <View style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>
            Use the tab bar below to navigate between Send, Receive, and Settings
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  glowBg: {
    position: 'absolute',
    top: -80,
    left: width / 2 - 180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#7c3aed',
    opacity: 0.08,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  hero: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    marginBottom: 24,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7c3aed',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#a78bfa', letterSpacing: 0.5 },

  logoWrap: { marginBottom: 20 },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    padding: 12,
  },
  logoGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  logoCell: {
    width: 14,
    height: 14,
    backgroundColor: 'white',
    borderRadius: 2,
  },

  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroTitleAccent: { color: '#7c3aed' },
  heroSub: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  heroSubAccent: { color: '#a78bfa', fontWeight: '600' },

  ctaRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 36,
  },
  btnSend: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  btnReceive: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.4)',
    backgroundColor: 'rgba(124,58,237,0.06)',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  btnGhostInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  btnIcon: { fontSize: 16 },
  btnLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  btnLabelGhost: { fontSize: 14, fontWeight: '700', color: '#a78bfa' },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  protoScroll: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  protoCard: {
    width: 140,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  protoDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  protoIcon: { fontSize: 20, marginBottom: 6 },
  protoName: { fontSize: 13, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 },
  protoTagline: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  protoStat: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
    marginBottom: 1,
  },
  protoDesc: { fontSize: 10, color: '#475569', lineHeight: 14, marginTop: 6 },

  featGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  featCard: {
    width: (width - 50) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
  },
  featIcon: { fontSize: 20, marginBottom: 6 },
  featLabel: { fontSize: 13, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 },
  featSub: { fontSize: 10, color: '#64748b', lineHeight: 14 },

  bottomHint: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  bottomHintText: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 16,
  },
});
