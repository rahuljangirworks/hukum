# Voice Dictation Integration — Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  RENDERER (Electron / Browser)                          │
│                                                         │
│  ┌─────────────┐    ┌──────────────────┐               │
│  │ Mic Button  │───▶│ use-voice-       │               │
│  │ (Composer)  │    │ dictation.ts     │               │
│  └─────────────┘    └───────┬──────────┘               │
│                             │ PCM16 frames              │
│                     ┌───────▼──────────┐               │
│                     │ SpeechStream     │               │
│                     │ Client (WS)      │               │
│                     └───────┬──────────┘               │
└─────────────────────────────┼───────────────────────────┘
                              │ WebSocket: speech.dictate
┌─────────────────────────────┼───────────────────────────┐
│  HOST (hukum-host)          │                           │
│                     ┌───────▼──────────┐               │
│                     │ Stream Dispatch  │               │
│                     │ (speech.dictate) │               │
│                     └───────┬──────────┘               │
│                             │                           │
│                     ┌───────▼──────────┐               │
│                     │ SttService       │               │
│                     │ (orchestrator)   │               │
│                     └───┬─────────┬────┘               │
│                         │         │                     │
│              ┌──────────▼──┐  ┌───▼────────────┐       │
│              │ STT Worker  │  │ OpenAI Cloud   │       │
│              │ (sherpa-    │  │ Transcription  │       │
│              │  onnx)      │  │ Client         │       │
│              └─────────────┘  └────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Model Manager                                    │   │
│  │ - Download/verify models                         │   │
│  │ - speech.getModelStatus RPC                      │   │
│  │ - speech.ensureModel RPC                         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Stream Handler: `speech.dictate`

**Location:** `hukum-host/src/stream/subscriptions/speech-dictate.ts`

**Protocol:**
- Client → Host frames: `{ type: "audio", samples: Float32Array, sampleRate: number }`
- Host → Client frames:
  - `{ type: "ready" }` — Worker initialized, accepting audio
  - `{ type: "partial", text: string }` — Interim transcript (streaming models)
  - `{ type: "final", text: string }` — Committed transcript segment
  - `{ type: "flushed" }` — All audio processed after stop
  - `{ type: "error", message: string }` — Error occurred

**Lifecycle:**
1. Client opens stream with `{ modelId: string }`
2. Host initializes SttService, emits `ready`
3. Client streams audio frames
4. Host emits partial/final transcripts
5. Client closes stream → host flushes and emits `flushed`

### 2. STT Service (Orchestrator)

**Location:** `hukum-host/src/services/stt-service.ts`

**Ported from:** `/tmp/orca/src/main/speech/stt-service.ts`

**Key adaptations for hukum-host:**
- Remove Electron `app` dependency (use hukum-host's own data dir)
- Worker path resolution uses hukum-host's build output
- Owner tracking maps to WebSocket session IDs
- Event sink maps to stream response frames

### 3. STT Worker Thread

**Location:** `hukum-host/src/services/stt-worker.ts`

**Ported from:** `/tmp/orca/src/main/speech/stt-worker.ts`

**Message protocol:**
- `init` — Load sherpa-onnx, create recognizer for model type
- `feed` — Accept audio samples, emit partial/final
- `stop` — Flush remaining audio, emit stopped
- `teardown` — Release resources, exit

**Model type handling:**
- `transducer` (streaming): createOnlineRecognizer → acceptWaveformOnline → decodeOnlineStream
- `paraformer` (streaming): same as transducer with paraformer config
- `whisper` (offline): createOfflineRecognizer → bounded-chunk decode
- `nemo-ctc` (offline): same as whisper with nemo config
- `senseVoice` (offline): same pattern with language auto-detect

### 4. Model Catalog

**Location:** `hukum-host/src/services/speech-model-catalog.ts`

**Initial models (phase 1):**
- `zipformer-streaming-en-20m` — English streaming (lightweight, good default)
- `parakeet-tdt-0.6b-v2-int8` — English offline (high accuracy)
- `whisper-tiny` — Multilingual offline (broadest coverage)

**Phase 2:**
- Full orca catalog (12 models)
- OpenAI cloud transcription

### 5. Model Manager

**Location:** `hukum-host/src/services/speech-model-manager.ts`

**Ported from:** `/tmp/orca/src/main/speech/model-manager.ts`

**Responsibilities:**
- Track download state per model
- Download with resume, retry, SHA-256 verification
- Report progress via `speech.getModelStatus` RPC
- Store models at `<hostDataDir>/models/stt/<modelId>/`

### 6. Audio Utilities

**Location:** `hukum-host/src/services/stt-audio-resample.ts`

Linear interpolation resampling from arbitrary device sample rates to model's expected 16kHz.

**Location:** `hukum-host/src/services/stt-offline-audio-chunker.ts`

Bounded-memory chunking for offline models (prevents OOM on long dictations).

## Dependencies to Add (hukum-host)

```json
{
  "sherpa-onnx-linux-x64": "^1.x",
  "sherpa-onnx-darwin-arm64": "^1.x" (optional, for macOS dev)
}
```

## Existing Client Code (no changes needed)

The hukum-client already has the full renderer pipeline:
- Mic capture via Web Audio API → PCM16 mono
- `SpeechStreamClient` WebSocket transport
- `use-dictation-availability` polls `speech.getModelStatus`
- `use-voice-dictation` streams audio + receives transcripts
- `use-composer-dictation` orchestrates everything + inserts text

The client already works — it just needs the host to respond to:
1. `speech.getModelStatus` RPC → return model readiness
2. `speech.ensureModel` RPC → trigger download
3. `speech.dictate` stream → accept audio, return transcripts

## Migration Notes from Orca

| Orca | Hukum-Host |
|------|-----------|
| `app.isPackaged` | Not applicable (Node.js server) |
| `process.resourcesPath` | `getHostDataDir()` |
| Electron IPC for audio | WebSocket stream (`speech.dictate`) |
| `readOpenAiSpeechApiKey` | Read from hukum-host config/env |
| Worker at `out/main/stt-worker.js` | Worker at `dist/stt-worker.js` |
| `require.resolve('sherpa-onnx-...')` | Same pattern, from `node_modules` |
