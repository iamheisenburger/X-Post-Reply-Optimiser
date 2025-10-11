"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Validate environment variable
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL is not set. Please check your environment variables in Vercel."
  );
}

const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}



