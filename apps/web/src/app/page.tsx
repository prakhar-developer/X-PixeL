import Link from 'next/link';
import styles from './page.module.css';

const STATS = [
  { value: '5', unit: 'Modes', label: 'QR · RGB · Flicker · Rolling Shutter · MUX' },
  { value: '256', unit: 'AES-GCM', label: 'End-to-end encryption' },
  { value: '99%', unit: 'Delivery', label: 'Reed-Solomon + Fountain codes' },
  { value: '0', unit: 'Dependencies', label: 'Air-gapped compatible' },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Adaptive Optical Engine',
    description: 'Real-time mode selection scoring FPS, thermal state, battery level, and error rate to pick the optimal transmission channel per second.',
    badge: 'Phase 4',
    color: 'var(--primary)',
  },
  {
    icon: '🔒',
    title: 'AES-256-GCM Encryption',
    description: 'Every packet is encrypted with AES-256-GCM before encoding. ECDH key exchange with forward secrecy. Secure Enclave / KeyStore key storage.',
    badge: 'Phase 1',
    color: 'var(--accent)',
  },
  {
    icon: '🔄',
    title: 'Reed-Solomon + Fountain FEC',
    description: 'Dual-layer error correction: RS(255, K) for symbol-level recovery, LT fountain codes for packet-level recovery without retransmissions.',
    badge: 'Phase 3',
    color: 'var(--secondary)',
  },
  {
    icon: '📡',
    title: '5 Optical Transmission Modes',
    description: 'Dynamic QR (10 KB/frame), RGB LSB modulation (50 KB/frame), invisible flicker (100 KB/frame), rolling shutter exploitation, and parallel MUX.',
    badge: 'All Phases',
    color: 'var(--warning)',
  },
  {
    icon: '🎯',
    title: 'GPU-Accelerated Rendering',
    description: 'Metal (iOS) and Vulkan (Android) pipeline for sub-millisecond frame encoding. V-sync locked output at up to 240 FPS.',
    badge: 'Phase 2',
    color: 'var(--primary)',
  },
  {
    icon: '🔧',
    title: '3-Way Optical Handshake',
    description: 'Mutual device identification, protocol version negotiation, and capability exchange over optical channel before data transfer begins.',
    badge: 'Phase 3',
    color: 'var(--accent)',
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />

        <div className={styles.heroContent}>
          <div className={`badge badge-primary ${styles.heroBadge}`}>
            <span className="pulse-dot" />
            100% Offline Device-to-Device Optical Transfer
          </div>

          <h1 className={styles.heroTitle}>
            Transfer Files at the<br />
            <span className="gradient-text">Speed of Light</span>
          </h1>

          <p className={styles.heroSubtitle}>
            X-Pixel transforms screens and cameras into a high-speed, ultra-secure
            optical communication network. No internet, no backend server, no Bluetooth, 
            and no cables required. Works in complete airplane mode.
          </p>

          <div className={styles.heroCTA}>
            <Link href="/transfer/send" className="btn btn-primary" id="hero-send-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              Send a File
            </Link>
            <Link href="/transfer/receive" className="btn btn-ghost" id="hero-receive-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Receive a File
            </Link>
          </div>

          {/* Optical wave illustration */}
          <div className={styles.heroVisual}>
            <div className={styles.device}>
              <div className={styles.deviceBody}>
                <div className={styles.deviceScreen}>
                  <div className={styles.qrGrid}>
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={styles.qrCell}
                        style={{
                          background: Math.random() > 0.5 ? 'var(--primary)' : 'transparent',
                          opacity: 0.7 + Math.random() * 0.3,
                        }} />
                    ))}
                  </div>
                </div>
              </div>
              <span className={styles.deviceLabel}>Sender</span>
            </div>

            <div className={styles.waveContainer}>
              <div className={styles.waveLines}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={styles.waveLine}
                    style={{ animationDelay: `${i * 0.3}s`, opacity: 1 - i * 0.15 }} />
                ))}
              </div>
              <div className={styles.photonLabel}>Photons @ 3×10⁸ m/s</div>
            </div>

            <div className={styles.device}>
              <div className={`${styles.deviceBody} ${styles.receiver}`}>
                <div className={styles.deviceScreen}>
                  <div className={styles.scanLine} />
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(124,58,237,0.6)" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
              </div>
              <span className={styles.deviceLabel}>Receiver</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────────── */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((stat) => (
              <div key={stat.unit} className={styles.statCard}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statUnit}>{stat.unit}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────────── */}
      <section className={`section ${styles.featuresSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className="badge badge-secondary">Technology Stack</div>
            <h2 className={styles.sectionTitle}>
              Production-Grade<br />
              <span className="gradient-text">Optical Protocol</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Every layer engineered for real-world reliability — from GPU rendering to
              cryptographic integrity verification.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={`${styles.featureCard} card`} id={`feature-${feature.badge.toLowerCase().replace(/\s/g, '-')}`}>
                <div className={styles.featureHeader}>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                  <span className={`badge badge-accent`} style={{ fontSize: '0.65rem' }}>{feature.badge}</span>
                </div>
                <h3 className={styles.featureTitle} style={{ color: feature.color }}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Architecture diagram ─────────────────────────────────────────────── */}
      <section className={`section ${styles.archSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className="badge badge-primary">7-Layer Protocol</div>
            <h2 className={styles.sectionTitle}>
              Data Flow Architecture
            </h2>
          </div>

          <div className={styles.archDiagram}>
            {[
              { label: 'Application', desc: 'File selection & session management', color: 'var(--primary)' },
              { label: 'Encryption', desc: 'AES-256-GCM + ECDH key exchange', color: 'var(--accent)' },
              { label: 'Fragmentation', desc: 'Packet splitting + FEC encoding', color: 'var(--secondary)' },
              { label: 'Adaptive Engine', desc: 'Mode selection + bitrate control', color: 'var(--warning)' },
              { label: 'Optical Encoding', desc: 'QR / RGB / Flicker / Rolling Shutter', color: 'var(--primary)' },
              { label: 'Frame Generation', desc: 'GPU Metal/Vulkan rendering pipeline', color: 'var(--accent)' },
              { label: 'Display Output', desc: 'V-sync locked at 15–240 FPS', color: 'var(--secondary)' },
            ].map((layer, i, arr) => (
              <div key={layer.label} className={styles.archLayer}>
                <div className={styles.archLayerContent} style={{ borderColor: `${layer.color}30` }}>
                  <div className={styles.archLayerNum} style={{ color: layer.color }}>L{i + 1}</div>
                  <div className={styles.archLayerLabel}>{layer.label}</div>
                  <div className={styles.archLayerDesc}>{layer.desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className={styles.archArrow}>↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow} />
            <h2 className={styles.ctaTitle}>Ready to transfer without internet?</h2>
            <p className={styles.ctaSubtitle}>
              Experience the industry-grade optical transfer protocol right in your browser. No backend server required.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/transfer/send" className="btn btn-primary" id="cta-send-btn">
                Start Sending
              </Link>
              <Link href="/transfer/receive" className="btn btn-ghost" id="cta-receive-btn">
                Start Receiving
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
