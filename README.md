# X-Pixel: Production-Grade Optical Communication Platform

Transform screens and cameras into a high-speed, ultra-secure optical communication network.

## Vision

Enable ultra-secure offline file transfer between Android and iOS devices using only visual optical transmission — without internet, Wi-Fi, Bluetooth, NFC, hotspot, cables, or external hardware.

## Core Technology

- **Cross-platform**: Android ↔ Android, iPhone ↔ iPhone, Android ↔ iPhone
- **Completely offline**: Works in airplane mode
- **Optical transmission modes**: Dynamic QR, RGB modulation, invisible flicker, rolling-shutter exploitation, parallel multiplexing
- **Enterprise-grade**: AES-256 encryption, Reed Solomon error correction, fountain codes
- **Adaptive**: Real-time mode selection based on device state (thermal, battery, FPS, lighting)
- **Ultra-secure**: End-to-end encrypted, air-gapped compatible

## Architecture

### Tech Stack

- **Framework**: React Native + Expo + Native modules
- **GPU**: Metal (iOS), Vulkan (Android), Skia rendering
- **Computer Vision**: AVFoundation + Camera2 + OpenCV
- **Cryptography**: libsodium (AES-256-GCM)
- **Error Correction**: Reed Solomon + Fountain codes
- **Storage**: SQLite + LevelDB
- **Protocol**: Protocol Buffers

### Project Structure

```
x-pixel/
├── packages/
│   ├── core/              # Shared optical protocol & packet system
│   ├── optical-engine/    # Adaptive optical mode selection
│   ├── cv-pipeline/       # Computer vision abstractions
│   ├── ui-kit/            # Design system components
│   └── native/            # Android/iOS native modules
├── apps/
│   ├── mobile/            # React Native application
│   └── web/               # Next.js 14 Web Dashboard (Phase 5)
├── docs/                  # Architecture & protocol specs
└── tests/                 # Comprehensive test suite
```

## Implementation Status

- **Phase 0**: Foundation ✅ COMPLETE (100%)
- **Phase 1**: Core Optical Engine ✅ COMPLETE (100%)
- **Phase 2**: Frame Generation & Camera Pipeline ✅ COMPLETE (100%)
  - Week 1: Foundation ✅ GPU abstractions, camera framework, stabilization
  - Week 2: Platform Integration ✅ iOS Metal/AVFoundation, Android Vulkan/Camera2
  - Week 3: Optimization ✅ RANSAC, Lucas-Kanade, Kalman, thermal/battery optimization
- **Phase 3**: Synchronization & Reliability ✅ COMPLETE (100%)
  - Optical handshake protocol (3-way sync)
  - Reed-Solomon FEC
  - Fountain codes
  - Selective repeat protocol
  - Session management state machine
  - Decode pipeline with integrity verification
- **Phase 4**: Adaptive Optical Engine ✅ COMPLETE (100%)
  - Environment monitoring (real-time metrics)
  - Intelligent mode selection algorithm
  - Adaptive FEC strength control
  - Adaptive bitrate/frame rate control
  - Seamless mode transitions
  - Comprehensive telemetry
- **Phase 5**: UI/UX & Interactive Web Dashboard ✅ COMPLETE (100%)
  - High-density telemetry grid
  - Simulated real-time adaptive optical engine
  - Canvas-based photon wave and packet flow visualizers
  - Custom React Hook state synchronization
- **Phase 6-8**: Advanced modes, optimization, hardening ⏳ PENDING

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn 1.22+ (Classic Workspaces) or Yarn 3+
- Xcode 14+ (iOS development)
- Android Studio (Android development)

### Installation

```bash
cd x-pixel
yarn install
```

### Running the Web Dashboard

```bash
# Run Next.js web application locally in development mode
yarn dev:web

# Build Next.js web application for production
yarn build:web

# Run built production server
yarn start:web
```

### Development Workflow

```bash
# Run tests
yarn test

# Type checking
yarn type-check

# Linting
yarn lint

# Build all monorepo packages (including web app)
yarn build
```

## Development Roadmap

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| 0 | 2 weeks | Foundation & scaffolding | ✅ Complete |
| 1 | 3 weeks | Core optical engine (QR, RGB, CRC, Packet) | ✅ Complete |
| 2 | 3 weeks | Frame generation & camera pipeline | ✅ Complete |
| 3 | 2 weeks | Sync & reliability (FEC, handshake) | ✅ Complete |
| 4 | 2 weeks | Adaptive engine (mode selection) | ✅ Complete |
| 5 | 4 weeks | UI/UX & visualization (Web Dashboard) | ✅ Complete |
| 6 | 3 weeks | Advanced transmission modes | ⏳ Pending |
| 7 | 3 weeks | Testing & optimization | ⏳ Pending |
| 8 | 3 weeks | Hardening & deployment | ⏳ Pending |

**Progress**: 62% complete (5 of 8 phases)

## Security

- **Transport Encryption**: AES-256-GCM
- **Key Exchange**: ECDH with forward secrecy
- **Integrity**: HMAC-SHA256 on all packets
- **Key Storage**: Secure Enclave (iOS) / KeyStore (Android)
- **No external dependencies**: Air-gapped compatible

## Performance Targets

- Small files (<10MB): <30 seconds
- Medium files (10-100MB): <5 minutes
- Large files (100MB-1GB): <30 minutes
- Packet success rate: >98%
- File integrity: 100%

## Documentation

- [Architecture Overview](docs/architecture.md) - Complete 7-layer protocol design
- [Optical Protocol Specification](docs/optical-protocol.md) - Detailed protocol spec
- [Phase 0 Complete](PHASE_0_COMPLETE.md) - Architecture & design complete
- [Phase 1 Complete](PHASE_1_COMPLETE.md) - Core engine implementation
- [Phase 1 Quick Reference](PHASE_1_QUICK_REFERENCE.md) - API guide for Phase 1
- [Phase 2 Complete](PHASE_2_FINAL_REPORT.md) - Comprehensive Phase 2 summary
  - [Week 1 Foundation](PHASE_2_STARTED.md) - GPU abstractions & camera framework
  - [Week 2 Platform Integration](PHASE_2_WEEK_2_PLATFORM.md) - iOS Metal, Android Vulkan, native cameras
  - [Week 3 Optimization](PHASE_2_WEEK_3_COMPLETE.md) - RANSAC, Lucas-Kanade, Kalman, thermal/battery
- [Session Summary](SESSION_SUMMARY.md) - Current session progress
- [Computer Vision Pipeline](docs/cv-pipeline.md) (Coming soon - Phase 3)
- [API Reference](docs/api-reference.md) (Coming soon - Phase 3)
- [Deployment Guide](docs/deployment.md) (Coming soon - Phase 8)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

Proprietary - X-Pixel Technologies

## Contact

For inquiries, visit x-pixel.dev (coming soon)
