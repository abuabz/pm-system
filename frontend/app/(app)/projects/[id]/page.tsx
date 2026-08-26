"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { format } from "date-fns";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

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
          <Link href={`/projects/${p.id}/board`}>
            <Button>
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
                <div key={m.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                    {m.user.firstName[0]}{m.user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.user.firstName} {m.user.lastName}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.role.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
