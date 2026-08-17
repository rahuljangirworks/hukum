import {
  ChunkReassembler,
  ChunkReassemblyError,
} from "@hukum/protocol/host-transport/chunking";
import { runChunkReassemblerConformanceSpec } from "@hukum/protocol/host-transport/__tests__/chunk-reassembler-conformance";

// Architecture §4 fix #1 (S3): the client and host once ran hand-mirrored
// chunker copies that silently diverged; the implementation now lives in
// `@hukum/protocol` and this runner proves the copy THIS repo resolves
// still satisfies the shared spec (the same runner exists host-side in
// `hukum-host/src/transport/remote/__tests__/chunker.test.ts`).
runChunkReassemblerConformanceSpec(
  () => new ChunkReassembler(undefined),
  ChunkReassemblyError,
);
