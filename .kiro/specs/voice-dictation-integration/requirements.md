# Voice Dictation Integration — Requirements

## Overview
Integrate voice-to-text dictation into the Hukum platform, allowing users to speak into their microphone and have the transcribed text inserted into the chat composer. Based on the orca voice module architecture using sherpa-onnx for local STT and OpenAI cloud transcription as a fallback.

## Reference Implementation
Source: `/tmp/orca/src/main/speech/` (orca repo)

## Functional Requirements

### FR-1: Microphone Capture (Client — Renderer)
- User clicks the mic button in the composer toolbar or uses a hotkey
- Browser captures audio via `navigator.mediaDevices.getUserMedia()`
- Audio is processed through Web Audio API (ScriptProcessorNode or AudioWorklet)
- PCM16 mono samples at 16kHz are streamed to the host via WebSocket (`speech.dictate` stream)
- Visual feedback: mic icon shows recording state (idle → starting → listening → stopping)

### FR-2: Speech-to-Text Processing (Host — hukum-host)
- Host receives PCM audio frames over the `speech.dictate` WebSocket stream
- Host runs STT inference using sherpa-onnx native addon in a Worker thread
- Supports multiple model architectures: transducer (streaming), paraformer (streaming), whisper (offline), nemo-ctc (offline), senseVoice (offline)
- Returns partial transcripts (streaming models) and final transcripts to the client
- Warm worker reuse: keeps model loaded for 1 hour after last use

### FR-3: Cloud Transcription Fallback (Host)
- When user selects an OpenAI model (gpt-4o-transcribe / gpt-4o-mini-transcribe)
- Audio is accumulated and sent as WAV to OpenAI `/v1/audio/transcriptions` endpoint
- Requires user-configured OpenAI API key (encrypted storage)

### FR-4: Model Management (Host)
- Host provides RPCs: `speech.getModelStatus`, `speech.ensureModel`
- Models are downloaded on-demand with progress reporting
- SHA-256 verification of downloaded model files
- Support for user-supplied custom models via directory path
- Model catalog includes 12+ models (Parakeet TDT, Zipformer, Whisper, SenseVoice, OpenAI cloud)

### FR-5: Dictation Lifecycle
- `startDictation(modelId, owner)` — Initialize worker, load model, begin accepting audio
- `feedAudio(samples, sampleRate, owner)` — Feed PCM samples to recognizer
- `stopDictation(owner)` — Flush remaining audio, emit final transcript, release ownership
- Owner tracking: prevents multiple consumers from conflicting
- Graceful timeout: 60s for start, 60s for stop

### FR-6: Transcript Insertion (Client)
- Partial transcripts update a preview in the composer (streaming models)
- Final transcripts are appended/inserted into the composer at the cursor position
- Multiple final segments per session (offline models decode in chunks)

## Non-Functional Requirements

### NFR-1: Performance
- STT worker runs in a separate Node.js Worker thread (no main thread blocking)
- Offline models decode in bounded chunks (prevents >2GB tensor allocations)
- Audio resampling handles device sample rate mismatches
- Idle worker teardown after 1 hour to free memory

### NFR-2: Platform Support
- sherpa-onnx native addon per platform: `sherpa-onnx-linux-x64`, `sherpa-onnx-darwin-arm64`, `sherpa-onnx-win-x64`
- Model files stored in host data directory (`<hostDataDir>/models/stt/<modelId>/`)

### NFR-3: Error Handling
- Worker crash recovery: cleanup state, report error to client
- Network failures during model download: resume support
- Dictation canceled while starting: graceful abort

## Existing Client Infrastructure (already built)
The hukum-client already has the renderer-side voice pipeline:
- `clients/gui-app/src/hooks/composer/use-voice-dictation.ts` — Mic capture + PCM streaming
- `clients/gui-app/src/hooks/composer/use-dictation-availability.ts` — Model status polling
- `clients/gui-app/src/hooks/composer/use-composer-dictation.ts` — Orchestrator
- `clients/shared/host-transport/speech-stream-client.ts` — WebSocket transport for `speech.dictate`

## What Needs to Be Built (Host — hukum-host)
1. `speech.dictate` WebSocket stream handler
2. STT Worker thread (port from orca's `stt-worker.ts`)
3. STT Service orchestrator (port from orca's `stt-service.ts`)
4. Model catalog + download manager (port from orca)
5. Audio resampling utility
6. Offline audio chunker for bounded decoding
7. Update `speech-model-service.ts` to use real model management
8. Install `sherpa-onnx-linux-x64` (or platform-appropriate) npm package
