
// user-provider.tsx
"use client";

import type React from "react";
import { AuthProvider } from "./auth-provider";

// ✅ Correctly defines and exports the wrapper component
export function UserProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

