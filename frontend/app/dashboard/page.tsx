"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { MetricCard, MetricCardSkeleton } from '@/components/MetricCard';
import { ProductivityChart, ProductivityChartSkeleton } from '@/components/ProductivityChart';
import { ActivityFeed, ActivityFeedSkeleton } from '@/components/ActivityFeed';
import { LayoutDashboard, CheckCircle2, Clock, AlertTriangle, Folder, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/metrics');
      return response.data;
    },
    enabled: !!user,
  });

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
          <p className="text-sm">Please try refreshing the page or check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-blue-500" />
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.firstName || 'User'}! Here's what's happening.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {isLoading || !data ? (
          Array(5).fill(0).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard 
              title="Total Projects" 
              value={data.totalProjects} 
              icon={<Folder className="h-5 w-5" />} 
            />
            <MetricCard 
              title="Active Projects" 
              value={data.activeProjects} 
              icon={<Activity className="h-5 w-5 text-blue-500" />} 
            />
            <MetricCard 
              title="Completed Tasks" 
              value={data.completedTasks} 
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} 
            />
            <MetricCard 
              title="Pending Tasks" 
              value={data.pendingTasks} 
              icon={<Clock className="h-5 w-5 text-amber-500" />} 
            />
            <MetricCard 
              title="Overdue Tasks" 
              value={data.overdueTasks} 
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />} 
              className={data.overdueTasks > 0 ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10" : ""}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading || !data ? <ProductivityChartSkeleton /> : <ProductivityChart data={data.productivityData} />}
        </div>
        <div>
          {isLoading || !data ? <ActivityFeedSkeleton /> : <ActivityFeed activities={data.recentActivities} />}
        </div>
      </div>
    </div>
  );
}
