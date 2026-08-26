"use client";

import { useTheme } from "next-themes";
import { Bell, Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/use-auth-store";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications?limit=5');
      return res.data;
    },
    enabled: !!user,
  });

  const unreadCount = notifications?.data?.filter((n: Record<string, unknown>) => !n.read).length || 0;

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-1"></div>
      <div className="flex items-center gap-4">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
              </span>
            )}
            <span className="sr-only">View notifications</span>
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-900 dark:ring-slate-800">
              <div className="px-4 py-2 text-sm font-semibold border-b border-slate-100 dark:border-slate-800">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications?.data?.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">No notifications</div>
                ) : (
                  notifications?.data?.map((n: Record<string, unknown>) => (
                    <div key={n.id} className={`px-4 py-3 text-sm border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{n.title}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-800">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.firstName} {user?.lastName}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.toLowerCase()}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
