import type { LeftPanelSlotProps } from "@/components/epic-canvas/sidebar/left-panel-registry";
import { Activity } from "lucide-react";
import { useHostClient } from "@/lib/host";
import { useHostQuery, useHostMutation } from "@/hooks/host/use-host-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

export function BackgroundJobsPanelBody(props: LeftPanelSlotProps) {
  const client = useHostClient();
  const params = useMemo(() => ({ epicId: props.epicId }), [props.epicId]);

  const query = useHostQuery({
    cacheKeyIdentity: undefined,
    client,
    method: "backgroundJobs.list",
    params,
    options: {
      enabled: true,
      refetchInterval: 2000,
    },
  });

  const cancelMutation = useHostMutation({
    client,
    method: "backgroundJobs.cancel",
  });

  const jobs = query.data ?? [];

  if (jobs.length === 0) {
    return (
      <div className="overflow-auto flex-1 h-full p-4 flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Activity className="h-8 w-8" />
        <span>No background jobs</span>
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1 h-full">
      <div className="flex flex-col gap-2 p-2">
        {jobs.map((job) => (
          <div key={job.jobId} className="flex flex-col gap-1 rounded-md border p-2 text-sm">
            <div className="font-mono text-xs">{job.command}</div>
            <div className="flex items-center justify-between">
              <span className="capitalize">{job.state}</span>
              <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutateAsync({ jobId: job.jobId })}>Cancel</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BackgroundJobsLoadingPanelBody(props: LeftPanelSlotProps) {
  return (
    <div className="h-full p-4 flex flex-col items-center justify-center text-muted-foreground gap-2">
      <Activity className="h-8 w-8 animate-pulse" />
      <span>Loading Background Jobs...</span>
    </div>
  );
}
