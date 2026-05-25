'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useOpticalSender } from '@/hooks/useOpticalSender';
import Link from 'next/link';
import styles from './page.module.css';

export default function SenderPage() {
  const { sendFile, toggleBroadcast, reset, isEncoding, encodeProgress, encodeStatus, frames, isBroadcasting } = useOpticalSender();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    frameIndexRef.current = 0;
    sendFile(file);
  }, [sendFile]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Broadcast render loop
  useEffect(() => {
    if (!isBroadcasting || frames.length === 0) {
      if (animationRef.current !== undefined) cancelAnimationFrame(animationRef.current);
      return;
    }

    const fps = 15; // 15 FPS — reliable scanning speed
    const interval = 1000 / fps;

    const renderLoop = (time: number) => {
      animationRef.current = requestAnimationFrame(renderLoop);
      if (time - lastTimeRef.current < interval) return;
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = frames[frameIndexRef.current];
      frameIndexRef.current = (frameIndexRef.current + 1) % frames.length;
    };

    animationRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationRef.current !== undefined) cancelAnimationFrame(animationRef.current);
    };
  }, [isBroadcasting, frames]);

  const handleReset = () => {
    setSelectedFile(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
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
            <span className={styles.titleIcon}>📡</span>
            Broadcast File
          </h1>
          <p className={styles.subtitle}>Encode your file into an optical stream and broadcast it to any device.</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left Column — Controls */}
        <div className={styles.leftCol}>

          {/* File Dropzone */}
          <div
            className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''} ${selectedFile ? styles.hasFile : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            {!selectedFile ? (
              <>
                <div className={styles.dropIcon}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className={styles.dropTitle}>Drop your file here</p>
                <p className={styles.dropHint}>or click to browse</p>
                <div className={styles.dropBadge}>Any file type · Up to 10 MB</div>
              </>
            ) : (
              <div className={styles.fileCard}>
                <div className={styles.fileIconWrap}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <div className={styles.fileName}>{selectedFile.name}</div>
                  <div className={styles.fileSize}>{formatFileSize(selectedFile.size)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Encoding Progress */}
          {isEncoding && (
            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>
                  <span className={styles.pulseDot} />
                  Encoding...
                </span>
                <span className={styles.progressPct}>{encodeProgress.toFixed(0)}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${encodeProgress}%` }} />
              </div>
              <p className={styles.progressStatus}>{encodeStatus}</p>
            </div>
          )}

          {/* Stats + Actions (after encoding) */}
          {frames.length > 0 && !isEncoding && (
            <div className={styles.controlCard}>
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <div className={styles.statVal}>{frames.length}</div>
                  <div className={styles.statKey}>Frames</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statVal}>{selectedFile ? formatFileSize(selectedFile.size) : '—'}</div>
                  <div className={styles.statKey}>File Size</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statVal}>15 FPS</div>
                  <div className={styles.statKey}>Broadcast</div>
                </div>
              </div>

              <button
                className={`${styles.broadcastBtn} ${isBroadcasting ? styles.broadcastActive : ''}`}
                onClick={toggleBroadcast}
              >
                {isBroadcasting ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    Pause Broadcast
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Start Broadcast
                  </>
                )}
              </button>

              <button className={styles.resetBtn} onClick={handleReset}>
                Send Different File
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className={styles.instructions}>
            <h3 className={styles.instrTitle}>How it works</h3>
            <ol className={styles.instrList}>
              <li>Upload any file above</li>
              <li>Wait for encoding to complete</li>
              <li>Press <strong>Start Broadcast</strong></li>
              <li>On the receiver device, open <strong>Receive a File</strong> and point the camera at this screen</li>
            </ol>
          </div>
        </div>

        {/* Right Column — QR Canvas */}
        <div className={styles.rightCol}>
          <div className={styles.canvasWrap}>
            <div className={styles.canvasLabel}>Optical Stream</div>
            {!isBroadcasting && frames.length === 0 && (
              <div className={styles.canvasIdle}>
                <div className={styles.idleQr}>
                  {/* Static decorative QR grid */}
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={styles.idleCell}
                      style={{ opacity: Math.random() > 0.5 ? 0.8 : 0.1 }}
                    />
                  ))}
                </div>
                <p className={styles.idleText}>
                  {isEncoding ? 'Preparing optical stream...' : 'Awaiting file...'}
                </p>
              </div>
            )}
            {!isBroadcasting && frames.length > 0 && (
              <div className={styles.readyOverlay}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <p>Press Start Broadcast</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className={`${styles.canvas} ${isBroadcasting ? styles.canvasVisible : ''}`}
            />
            {isBroadcasting && (
              <div className={styles.liveBar}>
                <span className={styles.liveDot} /> LIVE
                <span className={styles.frameCount}>Frame {(frameIndexRef.current % frames.length) + 1} / {frames.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
