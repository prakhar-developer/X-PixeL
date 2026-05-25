'use client';

import { useState } from 'react';
import styles from './page.module.css';

const MODES = [
  {
    name: 'QR Dynamic',
    code: 'QR',
    throughput: '10-25 KB/frame',
    fps: '15-30 FPS',
    robustness: 'Ultra-high (95%)',
    usecase: 'Standard bootstrapping, poor alignment, or low-light scenarios.',
    desc: 'Encodes binary payloads into high-density dynamic QR codes. Features high structural redundancy and is compatible with any generic camera pipeline.',
  },
  {
    name: 'RGB LSB Modulation',
    code: 'RGB',
    throughput: '50-120 KB/frame',
    fps: '30-60 FPS',
    robustness: 'Balanced (70%)',
    usecase: 'Fast, secure transfers between modern smartphones under normal lighting.',
    desc: 'Modulates bits in the least-significant channels of RGB colors. Perceptually subtle but offers 5x capacity over standard black-and-white patterns.',
  },
  {
    name: 'Invisible Flicker',
    code: 'FLICKER',
    throughput: '100-250 KB/frame',
    fps: '60-120 FPS',
    robustness: 'Moderate (50%)',
    usecase: 'Ultra-fast transfers under optimal focus and low-jitter environments.',
    desc: 'Exploits high display refresh rates and fast shutter speeds to modulate luminosity. Invisible to human sight but highly readable by high-speed camera sensors.',
  },
  {
    name: 'Hybrid Adaptation',
    code: 'HYBRID',
    throughput: 'Adaptive',
    fps: 'Adaptive',
    robustness: 'High (80%)',
    usecase: 'Dynamic environments with changing light, movement, and temperature.',
    desc: 'Jointly orchestrates Reed-Solomon strength, packet size, and frame rate. Falls back to QR when alignment drops, scales up to RGB/Flicker when connection is secure.',
  },
];

export default function ProtocolPage() {
  const [activeMode, setActiveMode] = useState(MODES[0]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Protocol Explorer</h1>
        <p className={styles.subtitle}>Deep dive into X-Pixel\'s multi-modal optical transmission engine specs.</p>
      </div>

      <div className={styles.layout}>
        {/* Left Side: Mode Selection Tab Cards */}
        <div className={styles.sidebar}>
          {MODES.map((mode) => (
            <div
              key={mode.code}
              className={`${styles.modeTab} ${activeMode.code === mode.code ? styles.activeTab : ''}`}
              onClick={() => setActiveMode(mode)}
            >
              <div className={styles.modeTabHeader}>
                <span className={styles.modeName}>{mode.name}</span>
                <span className={`badge ${styles.modeBadge}`}>{mode.code}</span>
              </div>
              <div className={styles.modeBrief}>{mode.usecase}</div>
            </div>
          ))}
        </div>

        {/* Right Side: Specifications and Technical Breakdown */}
        <div className={styles.content}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>{activeMode.name} Details</h2>
              <span className={styles.activeCode}>{activeMode.code} Protocol Layer</span>
            </div>

            <p className={styles.panelDesc}>{activeMode.desc}</p>

            <div className={styles.specsGrid}>
              <div className={styles.specCard}>
                <span className={styles.specLabel}>Data Density</span>
                <span className={styles.specVal}>{activeMode.throughput}</span>
              </div>
              <div className={styles.specCard}>
                <span className={styles.specLabel}>Required Frame Rate</span>
                <span className={styles.specVal}>{activeMode.fps}</span>
              </div>
              <div className={styles.specCard}>
                <span className={styles.specLabel}>Robustness Score</span>
                <span className={styles.specVal}>{activeMode.robustness}</span>
              </div>
            </div>

            {/* Simulated pattern representation */}
            <div className={styles.visualPreview}>
              <span className={styles.previewLabel}>Modulation Pattern Preview</span>
              <div className={`${styles.patternContainer} ${styles[activeMode.code.toLowerCase()]}`}>
                {activeMode.code === 'QR' && (
                  <div className={styles.qrGrid}>
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div
                        key={i}
                        className={styles.qrBlock}
                        style={{ background: Math.random() > 0.45 ? 'var(--text-primary)' : 'transparent' }}
                      />
                    ))}
                  </div>
                )}
                {activeMode.code === 'RGB' && (
                  <div className={styles.rgbGradient} />
                )}
                {activeMode.code === 'FLICKER' && (
                  <div className={styles.flickerWaves}>
                    <div className={styles.flickerGrid} />
                  </div>
                )}
                {activeMode.code === 'HYBRID' && (
                  <div className={styles.hybridCombo}>
                    <div className={styles.rgbGradient} />
                    <div className={styles.hybridOverlays} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
