import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [defaultProtocol, setDefaultProtocol] = useState('QR_DYNAMIC');
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [keepScreenOn, setKeepScreenOn] = useState(true);
  const [lowLightMode, setLowLightMode] = useState(false);

  useEffect(() => {
    // Load preferences
    const loadSettings = async () => {
      try {
        const dp = await AsyncStorage.getItem('default_protocol');
        const hf = await AsyncStorage.getItem('haptic_feedback');
        const kso = await AsyncStorage.getItem('keep_screen_on');
        const llm = await AsyncStorage.getItem('low_light_mode');

        if (dp) setDefaultProtocol(dp);
        if (hf !== null) setHapticFeedback(hf === 'true');
        if (kso !== null) setKeepScreenOn(kso === 'true');
        if (llm !== null) setLowLightMode(llm === 'true');
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to save setting', e);
    }
  };

  const handleProtocolChange = (proto: string) => {
    setDefaultProtocol(proto);
    saveSetting('default_protocol', proto);
  };

  const toggleHaptic = (value: boolean) => {
    setHapticFeedback(value);
    saveSetting('haptic_feedback', String(value));
  };

  const toggleScreen = (value: boolean) => {
    setKeepScreenOn(value);
    saveSetting('keep_screen_on', String(value));
  };

  const toggleLowLight = (value: boolean) => {
    setLowLightMode(value);
    saveSetting('low_light_mode', String(value));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#0d0b1a', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ Settings</Text>
          <Text style={styles.headerSub}>Configure optical transmission properties</Text>
        </View>

        {/* Default Protocol Selection */}
        <Text style={styles.sectionLabel}>DEFAULT PROTOCOL</Text>
        <View style={styles.sectionCard}>
          {[
            { id: 'QR_DYNAMIC', name: 'QR Dynamic' },
            { id: 'RGB_LSB', name: 'RGB LSB Modulation' },
            { id: 'INVISIBLE_FLICKER', name: 'Invisible Flicker' },
            { id: 'HYBRID', name: 'Hybrid Adaptation' },
          ].map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.radioRow}
              onPress={() => handleProtocolChange(p.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.radioLabel}>{p.name}</Text>
              <View style={[styles.radioOuter, defaultProtocol === p.id && styles.radioOuterSelected]}>
                {defaultProtocol === p.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transmission Settings */}
        <Text style={styles.sectionLabel}>TRANSMISSION PREFERENCES</Text>
        <View style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchLabel}>Haptic Feedback</Text>
              <Text style={styles.switchSub}>Vibrate on frame sync & receipt</Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={toggleHaptic}
              trackColor={{ false: '#1e293b', true: '#7c3aed' }}
              thumbColor={hapticFeedback ? '#a78bfa' : '#64748b'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchLabel}>Keep Screen Awake</Text>
              <Text style={styles.switchSub}>Prevent lock screen during broadcast</Text>
            </View>
            <Switch
              value={keepScreenOn}
              onValueChange={toggleScreen}
              trackColor={{ false: '#1e293b', true: '#7c3aed' }}
              thumbColor={keepScreenOn ? '#a78bfa' : '#64748b'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchLabel}>Low Light Optimization</Text>
              <Text style={styles.switchSub}>Adapt colors to reduce glare in dark rooms</Text>
            </View>
            <Switch
              value={lowLightMode}
              onValueChange={toggleLowLight}
              trackColor={{ false: '#1e293b', true: '#7c3aed' }}
              thumbColor={lowLightMode ? '#a78bfa' : '#64748b'}
            />
          </View>
        </View>

        {/* Permissions */}
        <Text style={styles.sectionLabel}>PERMISSIONS</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>Open System Settings</Text>
          <Text style={styles.actionBtnArrow}>→</Text>
        </TouchableOpacity>

        {/* Build version info */}
        <View style={styles.versionWrap}>
          <Text style={styles.versionText}>X-Pixel Mobile App · Air-Gapped Edition</Text>
          <Text style={styles.versionNumber}>Version 1.0.0 (Build 1)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24, paddingTop: Platform.OS === 'ios' ? 60 : 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.12,
    marginBottom: 10,
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.4)',
  },
  radioLabel: { fontSize: 13, fontWeight: '600', color: '#f1f5f9' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: '#7c3aed' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7c3aed' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.4)',
  },
  switchTextCol: { flex: 1, paddingRight: 16 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: '#f1f5f9' },
  switchSub: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 15 },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#f1f5f9' },
  actionBtnArrow: { fontSize: 14, color: '#64748b', fontWeight: '800' },

  versionWrap: { alignItems: 'center', marginTop: 12 },
  versionText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  versionNumber: { fontSize: 10, color: '#334155', marginTop: 2, fontFamily: 'monospace' },
});
