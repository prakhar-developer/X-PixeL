import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  Dimensions, Platform, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

const { width } = Dimensions.get('window');
const VIEWFINDER = width - 64;

type Status = 'idle' | 'scanning' | 'complete' | 'error';

export default function ReceiveScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [hasPermission, setHasPermission] = useState(false);
  const [progress, setProgress] = useState(0);
  const [received, setReceived] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const scanAnim = useRef(new Animated.Value(0)).current;
  const device = useCameraDevice('back');

  React.useEffect(() => {
    Camera.requestCameraPermission().then(p => setHasPermission(p === 'granted'));
  }, []);

  React.useEffect(() => {
    if (status === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: VIEWFINDER - 4, duration: 1800, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [status, scanAnim]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (status !== 'scanning' || codes.length === 0) return;
      const code = codes[0].value;
      if (!code) return;
      // Simulate packet reception
      setReceived(r => {
        const next = r + 1;
        if (total > 0) setProgress((next / total) * 100);
        if (total > 0 && next >= total) {
          setStatus('complete');
        }
        return next;
      });
    },
  });

  const startScanning = () => {
    setStatus('scanning');
    setProgress(0);
    setReceived(0);
    setTotal(0);
  };

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setReceived(0);
    setTotal(0);
    setErrorMsg('');
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0f', '#0d0b1a', '#0a0a0f']} style={StyleSheet.absoluteFill} />
        <View style={styles.permBox}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSub}>X-Pixel needs your camera to decode optical streams.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={() => Camera.requestCameraPermission().then(p => setHasPermission(p === 'granted'))}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#0d0b1a', '#0a0a0f']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📷 Receive File</Text>
        <Text style={styles.headerSub}>Point camera at the sender's screen</Text>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.viewfinderWrap}>
        {device ? (
          <Camera
            style={styles.camera}
            device={device}
            isActive={status === 'scanning'}
            codeScanner={codeScanner}
          />
        ) : (
          <View style={[styles.camera, { backgroundColor: '#111' }]}>
            <Text style={{ color: '#64748b', textAlign: 'center' }}>No camera available</Text>
          </View>
        )}

        {/* Corner reticles */}
        <View style={[styles.reticle, styles.tl]} />
        <View style={[styles.reticle, styles.tr]} />
        <View style={[styles.reticle, styles.bl]} />
        <View style={[styles.reticle, styles.br]} />

        {/* Scan line */}
        {status === 'scanning' && (
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanAnim }] }]} />
        )}

        {/* Complete overlay */}
        {status === 'complete' && (
          <View style={styles.successOverlay}>
            <Text style={styles.successTick}>✓</Text>
            <Text style={styles.successLabel}>Transfer Complete</Text>
          </View>
        )}

        {/* Live badge */}
        {status === 'scanning' && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>SCANNING</Text>
          </View>
        )}
      </View>

      {/* Status panel */}
      <View style={styles.panel}>
        {status === 'idle' && (
          <View style={styles.idleState}>
            <Text style={styles.idleText}>
              Position the sender's screen inside the viewfinder, then tap Start.
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startScanning} activeOpacity={0.85}>
              <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.startBtnGrad}>
                <Text style={styles.startBtnText}>▶  Start Scanning</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {status === 'scanning' && (
          <View style={styles.scanState}>
            {/* Progress ring (simplified arc) */}
            <View style={styles.progressCircle}>
              <Text style={styles.progressPct}>{progress.toFixed(0)}%</Text>
            </View>
            <View style={styles.packetInfo}>
              <Text style={styles.packetVal}>{received}</Text>
              <Text style={styles.packetSep}>/</Text>
              <Text style={styles.packetVal}>{total || '?'}</Text>
              <Text style={styles.packetLabel}>packets</Text>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={reset}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'complete' && (
          <View style={styles.completeState}>
            <Text style={styles.completeTitle}>File Received!</Text>
            <Text style={styles.completeSub}>{received} packets decoded successfully</Text>
            <TouchableOpacity style={styles.startBtn} onPress={reset} activeOpacity={0.85}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.startBtnGrad}>
                <Text style={styles.startBtnText}>Receive Another</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>⚠ {errorMsg}</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={reset}>
              <Text style={styles.cancelBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tips}>
          {['Minimize ambient light', 'Keep phone steady', '20–50 cm from screen', 'Max screen brightness'].map(t => (
            <Text key={t} style={styles.tip}>· {t}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const R = 12;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  permBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permIcon: { fontSize: 48, marginBottom: 16 },
  permTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 8, textAlign: 'center' },
  permSub: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  permBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  viewfinderWrap: { width: VIEWFINDER, height: VIEWFINDER, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  camera: { width: '100%', height: '100%' },
  reticle: { position: 'absolute', width: 20, height: 20, borderColor: '#7c3aed', borderWidth: 3 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: R },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: R },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: R },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: R },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#7c3aed', opacity: 0.8, shadowColor: '#7c3aed', shadowOpacity: 1, shadowRadius: 4 },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,185,129,0.85)', alignItems: 'center', justifyContent: 'center' },
  successTick: { fontSize: 64, color: '#fff' },
  successLabel: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 8 },
  liveBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7c3aed' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#a78bfa', letterSpacing: 0.1 },
  panel: { flex: 1, padding: 20 },
  idleState: { gap: 16 },
  idleText: { fontSize: 13, color: '#64748b', lineHeight: 20, textAlign: 'center', marginTop: 8 },
  startBtn: { borderRadius: 14, overflow: 'hidden' },
  startBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  scanState: { alignItems: 'center', gap: 12 },
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.1)' },
  progressPct: { fontSize: 18, fontWeight: '800', color: '#7c3aed', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  packetInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  packetVal: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  packetSep: { fontSize: 16, color: '#475569' },
  packetLabel: { fontSize: 12, color: '#64748b' },
  cancelBtn: { borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  cancelBtnText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  completeState: { alignItems: 'center', gap: 8 },
  completeTitle: { fontSize: 20, fontWeight: '800', color: '#10b981' },
  completeSub: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  errorState: { alignItems: 'center', gap: 12 },
  errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center' },
  tips: { marginTop: 16, gap: 4 },
  tip: { fontSize: 11, color: '#334155', lineHeight: 16 },
});
