/**
 * The signed-in user's Hukum subscription + credits, shown under the Hukum
 * provider. A global account-context selector (Personal / each Team) drives
 * which subscription is rendered. Data comes from `useAuthUser` (TanStack
 * Query) - never the auth store, which keeps only its narrow projections.
 *
 * This card owns its query wiring (`useAuthUser`, `useRefreshCreditsOnHukumTurn`,
 * and - inside the shared `RateLimitView` - `useHostRateLimitUsageQuery` +
 * `useRefreshRateLimitUsageOnHukumTurn`) and renders through the shared,
 * host/query-free views in `hukum-subscription-views.tsx`, so it and the
 * header popover's Hukum tab can never disagree.
 */
import { ExternalLink } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { AuthenticatedUser } from "@hukum/protocol/auth";
import type { AccountContext } from "@hukum/protocol/common/schemas";
import { MutedAgentSpinner } from "@/components/ui/agent-spinning-dots";
import { ReportIssueAction } from "@/components/report-issue/report-issue-action";
import { createReportIssueContext } from "@/lib/report-issue-context";
import { RefreshIconButton } from "@/components/refresh-icon-button";
import {
  HukumAccountSelect,
  HukumSubscriptionView,
} from "@/components/settings/panels/hukum-subscription-views";
import { resolveManageSubscriptionUrl } from "@/lib/auth/manage-subscription-url";
import { Analytics, AnalyticsEvent } from "@/lib/analytics";
import {
  accountContextValue,
  parseAccountContextValue,
  selectSubscription,
  type HukumSubscription,
} from "@/lib/auth/hukum-subscription-content";
import { useAuthUser } from "@/hooks/auth/use-auth-user-query";
import { useRefreshCreditsOnHukumTurn } from "@/hooks/auth/use-refresh-credits-on-hukum-turn";
import { useRunnerHost } from "@/providers/use-runner-host";
import {
  resolveAccountContext,
  useAccountContextStore,
} from "@/stores/auth/account-context-store";

export function HukumSubscriptionSection() {
  const query = useAuthUser();
  // Keep the balance live: a Hukum turn finishing while this card is open
  // refetches credits. Only mounted here, so it costs nothing elsewhere.
  useRefreshCreditsOnHukumTurn();
  const runnerHost = useRunnerHost();
  const stored = useAccountContextStore((s) => s.accountContext);
  const setAccountContext = useAccountContextStore((s) => s.setAccountContext);

  const user = query.data ?? null;
  const teams = user?.teamSubscriptions ?? [];
  const teamIds = new Set(teams.map((t) => t.team.id));
  const resolved = resolveAccountContext(stored, teamIds);
  const subscription = selectSubscription(user, resolved, teams);

  const manageUrl = resolveManageSubscriptionUrl(runnerHost.authnBaseUrl);

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-ui-sm font-medium text-foreground">
          Subscription
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              void runnerHost.openExternalLink(manageUrl);
              Analytics.getInstance().track(
                AnalyticsEvent.SubscriptionManagementOpened,
                { source: "direct_ui" },
              );
            }}
            className="inline-flex w-fit items-center gap-1.5 rounded px-1 text-ui-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            Manage subscription
            <ExternalLink className="size-3" />
          </button>
          <RefreshIconButton
            onRefresh={async () => {
              const result = await query.refetch();
              if (result.status === "success") {
                Analytics.getInstance().track(
                  AnalyticsEvent.SubscriptionRefreshed,
                  { source: "direct_ui" },
                );
              }
            }}
            label="Refresh subscription"
            refreshing={query.isFetching}
          />
        </div>
      </div>

      <HukumAccountSelect
        teams={teams}
        value={accountContextValue(resolved)}
        onValueChange={(value) =>
          setAccountContext(parseAccountContextValue(value))
        }
      />

      <SubscriptionBody
        query={query}
        subscription={subscription}
        accountContext={resolved}
      />
    </div>
  );
}

function SubscriptionBody({
  query,
  subscription,
  accountContext,
}: {
  readonly query: UseQueryResult<AuthenticatedUser | null>;
  readonly subscription: HukumSubscription | null;
  readonly accountContext: AccountContext;
}) {
  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 text-ui-sm text-muted-foreground">
        <MutedAgentSpinner /> Loading subscription
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="text-ui-sm text-destructive">
        Couldn't load your subscription. Try refreshing.
        <ReportIssueAction
          context={createReportIssueContext({
            title: "Couldn't load your subscription",
            message: null,
            code: null,
            source: "Subscription",
          })}
          presentation="link"
          className="ml-1 h-auto p-0 text-current"
        />
      </div>
    );
  }
  if (subscription === null) {
    return (
      <div className="text-ui-sm text-muted-foreground">
        No subscription found for this account.
      </div>
    );
  }
  return (
    <HukumSubscriptionView
      subscription={subscription}
      accountContext={accountContext}
    />
  );
}
