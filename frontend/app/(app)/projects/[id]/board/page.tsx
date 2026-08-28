"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { use, useState } from "react";
import KanbanBoard from "./KanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

export default function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project?.data?.name} - Board</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </div>
      <div className="flex-1 overflow-x-auto">
        <KanbanBoard projectId={projectId} initialTasks={tasks?.data?.data || []} />
      </div>
      
      <CreateTaskModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
        projectId={projectId} 
        projectName={project?.data?.name || 'Project'}
        projectMembers={project?.data?.members || []} 
      />
    </div>
  );
}
