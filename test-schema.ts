import { authenticatedUserSchema } from "./protocol/src/auth/_internal/schemas.ts";
import { authRecordRegistry } from "./protocol/src/auth/registry.ts";
import { getRecordSchema } from "./protocol/src/framework/index.ts";

const authenticatedUserResponseSchema = getRecordSchema(
  authRecordRegistry,
  "authenticated-user-response",
  "latest",
);

const json = {
  user: {
    id: "mock-user-id",
    name: "Hukum Admin",
    providerId: "mock-provider-id",
    providerHandle: "hukum-admin",
    providerType: "EMAIL",
    email: "hukum-admin@local",
    avatarUrl: null,
    activatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    privacyMode: false,
    isLearningEnabled: false
  },
  userSubscription: {
    id: "sub-1",
    userID: "mock-user-id",
    orgID: null,
    teamID: null,
    customerId: "cust-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionExpiry: null,
    trialEndsAt: null,
    subscriptionStatus: "PRO",
    hasPaymentMethod: false,
    isInTrial: false,
    rechargeRateSeconds: 0
  },
  payAsYouGoUsage: {
    allowPayAsYouGo: false
  },
  teamSubscriptions: []
};

const result = authenticatedUserResponseSchema.safeParse(json);
if (!result.success) {
  console.log(JSON.stringify(result.error.issues, null, 2));
} else {
  console.log("Success!");
}
