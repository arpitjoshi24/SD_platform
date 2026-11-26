import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#090a0d] text-gray-100">
        <Sidebar />

        {/* pt-14 leaves room for the mobile top bar */}
        <main className="min-w-0 flex-1 pt-14 md:pt-0">{children}</main>
      </div>
    </AuthGuard>
  );
}