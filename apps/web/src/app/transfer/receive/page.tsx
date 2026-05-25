'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import Link from 'next/link';
import { useOpticalReceiver } from '@/hooks/useOpticalReceiver';
import styles from './page.module.css';

export default function ReceiverPage() {
  const webcamRef = useRef<Webcam>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [cameraReady, setCameraReady] = useState(false);

  const {
    isReceiving,
    progress,
    receivedCount,
    totalCount,
    receivedFile,
    error,
    processFrame,
    startReceiving,
    reset,
  } = useOpticalReceiver();

  const scanLoop = useCallback(() => {
    if (!isReceiving || receivedFile) return;

    const video = webcamRef.current?.video;
    const canvas = hiddenCanvasRef.current;

    if (video && canvas && video.readyState === 4) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        processFrame(imageData);
      }
    }

    animationRef.current = requestAnimationFrame(scanLoop);
  }, [isReceiving, receivedFile, processFrame]);

  useEffect(() => {
    if (isReceiving && !receivedFile) {
      animationRef.current = requestAnimationFrame(scanLoop);
    } else {
      if (animationRef.current !== undefined) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current !== undefined) cancelAnimationFrame(animationRef.current);
    };
  }, [isReceiving, receivedFile, scanLoop]);

  const handleDownload = () => {
    if (!receivedFile) return;
    const url = URL.createObjectURL(receivedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x-pixel-transfer-${Date.now()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/transfer" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </Link>
        <div className={styles.headerCenter}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>📷</span>
            Receive File
          </h1>
          <p className={styles.subtitle}>Point your camera at the sender's screen to decode the optical stream.</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left — Camera */}
        <div className={styles.leftCol}>
          <div className={styles.cameraWrap}>
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{ facingMode: 'environment', width: 1280, height: 960 }}
              className={styles.webcam}
              onUserMedia={() => setCameraReady(true)}
              onUserMediaError={() => setCameraReady(false)}
            />
            <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

            {/* Corner reticles */}
            <div className={`${styles.reticle} ${styles.tl}`} />
            <div className={`${styles.reticle} ${styles.tr}`} />
            <div className={`${styles.reticle} ${styles.bl}`} />
            <div className={`${styles.reticle} ${styles.br}`} />

            {/* Scan line animation when active */}
            {isReceiving && !receivedFile && (
              <div className={styles.scanLine} />
            )}

            {/* Camera not ready overlay */}
            {!cameraReady && (
              <div className={styles.cameraOverlay}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <p>Requesting camera access...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Status Panel */}
        <div className={styles.rightCol}>
          <div className={styles.statusPanel}>
            <h2 className={styles.panelTitle}>Transfer Status</h2>

            {/* Idle */}
            {!isReceiving && !receivedFile && !error && (
              <div className={styles.idleState}>
                <div className={styles.idleIcon}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <p className={styles.idleText}>
                  Position your camera so the sender's screen fills most of the viewfinder, then tap Start.
                </p>
                <button
                  className={styles.startBtn}
                  onClick={startReceiving}
                  disabled={!cameraReady}
                >
                  {cameraReady ? '▶ Start Scanning' : 'Waiting for camera...'}
                </button>
              </div>
            )}

            {/* Receiving */}
            {isReceiving && !receivedFile && (
              <div className={styles.activeState}>
                <div className={styles.progressRing}>
                  <svg viewBox="0 0 80 80" className={styles.ring}>
                    <circle cx="40" cy="40" r="34" stroke="var(--surface)" strokeWidth="6" fill="none"/>
                    <circle
                      cx="40" cy="40" r="34"
                      stroke="url(#ringGradient)" strokeWidth="6" fill="none"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.4s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                    />
                    <defs>
                      <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)"/>
                        <stop offset="100%" stopColor="var(--accent)"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className={styles.ringCenter}>
                    <div className={styles.ringPct}>{progress.toFixed(0)}%</div>
                  </div>
                </div>

                <div className={styles.packetStats}>
                  <div className={styles.packetStat}>
                    <span className={styles.packetVal}>{receivedCount}</span>
                    <span className={styles.packetKey}>Received</span>
                  </div>
                  <div className={styles.packetDivider}>/</div>
                  <div className={styles.packetStat}>
                    <span className={styles.packetVal}>{totalCount || '?'}</span>
                    <span className={styles.packetKey}>Total</span>
                  </div>
                </div>

                <p className={styles.scanningHint}>Scanning... keep the screen in frame</p>
                <button className={styles.cancelBtn} onClick={reset}>Cancel</button>
              </div>
            )}

            {/* Complete */}
            {receivedFile && (
              <div className={styles.completeState}>
                <div className={styles.successCircle}>✓</div>
                <h3 className={styles.successTitle}>Transfer Complete!</h3>
                <p className={styles.successDesc}>
                  {(receivedFile.size / 1024).toFixed(1)} KB received — {receivedCount} packets decoded
                </p>
                <button className={styles.downloadBtn} onClick={handleDownload}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download File
                </button>
                <button className={styles.resetBtn} onClick={reset}>Receive Another</button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className={styles.errorState}>
                <p className={styles.errorText}>⚠ {error}</p>
                <button className={styles.resetBtn} onClick={reset}>Try Again</button>
              </div>
            )}

            {/* Tips */}
            <div className={styles.tips}>
              <p className={styles.tipTitle}>Tips for best results</p>
              <ul className={styles.tipList}>
                <li>Minimize ambient light reflections</li>
                <li>Keep phone steady &amp; level</li>
                <li>Ensure sender's screen brightness is at 100%</li>
                <li>Distance: 20–50 cm from screen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
