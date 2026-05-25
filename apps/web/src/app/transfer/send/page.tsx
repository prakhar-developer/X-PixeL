'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useOpticalSender } from '@/hooks/useOpticalSender';
import Link from 'next/link';
import { PROTOCOLS, TransmissionProtocol } from '@/lib/optical';
import styles from './page.module.css';

type Step = 'drop' | 'protocol' | 'broadcast';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function SenderPage() {
  const { sendFile, toggleBroadcast, reset, isEncoding, encodeProgress, encodeStatus, frames, isBroadcasting, activeProtocol, activeFps } = useOpticalSender();
  const [step, setStep] = useState<Step>('drop');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<TransmissionProtocol>('QR_DYNAMIC');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file.size <= 0) {
      setUploadError('Selected file is empty. Please choose a non-empty file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File is too large. Please select a file up to 10 MB.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setStep('protocol');
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
      return;
    }
    setUploadError('No file selected. Please choose a file to continue.');
  };

  const openFilePicker = () => {
    if (!fileInputRef.current) return;
    // Reset first so selecting the same file again still triggers onChange.
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleStartEncoding = () => {
    if (!selectedFile) return;
    setStep('broadcast');
    frameIndexRef.current = 0;
    sendFile(selectedFile, selectedProtocol);
  };

  // Broadcast render loop — FPS driven by active protocol
  useEffect(() => {
    if (!isBroadcasting || frames.length === 0) {
      if (animationRef.current !== undefined) cancelAnimationFrame(animationRef.current);
      return;
    }

    const interval = 1000 / activeFps;

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
  }, [isBroadcasting, frames, activeFps]);

  const handleReset = () => {
    setSelectedFile(null);
    setUploadError(null);
    setStep('drop');
    setSelectedProtocol('QR_DYNAMIC');
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const activeProtocolInfo = PROTOCOLS.find((p) => p.id === (isBroadcasting ? activeProtocol : selectedProtocol));

  return (
    <div className={styles.page}>
      <input
        id="sender-file-input"
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* Header */}
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
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
        {/* Step indicator */}
        <div className={styles.stepIndicator}>
          {(['drop', 'protocol', 'broadcast'] as Step[]).map((s, i) => (
            <div key={s} className={`${styles.stepDot} ${step === s ? styles.stepActive : ''} ${(step === 'protocol' && i === 0) || (step === 'broadcast' && i < 2) ? styles.stepDone : ''}`}>
              <span>{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left Column — Controls */}
        <div className={styles.leftCol}>

          {/* STEP 1: File Dropzone */}
          {step === 'drop' && (
            <div
              className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''}`}
              onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={handleFileDrop}
              onClick={openFilePicker}
            >
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
            </div>
          )}

          {uploadError && (
            <div className={styles.uploadError} role="alert">
              {uploadError}
            </div>
          )}

          {/* STEP 2: Protocol Selector */}
          {step === 'protocol' && selectedFile && (
            <div className={styles.protocolStep}>
              {/* Selected file card */}
              <div className={styles.fileCard}>
                <div className={styles.fileIconWrap}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{selectedFile.name}</div>
                  <div className={styles.fileSize}>{formatFileSize(selectedFile.size)}</div>
                </div>
                <button className={styles.changeFileBtn} onClick={() => { setStep('drop'); setSelectedFile(null); setUploadError(null); openFilePicker(); }}>
                  Change
                </button>
              </div>

              <p className={styles.protocolLabel}>Choose Transmission Protocol</p>

              {/* Protocol grid */}
              <div className={styles.protocolGrid}>
                {PROTOCOLS.map((proto) => (
                  <button
                    key={proto.id}
                    className={`${styles.protocolCard} ${selectedProtocol === proto.id ? styles.protocolSelected : ''}`}
                    style={{ '--proto-color': proto.color } as React.CSSProperties}
                    onClick={() => setSelectedProtocol(proto.id as TransmissionProtocol)}
                  >
                    <div className={styles.protoHeader}>
                      <span className={styles.protoIcon}>{proto.icon}</span>
                      {selectedProtocol === proto.id && <span className={styles.protoCheck}>✓</span>}
                    </div>
                    <div className={styles.protoName}>{proto.name}</div>
                    <div className={styles.protoTagline}>{proto.tagline}</div>
                    <div className={styles.protoStats}>
                      <span className={styles.protoStat}>{proto.throughput}</span>
                      <span className={styles.protoStat}>{proto.fps} FPS</span>
                    </div>
                    <p className={styles.protoDesc}>{proto.description}</p>
                  </button>
                ))}
              </div>

              <button className={styles.encodeBtn} onClick={handleStartEncoding}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Start Encoding with {PROTOCOLS.find(p => p.id === selectedProtocol)?.name}
              </button>
            </div>
          )}

          {/* STEP 3: Encoding Progress + Broadcast Controls */}
          {step === 'broadcast' && (
            <>
              {/* Active protocol badge */}
              <div className={styles.activeProcoBadge} style={{ '--proto-color': activeProtocolInfo?.color } as React.CSSProperties}>
                <span className={styles.activeProcoDot} />
                <span>{activeProtocolInfo?.name}</span>
                <span className={styles.activeProcoFps}>{activeFps} FPS</span>
              </div>

              {/* File card compact */}
              {selectedFile && (
                <div className={styles.fileCard}>
                  <div className={styles.fileIconWrap}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{selectedFile.name}</div>
                    <div className={styles.fileSize}>{formatFileSize(selectedFile.size)}</div>
                  </div>
                </div>
              )}

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
                    <div className={styles.progressFill} style={{ width: `${encodeProgress}%`, background: activeProtocolInfo?.color }} />
                  </div>
                  <p className={styles.progressStatus}>{encodeStatus}</p>
                </div>
              )}

              {/* Stats + Actions */}
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
                      <div className={styles.statVal}>{activeFps} FPS</div>
                      <div className={styles.statKey}>Broadcast</div>
                    </div>
                  </div>

                  <button
                    className={`${styles.broadcastBtn} ${isBroadcasting ? styles.broadcastActive : ''}`}
                    style={{ '--proto-color': activeProtocolInfo?.color } as React.CSSProperties}
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
                  <li>File encoded into optical frames</li>
                  <li>Press <strong>Start Broadcast</strong></li>
                  <li>On the receiver, open <strong>Receive a File</strong></li>
                  <li>Point camera at this screen</li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* Right Column — Optical Canvas */}
        <div className={styles.rightCol}>
          <div className={styles.canvasWrap}>
            <div className={styles.canvasLabel}>
              {isBroadcasting ? (
                <span style={{ color: activeProtocolInfo?.color }}>{activeProtocolInfo?.icon} {activeProtocolInfo?.name} Stream</span>
              ) : 'Optical Stream'}
            </div>

            <div className={styles.canvasSurface}>
              {/* Idle state */}
              {!isBroadcasting && frames.length === 0 && step !== 'protocol' && (
                <div className={styles.canvasIdle}>
                  <div className={styles.idleQr}>
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={styles.idleCell}
                        style={{ opacity: Math.random() > 0.5 ? 0.8 : 0.1 }}
                      />
                    ))}
                  </div>
                  <p className={styles.idleText}>
                    {isEncoding ? 'Preparing optical stream...' : step === 'drop' ? 'Awaiting file...' : 'Ready to encode'}
                  </p>
                </div>
              )}

              {/* Protocol preview when selecting */}
              {step === 'protocol' && !isBroadcasting && (
                <div className={styles.protocolPreview} style={{ '--proto-color': activeProtocolInfo?.color } as React.CSSProperties}>
                  <div className={styles.previewIcon}>{activeProtocolInfo?.icon}</div>
                  <div className={styles.previewName}>{activeProtocolInfo?.name}</div>
                  <div className={styles.previewThroughput}>{activeProtocolInfo?.throughput}</div>
                  <div className={styles.previewGrid}>
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={styles.previewCell}
                        style={{
                          background: activeProtocolInfo?.id === 'QR_DYNAMIC'
                            ? (Math.random() > 0.5 ? 'var(--proto-color)' : 'transparent')
                            : `hsl(${(i * 37 + Date.now() / 100) % 360}, 70%, 50%)`,
                          opacity: 0.3 + Math.random() * 0.7,
                        }}
                      />
                    ))}
                  </div>
                  <p className={styles.previewHint}>Select a protocol to preview its pattern</p>
                </div>
              )}

              {/* Ready overlay (encoding done, not yet broadcasting) */}
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
            </div>

            {isBroadcasting && (
              <div className={styles.liveBar} style={{ '--proto-color': activeProtocolInfo?.color } as React.CSSProperties}>
                <span className={styles.liveDot} />
                LIVE · {activeProtocolInfo?.name}
                <span className={styles.frameCount}>
                  Frame {(frameIndexRef.current % frames.length) + 1} / {frames.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
