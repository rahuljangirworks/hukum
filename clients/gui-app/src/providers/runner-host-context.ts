import { createContext } from "react";
import type { IRunnerHost } from "@hukum-clients/shared/platform/runner-host";

export const RunnerHostContext = createContext<IRunnerHost | null>(null);
