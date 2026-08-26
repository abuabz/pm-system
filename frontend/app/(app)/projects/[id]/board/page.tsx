"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { use } from "react";
import KanbanBoard from "./KanbanBoard";

export default function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.data;
    }
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks?projectId=${projectId}&limit=100`);
      return res.data;
    }
  });

  if (projectLoading || tasksLoading) {
    return <div className="p-8 text-center text-slate-500">Loading board...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{project?.data?.name} - Board</h1>
      </div>
      <div className="flex-1 overflow-x-auto">
        <KanbanBoard projectId={projectId} initialTasks={tasks?.data || []} />
      </div>
    </div>
  );
}
