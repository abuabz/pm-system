'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ReportsPage() {
  const { data: projectProgress, isLoading: loadingProgress, error: errorProgress } = useQuery({
    queryKey: ['reports-project-progress'],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/project-progress');
      return data;
    },
  });

  const { data: userProductivity, isLoading: loadingProductivity } = useQuery({
    queryKey: ['reports-user-productivity'],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/user-productivity');
      return data;
    },
  });

  const { data: overdueTasks, isLoading: loadingOverdue } = useQuery({
    queryKey: ['reports-overdue-tasks'],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/overdue-tasks');
      return data;
    },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Project Progress Chart */}
        <div className="col-span-1 border rounded-lg shadow-sm bg-card text-card-foreground">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Project Completion Progress</h3>
          </div>
          <div className="p-6 pt-0">
            {loadingProgress ? (
              <div className="h-[300px] w-full bg-muted animate-pulse rounded-md" />
            ) : errorProgress ? (
              <div className="h-[300px] flex items-center justify-center text-red-500">Failed to load data</div>
            ) : projectProgress?.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No projects found.</div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val: number) => `${val}%`} />
                    <RechartsTooltip formatter={(val: number) => `${val}%`} />
                    <Legend />
                    <Bar dataKey="completionPercentage" name="Completion %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* User Productivity Table */}
        <div className="col-span-1 border rounded-lg shadow-sm bg-card text-card-foreground">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">User Productivity Metrics</h3>
          </div>
          <div className="p-6 pt-0">
            {loadingProductivity ? (
              <div className="space-y-2">
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-md">User</th>
                      <th className="px-4 py-3">Completed Tasks</th>
                      <th className="px-4 py-3 text-right">Est. Hours</th>
                      <th className="px-4 py-3 text-right rounded-tr-md">Actual Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userProductivity?.map((user: Record<string, unknown>, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3">{user.tasksCompleted}</td>
                        <td className="px-4 py-3 text-right">{user.totalEstimated}</td>
                        <td className="px-4 py-3 text-right">{user.totalActual}</td>
                      </tr>
                    ))}
                    {!userProductivity?.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No productivity data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Tasks List */}
      <div className="border rounded-lg shadow-sm bg-card text-card-foreground">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight text-red-500">Overdue Tasks Action Item</h3>
        </div>
        <div className="p-6 pt-0">
          {loadingOverdue ? (
            <div className="space-y-2">
              <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
              <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-md">Task</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right rounded-tr-md">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueTasks?.map((task: Record<string, unknown>) => (
                    <tr key={task.id} className="border-b border-red-100 dark:border-red-900 last:border-0">
                      <td className="px-4 py-3 font-medium">{task.title}</td>
                      <td className="px-4 py-3">{task.project?.name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full text-xs font-semibold">
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!overdueTasks?.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Great job! No overdue tasks.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
