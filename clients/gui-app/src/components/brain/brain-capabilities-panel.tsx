import { use, useMemo, useState } from "react";
import {
  AlertTriangle,
  FolderOpen,
  Link2,
  RefreshCw,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import {
  useBrainAdapters,
  useBrainAttachSkill,
  useBrainCreateAdapter,
  useBrainDetachSkill,
  useBrainLearnedImprovements,
  useBrainEvidence,
  useBrainMountInspections,
  useBrainMountRegistry,
  useBrainPromoteSkill,
  useBrainReconcileMounts,
  useBrainRegisterWorkspace,
  useBrainRollbackSkill,
  useBrainSkillCandidates,
  useBrainSkills,
} from "@/hooks/brain";
import { RunnerHostContext } from "@/providers/runner-host-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsPanelShell } from "@/components/settings/settings-panel-shell";
import {
  HostScopeConnecting,
  HostScopeGate,
} from "@/components/settings/host-scope/host-scope-gate";
import {
  useHostScope,
  type HostScope,
} from "@/components/settings/host-scope/use-host-scope";
import { HostRuntimeContext, useHostBinding } from "@/lib/host/runtime";

export function BrainCapabilitiesPanel() {
  const scope = useHostScope();
  const realBinding = useHostBinding();
  const scopedBinding = useMemo(() => {
    if (scope.status !== "ready" || scope.client === null) return null;
    if (realBinding === null) return null;
    return { ...realBinding, hostClient: scope.client };
  }, [realBinding, scope.client, scope.status]);

  const panel = <BrainCapabilitiesPanelInner scope={scope} />;
  if (scopedBinding === null) return panel;
  return (
    <HostRuntimeContext.Provider value={scopedBinding}>
      {panel}
    </HostRuntimeContext.Provider>
  );
}

function BrainCapabilitiesPanelInner(props: { readonly scope: HostScope }) {
  return (
    <SettingsPanelShell
      title="Brain capabilities"
      description="Keep skills and adapters canonical in this Brain, then expose selected packages to registered folders through owned symlinks."
      bodyClassName="overflow-visible border-0 bg-transparent"
    >
      <HostScopeGate
        scope={props.scope}
        skeleton={<HostScopeConnecting hostName={props.scope.hostLabel} />}
      >
        <BrainCapabilitiesContent
          canPickNatively={props.scope.host?.isLocalMachine === true}
        />
      </HostScopeGate>
    </SettingsPanelShell>
  );
}

// The content coordinates four independent Host resources; its branch count is UI state, not domain logic.
// eslint-disable-next-line complexity
function BrainCapabilitiesContent(props: {
  readonly canPickNatively: boolean;
}) {
  const runnerHost = use(RunnerHostContext);
  const adaptersQuery = useBrainAdapters();
  const registryQuery = useBrainMountRegistry();
  const inspectionsQuery = useBrainMountInspections();
  const skillsQuery = useBrainSkills();
  const registerWorkspace = useBrainRegisterWorkspace();
  const createAdapter = useBrainCreateAdapter();
  const attachSkill = useBrainAttachSkill();
  const reconcile = useBrainReconcileMounts();
  const detachSkill = useBrainDetachSkill();
  const promoteSkill = useBrainPromoteSkill();
  const rollbackSkill = useBrainRollbackSkill();
  const candidatesQuery = useBrainSkillCandidates();
  const improvementsQuery = useBrainLearnedImprovements();

  const adapters = useMemo(
    () => adaptersQuery.data?.adapters ?? [],
    [adaptersQuery.data],
  );
  const skills = useMemo(
    () => skillsQuery.data?.skills.filter((skill) => skill.enabled) ?? [],
    [skillsQuery.data],
  );
  const workspaces = useMemo(
    () => registryQuery.data?.registry.workspaces ?? [],
    [registryQuery.data],
  );
  const mounts = inspectionsQuery.data?.mounts ?? [];
  const candidates = useMemo(
    () => candidatesQuery.data?.candidates ?? [],
    [candidatesQuery.data],
  );
  const improvements = useMemo(
    () => improvementsQuery.data?.improvements ?? [],
    [improvementsQuery.data],
  );
  const [folderPath, setFolderPath] = useState("");
  const [adapterId, setAdapterId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [adapterName, setAdapterName] = useState("");
  const [adapterMountPath, setAdapterMountPath] = useState("");
  const [rollbackRevision, setRollbackRevision] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const selectedAdapterId = adapterId || adapters[0]?.id || "";
  const selectedSkillId = skillId || skills[0]?.name || "";
  const evidenceQuery = useBrainEvidence(selectedSkillId);

  const workspaceById = useMemo(
    () => new Map(workspaces.map((workspace) => [workspace.id, workspace])),
    [workspaces],
  );

  async function pickFolder() {
    if (
      !props.canPickNatively ||
      !runnerHost?.workspaceFolders.canPickNatively
    ) {
      return;
    }
    const paths = await runnerHost.workspaceFolders.pickFolders();
    if (paths[0]) setFolderPath(paths[0]);
  }

  async function registerFolder() {
    if (!folderPath.trim() || !selectedAdapterId) return;
    await registerWorkspace.mutateAsync({
      rootPath: folderPath.trim(),
      adapterId: selectedAdapterId,
    });
    setFolderPath("");
    setMessage(
      "Folder registered. Select a skill below to attach its canonical package.",
    );
  }

  async function attach(workspaceId: string) {
    if (!selectedSkillId) return;
    const result = await attachSkill.mutateAsync({
      workspaceId,
      skillId: selectedSkillId,
    });
    setMessage(
      result.status === "healthy"
        ? "Skill link is healthy."
        : (result.reason ?? "Link conflict detected."),
    );
  }

  async function addAdapter() {
    if (!adapterName.trim() || !adapterMountPath.trim()) return;
    const result = await createAdapter.mutateAsync({
      name: adapterName.trim(),
      mountPath: adapterMountPath.trim(),
    });
    setAdapterId(result.adapter.id);
    setAdapterName("");
    setAdapterMountPath("");
  }

  const confidence = evidenceQuery.data?.confidence ?? 0;
  const confidencePercent = Math.round(confidence * 100);

  return (
    <Tabs defaultValue="mounts" className="min-w-0">
      <TabsList>
        <TabsTrigger value="mounts">Folders & links</TabsTrigger>
        <TabsTrigger value="learning">Learning & policy</TabsTrigger>
      </TabsList>

      <TabsContent value="mounts" className="min-w-0 space-y-5 pt-3">
        <section className="space-y-3 rounded-lg border p-3">
          <div>
            <h3 className="text-sm font-medium">Register a folder</h3>
            <p className="text-xs text-muted-foreground">
              The Host canonicalizes this root before it can own any link below
              it.
            </p>
          </div>
          <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
            <div className="flex min-w-0 gap-2">
              <Input
                value={folderPath}
                onChange={(event) => setFolderPath(event.target.value)}
                placeholder="/home/user/project"
                aria-label="Folder path"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void pickFolder()}
                disabled={
                  !props.canPickNatively ||
                  !runnerHost?.workspaceFolders.canPickNatively
                }
                aria-label="Browse folder"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            <NativeSelect
              value={selectedAdapterId}
              onChange={setAdapterId}
              label="Adapter"
              options={adapters.map((adapter) => ({
                value: adapter.id,
                label: `${adapter.name} → ${adapter.mountPath}`,
              }))}
            />
            <Button
              onClick={() => void registerFolder()}
              disabled={
                !folderPath.trim() ||
                !selectedAdapterId ||
                registerWorkspace.isPending
              }
            >
              Register
            </Button>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border p-3">
          <div>
            <h3 className="text-sm font-medium">Custom folder convention</h3>
            <p className="text-xs text-muted-foreground">
              For example, Claude can use <code>.claude/skills</code>. Absolute
              and parent-traversal paths are rejected.
            </p>
          </div>
          <div className="grid min-w-0 gap-2 lg:grid-cols-[12rem_minmax(0,1fr)_auto]">
            <Input
              value={adapterName}
              onChange={(event) => setAdapterName(event.target.value)}
              placeholder="claude"
              aria-label="Adapter name"
            />
            <Input
              value={adapterMountPath}
              onChange={(event) => setAdapterMountPath(event.target.value)}
              placeholder=".claude/skills"
              aria-label="Adapter mount path"
            />
            <Button
              variant="outline"
              onClick={() => void addAdapter()}
              disabled={
                !adapterName.trim() ||
                !adapterMountPath.trim() ||
                createAdapter.isPending
              }
            >
              Add adapter
            </Button>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">Registered folders</h3>
              <p className="text-xs text-muted-foreground">
                Choose one enabled skill, then attach it to any registered
                folder.
              </p>
            </div>
            <NativeSelect
              value={selectedSkillId}
              onChange={setSkillId}
              label="Skill"
              options={skills.map((skill) => ({
                value: skill.name,
                label: skill.name,
              }))}
            />
          </div>
          {workspaces.length === 0 ? (
            <EmptyText>No folders registered yet.</EmptyText>
          ) : (
            workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {workspace.rootPath}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Adapter: {workspace.adapterId} · {workspace.skillIds.length}{" "}
                    skills
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void attach(workspace.id)}
                  disabled={!selectedSkillId || attachSkill.isPending}
                >
                  <Link2 className="mr-1.5 h-3.5 w-3.5" /> Attach
                </Button>
              </div>
            ))
          )}
        </section>

        <section className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">Owned links</h3>
              <p className="text-xs text-muted-foreground">
                Only missing owned links are auto-repaired. Drift and collisions
                stay untouched.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void reconcile.mutateAsync({ repairMissing: true })
              }
              disabled={reconcile.isPending}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Verify & repair
            </Button>
          </div>
          {mounts.length === 0 ? (
            <EmptyText>No managed links yet.</EmptyText>
          ) : (
            mounts.map((mount) => (
              <div
                key={mount.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {mount.skillId}
                    </p>
                    <StatusBadge status={mount.status} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {workspaceById.get(mount.workspaceId)?.rootPath ??
                      mount.linkPath}
                  </p>
                  {mount.reason ? (
                    <p className="text-xs text-amber-600">{mount.reason}</p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void detachSkill.mutateAsync({ mountId: mount.id })
                  }
                  disabled={
                    detachSkill.isPending ||
                    mount.status === "drifted" ||
                    mount.status === "conflict"
                  }
                >
                  <Unlink className="mr-1.5 h-3.5 w-3.5" /> Detach
                </Button>
              </div>
            ))
          )}
        </section>
        {message ? (
          <p className="text-xs text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </TabsContent>

      <TabsContent value="learning" className="min-w-0 space-y-5 pt-3">
        <section className="space-y-3 rounded-lg border p-3">
          <div>
            <h3 className="text-sm font-medium">Learned improvements</h3>
            <p className="text-xs text-muted-foreground">
              Only durable memory, user corrections, repeated failures, and
              procedure lifecycle changes appear here. Ordinary conversations
              and read-only activity stay hidden.
            </p>
          </div>
          {improvements.length === 0 ? (
            <EmptyText>No reusable improvements yet.</EmptyText>
          ) : (
            improvements.slice(0, 8).map((improvement) => (
              <div
                key={improvement.id}
                className="rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={improvement.status} />
                  <p className="truncate text-sm font-medium">
                    {improvement.title}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {improvement.summary}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  {improvement.sourceSessionCount === 1
                    ? "1 evidence session"
                    : `${improvement.sourceSessionCount} evidence sessions`}
                  {improvement.confidence === null
                    ? null
                    : ` · ${Math.round(improvement.confidence * 100)}% confidence`}
                </p>
              </div>
            ))
          )}
        </section>

        <section className="space-y-3 rounded-lg border p-3">
          <div>
            <h3 className="text-sm font-medium">Procedural candidates</h3>
            <p className="text-xs text-muted-foreground">
              Candidates retain their source sessions, confidence, lifecycle
              stage, and promoted revision.
            </p>
          </div>
          {candidates.length === 0 ? (
            <EmptyText>
              Two consistent outcomes will create the first candidate.
            </EmptyText>
          ) : (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {candidate.skillId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {candidate.sourceSessionIds.length} source sessions ·{" "}
                    {Math.round(candidate.confidence * 100)}% confidence
                  </p>
                </div>
                <StatusBadge status={candidate.stage} />
              </div>
            ))
          )}
        </section>

        <section className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">Evidence-gated evolution</h3>
              <p className="text-xs text-muted-foreground">
                One observation is retained, two consistent outcomes form a
                candidate, and three validated successes may auto-promote at
                ≥90% confidence.
              </p>
            </div>
            <NativeSelect
              value={selectedSkillId}
              onChange={setSkillId}
              label="Skill"
              options={skills.map((skill) => ({
                value: skill.name,
                label: skill.name,
              }))}
            />
          </div>
          {selectedSkillId ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Metric label="Confidence" value={`${confidencePercent}%`} />
              <Metric
                label="Stage"
                value={evidenceQuery.data?.stage ?? "observation"}
              />
              <Metric
                label="Validated"
                value={String(evidenceQuery.data?.summary.successes ?? 0)}
              />
              <Metric
                label="Failures"
                value={String(evidenceQuery.data?.summary.failures ?? 0)}
              />
              <Metric
                label="Corrections"
                value={String(evidenceQuery.data?.summary.userCorrections ?? 0)}
              />
            </div>
          ) : (
            <EmptyText>
              Create or enable a skill to inspect its evidence.
            </EmptyText>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() =>
                void promoteSkill.mutateAsync({
                  skillId: selectedSkillId,
                  approvedByUser: true,
                })
              }
              disabled={!selectedSkillId || promoteSkill.isPending}
            >
              Approve candidate promotion
            </Button>
            <Input
              className="max-w-xs"
              value={rollbackRevision}
              onChange={(event) => setRollbackRevision(event.target.value)}
              placeholder="Revision id for rollback"
              aria-label="Revision id"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void rollbackSkill.mutateAsync({
                  skillId: selectedSkillId,
                  revisionId: rollbackRevision.trim(),
                })
              }
              disabled={
                !selectedSkillId ||
                !rollbackRevision.trim() ||
                rollbackSkill.isPending
              }
            >
              Rollback
            </Button>
          </div>
        </section>

        <section className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="text-sm font-medium">Autonomy policy</h3>
          </div>
          <PolicyRow
            range="90–100%"
            action="Automatic only when validation, rollback, and category rules permit it"
          />
          <PolicyRow range="60–89%" action="Ask before acting or promoting" />
          <PolicyRow
            range="Below 60%"
            action="Gather evidence; do not perform consequential work"
          />
          <div className="flex gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Destructive, financial, secret, production/deployment, and public
            actions always ask, regardless of confidence.
          </div>
        </section>
      </TabsContent>
    </Tabs>
  );
}

function NativeSelect(props: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground">
      <span>{props.label}</span>
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      >
        <option value="">Select…</option>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  let variant: "secondary" | "outline" | "destructive" = "destructive";
  if (["healthy", "success", "validated", "promoted"].includes(status))
    variant = "secondary";
  else if (["missing", "observation", "candidate"].includes(status))
    variant = "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

function EmptyText({ children }: { children: string }) {
  return (
    <p className="rounded-md bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
      {children}
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2">
      <p className="text-[0.6875rem] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function PolicyRow({ range, action }: { range: string; action: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-2 text-xs">
      <span className="font-medium">{range}</span>
      <span className="text-muted-foreground">{action}</span>
    </div>
  );
}
