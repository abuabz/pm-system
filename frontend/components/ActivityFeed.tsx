import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
        <p className="text-sm text-slate-500">No recent activities found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4">
            <div className="relative mt-1">
              <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20"></div>
              {/* Line connector */}
              <div className="absolute left-1 top-4 -bottom-6 w-px bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="flex flex-col flex-1">
              <p className="text-sm text-slate-900 dark:text-white">
                <span className="font-medium">
                  {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'}
                </span>{' '}
                {activity.action.toLowerCase()}{' '}
                <span className="font-medium">{activity.entityType}</span> ({activity.entityId.slice(0,8)})
              </p>
              <span className="text-xs text-slate-500 mt-1">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse">
      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 w-3 bg-slate-200 dark:bg-slate-700 rounded-full mt-1"></div>
            <div className="flex flex-col flex-1 gap-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
