"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuthStore } from "@/store/use-auth-store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  useEffect(() => {
    // Basic protection (can be improved with middleware later)
    if (mounted && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/login');
    }
  }, [user, router, pathname, mounted]);

  if (!mounted || !user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-6">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
