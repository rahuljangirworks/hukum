import type { LeftPanelSlotProps } from "@/components/epic-canvas/sidebar/left-panel-registry";
import { CircleHelp } from "lucide-react";
import { useHostClient } from "@/lib/host";
import { useHostQuery, useHostMutation } from "@/hooks/host/use-host-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

export function AgentQuestionsPanelBody(props: LeftPanelSlotProps) {
  const client = useHostClient();
  const params = useMemo(() => ({ epicId: props.epicId }), [props.epicId]);

  const query = useHostQuery({
    cacheKeyIdentity: undefined,
    client,
    method: "agentQuestions.list",
    params,
    options: {
      enabled: true,
      poll: true,
    },
  });

  const answerMutation = useHostMutation({
    client,
    method: "agentQuestions.answer",
    options: null,
    mapVariables: (v: { questionId: string; answer: string }) => v,
  });

  const dismissMutation = useHostMutation({
    client,
    method: "agentQuestions.dismiss",
    options: null,
    mapVariables: (v: { questionId: string }) => v,
  });

  const questions = query.data ?? [];

  if (questions.length === 0) {
    return (
      <div className="overflow-auto flex-1 h-full p-4 flex flex-col items-center justify-center text-muted-foreground gap-2">
        <CircleHelp className="h-8 w-8" />
        <span>No agent questions</span>
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1 h-full">
      <div className="flex flex-col gap-2 p-2">
        {questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-2 rounded-md border p-2 text-sm">
            <div className="font-semibold">{q.question}</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => answerMutation.mutateAsync({ questionId: q.id, answer: "Yes" })}>Answer</Button>
              <Button size="sm" variant="outline" onClick={() => dismissMutation.mutateAsync({ questionId: q.id })}>Dismiss</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentQuestionsLoadingPanelBody() {
  return (
    <div className="h-full p-4 flex flex-col items-center justify-center text-muted-foreground gap-2">
      <CircleHelp className="h-8 w-8 animate-pulse" />
      <span>Loading Questions...</span>
    </div>
  );
}
