"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { env } from "#/env";
import { authClient } from "#/lib/auth-client";
import { Toaster } from "./ui/sonner";
import { TooltipProvider } from "./ui/tooltip";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL, {
	expectAuth: true
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </ConvexBetterAuthProvider>
  );
}
