"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, Calendar, ArrowRight, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { EditProjectModal } from "../EditProjectModal";
import { DeleteProjectModal } from "../DeleteProjectModal";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    }
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading project...</div>;
  }

  if (!project?.data) {
    return <div className="p-8 text-center text-red-500">Project not found</div>;
  }

  const p = project.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold">{p.name}</h1>
          <p className="text-slate-500 mt-1">{p.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
          <Link href={`/projects/${p.id}/board`}>
            <Button size="sm">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Board <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{format(new Date(p.startDate), "MMMM d, yyyy")} - {format(new Date(p.endDate), "MMMM d, yyyy")}</p>
            <div className="mt-4 flex gap-2">
              <Badge variant={p.status === 'ACTIVE' ? 'success' : 'secondary'}>{p.status}</Badge>
              <Badge variant="outline" className="capitalize">Priority: {p.priority.toLowerCase()}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
              <Users className="h-4 w-4" /> Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {p.members?.map((m: any) => (
                <div key={m.userId} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 mr-3">
                    {m.user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.role.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <EditProjectModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        project={p}
      />

      <DeleteProjectModal 
        open={isDeleteModalOpen} 
        onOpenChange={setIsDeleteModalOpen} 
        onConfirm={() => deleteMutation.mutate()}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
