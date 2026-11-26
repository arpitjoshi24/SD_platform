import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AuthGuard requiredRole="user">{children}</AuthGuard>;
}