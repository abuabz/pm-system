"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CheckSquare,
  BarChart,
  LogOut
} from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const navigation = [
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
  ];

  if (user?.role?.name !== "Developer") {
    navigation.unshift({ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
    navigation.push({ name: "Reports", href: "/reports", icon: BarChart });
  }

  if (user?.role?.name === "Super Admin" || user?.role?.name === "Admin") {
    navigation.splice(1, 0, { name: "Users", href: "/users", icon: Users });
  }

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
      logout();
      router.push("/login");
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">PM</span>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">System</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
        >
          <LogOut
            className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400"
            aria-hidden="true"
          />
          Logout
        </button>
      </div>
    </div>
  );
}
