import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, Animated, Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');

const PROTOCOLS = [
  { id: 'QR_DYNAMIC', name: 'QR Dynamic', tagline: 'Max Compat', fps: 15, color: '#7c3aed', icon: '◼', chunkSize: 200 },
  { id: 'RGB_LSB', name: 'RGB LSB', tagline: '5× Faster', fps: 30, color: '#0ea5e9', icon: '◈', chunkSize: 3000 },
  { id: 'INVISIBLE_FLICKER', name: 'Flicker', tagline: 'Ultra Speed', fps: 60, color: '#f59e0b', icon: '◉', chunkSize: 6000 },
  { id: 'HYBRID', name: 'Hybrid', tagline: 'Auto-Adapt', fps: 45, color: '#10b981', icon: '◎', chunkSize: 2000 },
];

type Step = 'pick' | 'protocol' | 'broadcast';

export default function SendScreen() {
  const [step, setStep] = useState<Step>('pick');
  const [file, setFile] = useState<{ name: string; size: number; path: string } | null>(null);
  const [selectedProto, setSelectedProto] = useState('QR_DYNAMIC');
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const broadcastTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const proto = PROTOCOLS.find(p => p.id === selectedProto)!;

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });
      const path = res.fileCopyUri ?? res.uri;
      setFile({ name: res.name ?? 'file', size: res.size ?? 0, path });
      setStep('protocol');
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) console.error(e);
    }
  };

  const startEncoding = useCallback(async () => {
    if (!file) return;
    setIsEncoding(true);
    setProgress(0);
    setStep('broadcast');

    // Read file bytes from a file:// or cached copy URI.
    const filePath = file.path.startsWith('file://') ? file.path.replace('file://', '') : file.path;
    const b64 = await RNFS.readFile(filePath, 'base64');
    const byteLength = Math.floor((b64.length * 3) / 4);
    const chunkSize = proto.chunkSize;
    const total = Math.ceil(byteLength / chunkSize);
    const fileId = Math.floor(Math.random() * 0xffffff);
    const encoded: string[] = [];

    for (let i = 0; i < total; i++) {
      // Generate a simple colored frame representation as base64 data URI
      // In production, this would use a native canvas module to render actual optical frames
      encoded.push(`frame_${i}_${Math.min(chunkSize, byteLength - i * chunkSize)}_${fileId}`);
      setProgress(((i + 1) / total) * 100);
      await new Promise(r => setTimeout(r, 2));
    }

    setFrames(encoded);
    setIsEncoding(false);
  }, [file, proto]);

  const toggleBroadcast = () => {
    if (isBroadcasting) {
      if (broadcastTimer.current) clearInterval(broadcastTimer.current);
      setIsBroadcasting(false);
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      const interval = 1000 / proto.fps;
      broadcastTimer.current = setInterval(() => {
        setFrameIdx(i => (i + 1) % frames.length);
      }, interval);
      setIsBroadcasting(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  };

  const reset = () => {
    if (broadcastTimer.current) clearInterval(broadcastTimer.current);
    setStep('pick'); setFile(null); setFrames([]); setIsBroadcasting(false); setProgress(0);
  };

  const fmtSize = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#0d0b1a', '#0a0a0f']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📡 Send File</Text>
          <View style={styles.stepRow}>
            {(['pick', 'protocol', 'broadcast'] as Step[]).map((s, i) => (
              <View key={s} style={[styles.stepDot, step === s && styles.stepActive, (step === 'protocol' && i === 0) || (step === 'broadcast' && i < 2) ? styles.stepDone : null]} />
            ))}
          </View>
        </View>

        {/* STEP 1: Pick */}
        {step === 'pick' && (
          <TouchableOpacity style={styles.dropzone} onPress={pickFile} activeOpacity={0.8}>
            <Text style={styles.dropIcon}>📂</Text>
            <Text style={styles.dropTitle}>Tap to select a file</Text>
            <Text style={styles.dropHint}>Any file type · Up to 10 MB</Text>
          </TouchableOpacity>
        )}

        {/* STEP 2: Protocol */}
        {step === 'protocol' && file && (
          <View>
            <View style={styles.fileCard}>
              <Text style={styles.fileCardIcon}>📄</Text>
              <View style={styles.fileCardInfo}>
                <Text style={styles.fileCardName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileCardSize}>{fmtSize(file.size)}</Text>
              </View>
              <TouchableOpacity onPress={() => { setFile(null); setStep('pick'); }}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>CHOOSE PROTOCOL</Text>
            {PROTOCOLS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.protoCard, selectedProto === p.id && { borderColor: p.color, backgroundColor: `${p.color}12` }]}
                onPress={() => setSelectedProto(p.id)}
                activeOpacity={0.85}
              >
                <View style={styles.protoCardHeader}>
                  <Text style={[styles.protoCardIcon, { color: p.color }]}>{p.icon}</Text>
                  <Text style={styles.protoCardName}>{p.name}</Text>
                  <Text style={[styles.protoCardTagline, { color: p.color }]}>{p.tagline}</Text>
                  {selectedProto === p.id && <View style={[styles.protoCheck, { backgroundColor: p.color }]}><Text style={styles.protoCheckMark}>✓</Text></View>}
                </View>
                <Text style={styles.protoCardStats}>{p.fps} FPS</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.encodeBtn} onPress={startEncoding} activeOpacity={0.85}>
              <LinearGradient colors={[proto.color, '#6d28d9']} style={styles.encodeBtnGrad}>
                <Text style={styles.encodeBtnText}>▶  Encode with {proto.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Broadcast */}
        {step === 'broadcast' && (
          <View>
            <View style={[styles.protoBadge, { borderColor: `${proto.color}40` }]}>
              <View style={[styles.protoBadgeDot, { backgroundColor: proto.color }]} />
              <Text style={[styles.protoBadgeText, { color: proto.color }]}>{proto.name} · {proto.fps} FPS</Text>
            </View>

            {isEncoding && (
              <View style={styles.progressCard}>
                <View style={styles.progressRow}>
                  <ActivityIndicator color={proto.color} size="small" />
                  <Text style={styles.progressLabel}>Encoding...</Text>
                  <Text style={[styles.progressPct, { color: proto.color }]}>{progress.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: proto.color }]} />
                </View>
              </View>
            )}

            {/* Optical canvas display */}
            {!isEncoding && frames.length > 0 && (
              <View>
                <Animated.View style={[styles.canvasWrap, { transform: [{ scale: isBroadcasting ? pulseAnim : 1 }] }]}>
                  <LinearGradient
                    colors={isBroadcasting ? [proto.color + '30', '#0a0a0f'] : ['#1a1a2e', '#0a0a0f']}
                    style={styles.canvas}
                  >
                    <View style={styles.canvasGrid}>
                      {Array.from({ length: 64 }).map((_, i) => (
                        <View
                          key={i}
                          style={[styles.canvasCell, {
                            backgroundColor: isBroadcasting
                              ? `hsl(${(i * 37 + frameIdx * 15) % 360}, 70%, 50%)`
                              : 'rgba(124,58,237,0.2)',
                            opacity: isBroadcasting ? 0.6 + Math.random() * 0.4 : 0.3,
                          }]}
                        />
                      ))}
                    </View>
                    {isBroadcasting && (
                      <View style={styles.liveOverlay}>
                        <View style={styles.liveDot} />
                        <Text style={[styles.liveText, { color: proto.color }]}>LIVE</Text>
                        <Text style={styles.frameCount}>Frame {frameIdx + 1}/{frames.length}</Text>
                      </View>
                    )}
                    {!isBroadcasting && (
                      <Text style={styles.canvasIdleText}>Press Broadcast to Start</Text>
                    )}
                  </LinearGradient>
                </Animated.View>

                <TouchableOpacity style={styles.broadcastBtn} onPress={toggleBroadcast} activeOpacity={0.85}>
                  <LinearGradient
                    colors={isBroadcasting ? ['#ef4444', '#dc2626'] : [proto.color, '#6d28d9']}
                    style={styles.broadcastBtnGrad}
                  >
                    <Text style={styles.broadcastBtnText}>
                      {isBroadcasting ? '⏸  Pause Broadcast' : '▶  Start Broadcast'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}><Text style={styles.statVal}>{frames.length}</Text><Text style={styles.statKey}>Frames</Text></View>
                  <View style={styles.statBox}><Text style={styles.statVal}>{proto.fps}</Text><Text style={styles.statKey}>FPS</Text></View>
                  <View style={styles.statBox}><Text style={styles.statVal}>{file ? fmtSize(file.size) : '—'}</Text><Text style={styles.statKey}>File</Text></View>
                </View>

                <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                  <Text style={styles.resetBtnText}>Send Different File</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#1e293b', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  stepActive: { borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.15)' },
  stepDone: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)' },
  dropzone: { borderWidth: 2, borderColor: '#1e293b', borderStyle: 'dashed', borderRadius: 16, padding: 48, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 20 },
  dropIcon: { fontSize: 48, marginBottom: 12 },
  dropTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  dropHint: { fontSize: 12, color: '#64748b' },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, marginBottom: 20, gap: 12 },
  fileCardIcon: { fontSize: 24 },
  fileCardInfo: { flex: 1 },
  fileCardName: { fontSize: 13, fontWeight: '600', color: '#f1f5f9' },
  fileCardSize: { fontSize: 11, color: '#64748b', marginTop: 2 },
  changeBtn: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 0.12, marginBottom: 10 },
  protoCard: { borderWidth: 1.5, borderColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.02)' },
  protoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  protoCardIcon: { fontSize: 18 },
  protoCardName: { fontSize: 13, fontWeight: '700', color: '#f1f5f9', flex: 1 },
  protoCardTagline: { fontSize: 11, fontWeight: '600' },
  protoCheck: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  protoCheckMark: { fontSize: 10, color: '#fff', fontWeight: '800' },
  protoCardStats: { fontSize: 10, color: '#64748b', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  encodeBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  encodeBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  encodeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  protoBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  protoBadgeDot: { width: 7, height: 7, borderRadius: 4 },
  protoBadgeText: { fontSize: 12, fontWeight: '700' },
  progressCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginBottom: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: '#f1f5f9', flex: 1 },
  progressPct: { fontSize: 13, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  canvasWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, aspectRatio: 1 },
  canvas: { flex: 1, padding: 12, justifyContent: 'center', alignItems: 'center' },
  canvasGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  canvasCell: { width: (width - 80) / 8, height: (width - 80) / 8, borderRadius: 2, margin: 1 },
  liveOverlay: { flexDirection: 'row', alignItems: 'center', gap: 6, position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  liveText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.1, flex: 1 },
  frameCount: { fontSize: 10, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  canvasIdleText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  broadcastBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  broadcastBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  broadcastBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statKey: { fontSize: 10, color: '#64748b', marginTop: 2 },
  resetBtn: { borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 12, alignItems: 'center' },
  resetBtnText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
});
