import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { clientCtaRegistry } from "./client/client-cta-registry";
import { serverCtaRegistry } from "./server/server-cta-registry";

export const ctaRegistry = (context: { router: AppRouterInstance }) => ({
  ...clientCtaRegistry(context),
  ...serverCtaRegistry,
});

export type CtaRegistry = ReturnType<typeof ctaRegistry>;
export type CtaRegistryKeys = keyof CtaRegistry;