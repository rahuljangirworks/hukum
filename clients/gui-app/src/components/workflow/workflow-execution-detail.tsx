import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MutedAgentSpinner } from "@/components/ui/agent-spinning-dots";
import {
  useWorkflowGetExecution,
  useWorkflowListSteps,
  useWorkflowListApprovals,
  useWorkflowApprove,
  useWorkflowReject,
  useWorkflowCancelExecution,
} from "@/hooks/workflow/use-workflow";
import { formatDistanceToNow } from "date-fns";

export function WorkflowExecutionDetail({
  executionId,
}: {
  executionId: string;
}) {
  const getExec = useWorkflowGetExecution(executionId);
  const listSteps = useWorkflowListSteps(executionId);
  const listApprovals = useWorkflowListApprovals(executionId);

  const approve = useWorkflowApprove();
  const reject = useWorkflowReject();
  const cancel = useWorkflowCancelExecution();

  if (getExec.isLoading || listSteps.isLoading || listApprovals.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <MutedAgentSpinner />
        </CardContent>
      </Card>
    );
  }

  const exec = getExec.data;
  if (!exec) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Execution not found.
        </CardContent>
      </Card>
    );
  }

  const steps = listSteps.data?.steps ?? [];
  const approvals = listApprovals.data?.approvals ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Execution: {exec.id.substring(0, 8)}</CardTitle>
            <CardDescription>
              Started{" "}
              {formatDistanceToNow(new Date(exec.createdAt), {
                addSuffix: true,
              })}
            </CardDescription>
            <div className="text-muted-foreground mt-1 flex flex-col gap-1 text-xs">
              <span>
                <strong>Brain ID:</strong> {exec.brainId}
              </span>
              <span>
                <strong>Intent:</strong> {exec.intent}
              </span>
            </div>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Badge variant="outline">{exec.status}</Badge>
            {exec.status === "running" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancel.mutate({ id: exec.id })}
                disabled={cancel.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Steps</h3>
          {steps.length === 0 ? (
            <span className="text-muted-foreground text-sm">No steps.</span>
          ) : (
            <ul className="flex w-full flex-col gap-2">
              {steps.map((step) => {
                const approval = approvals.find((a) => a.stepId === step.id);
                return (
                  <li
                    key={step.id}
                    className="flex w-full flex-col gap-2 rounded-md border p-3"
                  >
                    <div className="flex flex-row items-center justify-between">
                      <span className="font-medium">{step.name}</span>
                      <div className="flex items-center gap-2">
                        {step.agentId ? (
                          <Badge variant="outline" className="text-xs">
                            🤖 Agent: {step.agentId.substring(0, 8)}
                          </Badge>
                        ) : null}
                        <Badge variant="secondary">{step.status}</Badge>
                      </div>
                    </div>
                    {approval && approval.status === "pending" && (
                      <div className="bg-muted flex flex-col gap-2 rounded-md p-2">
                        <span className="text-sm font-medium">
                          Approval Required
                        </span>
                        <div className="flex flex-row items-center gap-2">
                          <Button
                            size="sm"
                            disabled={approve.isPending || reject.isPending}
                            onClick={() =>
                              approve.mutate({
                                executionId,
                                approvalId: approval.id,
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={approve.isPending || reject.isPending}
                            onClick={() =>
                              reject.mutate({
                                executionId,
                                approvalId: approval.id,
                                reason: "Rejected by user",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
