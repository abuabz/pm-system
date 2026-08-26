"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, Plus, Calendar } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CreateProjectModal } from "./CreateProjectModal";
import { format } from "date-fns";

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page],
    queryFn: async () => {
      const res = await apiClient.get(`/projects?page=${page}&limit=12`);
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Folder className="h-6 w-6 text-blue-500" />
          Projects
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="flex flex-col h-[200px]">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          ))
        ) : data?.data?.map((p: any) => (
          <Card key={p.id} className="flex flex-col hover:border-blue-500 transition-colors cursor-pointer group">
            <Link href={`/projects/${p.id}`} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors truncate">
                    {p.name}
                  </CardTitle>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {p.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(p.startDate), "MMM d, yyyy")} - {format(new Date(p.endDate), "MMM d, yyyy")}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                  {p.description}
                </p>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between items-center text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {p.members?.slice(0, 3).map((m: any, i: number) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
                      {m.user.firstName[0]}{m.user.lastName[0]}
                    </div>
                  ))}
                  {p.members?.length > 3 && (
                    <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium">
                      +{p.members.length - 3}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="capitalize">{p.priority.toLowerCase()}</Badge>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>

      {data?.data?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          <Folder className="h-12 w-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-slate-500 mb-6 text-center max-w-sm">Create your first project to start organizing tasks and collaborating with your team.</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
      )}

      <CreateProjectModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
}
