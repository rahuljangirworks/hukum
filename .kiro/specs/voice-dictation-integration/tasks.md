# Voice Dictation Integration — Tasks

## Phase 1: Core STT Worker (Host)

### Task 1: Add sherpa-onnx dependency
- [ ] Add `sherpa-onnx-linux-x64` to hukum-host `package.json`
- [ ] Run `bun install`
- [ ] Verify native addon loads: `require('sherpa-onnx-linux-x64')`

### Task 2: Port audio utilities
- [ ] Create `hukum-host/src/services/stt-audio-resample.ts` (from `/tmp/orca/src/main/speech/stt-audio-resample.ts`)
- [ ] Create `hukum-host/src/services/stt-offline-audio-chunker.ts` (from `/tmp/orca/src/main/speech/stt-offline-audio-chunker.ts`)

### Task 3: Port STT worker thread
- [ ] Create `hukum-host/src/services/stt-worker.ts` (from `/tmp/orca/src/main/speech/stt-worker.ts`)
- [ ] Adapt worker path resolution (remove Electron-specific paths)
- [ ] Adapt sherpa module path resolution for Node.js server context

### Task 4: Port model catalog
- [ ] Create `hukum-host/src/services/speech-model-catalog.ts` (from `/tmp/orca/src/main/speech/model-catalog.ts`)
- [ ] Create `hukum-host/src/services/speech-model-download-catalog.ts` (download URLs + SHA256)
- [ ] Start with 3 models: zipformer-streaming-en-20m, parakeet-tdt-0.6b-v2-int8, whisper-tiny

### Task 5: Port model manager
- [ ] Create `hukum-host/src/services/speech-model-manager.ts` (from `/tmp/orca/src/main/speech/model-manager.ts`)
- [ ] Adapt storage paths to use `getHostDataDir()/models/stt/`
- [ ] Implement download with resume, SHA-256 verification
- [ ] Wire up to existing `speech.getModelStatus` and `speech.ensureModel` RPCs

### Task 6: Port STT service orchestrator
- [ ] Create `hukum-host/src/services/stt-service.ts` (from `/tmp/orca/src/main/speech/stt-service.ts`)
- [ ] Remove Electron dependencies
- [ ] Adapt owner tracking for WebSocket session IDs
- [ ] Wire event sink to stream response frames

## Phase 2: Stream Handler (Host)

### Task 7: Implement `speech.dictate` stream
- [ ] Create `hukum-host/src/stream/subscriptions/speech-dictate.ts`
- [ ] Register in stream dispatcher (`hukum-host/src/stream/dispatch.ts`)
- [ ] Handle incoming audio frames → feed to SttService
- [ ] Forward SttService events (ready/partial/final/stopped/error) to client
- [ ] Handle stream close → stopDictation + cleanup

### Task 8: Update existing speech RPCs
- [ ] Update `speech.getModelStatus` to use new ModelManager (real model state)
- [ ] Update `speech.ensureModel` to trigger actual model download
- [ ] Return proper status: not-downloaded → downloading → ready

## Phase 3: OpenAI Cloud Fallback (Host)

### Task 9: Port OpenAI transcription client
- [ ] Create `hukum-host/src/services/openai-transcription-client.ts` (from `/tmp/orca/src/main/speech/openai-transcription-client.ts`)
- [ ] Read API key from hukum-host config/env
- [ ] Accumulate audio → encode WAV → POST to OpenAI endpoint

### Task 10: Add cloud models to catalog
- [ ] Add `openai-gpt-4o-mini-transcribe` and `openai-gpt-4o-transcribe` to catalog
- [ ] Wire SttService to use OpenAiTranscriptionSession for cloud models

## Phase 4: Testing & Polish

### Task 11: End-to-end test
- [ ] Start hukum-host with STT enabled
- [ ] Download a model via the GUI (Settings or on first mic click)
- [ ] Click mic in composer → speak → verify transcript appears
- [ ] Test stop → verify final flush

### Task 12: Settings UI
- [ ] Verify model selection shows in Settings panel
- [ ] Verify download progress indicator works
- [ ] Add model switching support

## File Reference (orca sources to port)

| Orca Source | Hukum-Host Target |
|-------------|-------------------|
| `src/main/speech/stt-worker.ts` | `src/services/stt-worker.ts` |
| `src/main/speech/stt-service.ts` | `src/services/stt-service.ts` |
| `src/main/speech/model-catalog.ts` | `src/services/speech-model-catalog.ts` |
| `src/main/speech/model-manager.ts` | `src/services/speech-model-manager.ts` |
| `src/main/speech/model-download-catalog.ts` | `src/services/speech-model-download-catalog.ts` |
| `src/main/speech/stt-audio-resample.ts` | `src/services/stt-audio-resample.ts` |
| `src/main/speech/stt-offline-audio-chunker.ts` | `src/services/stt-offline-audio-chunker.ts` |
| `src/main/speech/stt-worker-model-config.ts` | `src/services/stt-worker-model-config.ts` |
| `src/main/speech/openai-transcription-client.ts` | `src/services/openai-transcription-client.ts` |
| `src/shared/speech-types.ts` | Already in protocol (`@hukum/protocol/host/speech/schemas`) |
