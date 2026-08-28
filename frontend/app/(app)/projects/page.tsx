"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, Plus, Calendar, Search } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CreateProjectModal } from "./CreateProjectModal";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, searchQuery, statusFilter, priorityFilter],
    queryFn: async () => {
      let url = `/projects?page=${page}&limit=12`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      if (priorityFilter !== "ALL") url += `&priority=${priorityFilter}`;
      
      const res = await apiClient.get(url);
      return res.data;
    }
  });

  const projectsList = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setPage(1);
  };

  const getPageNumbers = () => {
    if (!meta) return [];
    const maxPages = meta.lastPage;
    let pages = [];
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Folder className="h-6 w-6 text-blue-500" />
          Projects
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            type="text" 
            placeholder="Search by project name..." 
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full sm:w-[150px]">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>

          <Select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="w-full sm:w-[150px]">
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </div>
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
        ) : projectsList.map((p: any) => (
          <Card key={p.id} className="flex flex-col hover:border-blue-500 transition-colors cursor-pointer group bg-white dark:bg-slate-950 shadow-sm border-slate-200 dark:border-slate-800">
            <Link href={`/projects/${p.id}`} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors truncate">
                    {p.name}
                  </CardTitle>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : (p.status === 'ON_HOLD' ? 'warning' : 'secondary')}>
                    {p.status.replace('_', ' ')}
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
                    <div key={m.userId || i} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center -ml-2 first:ml-0 text-xs font-medium" title={m.user?.name}>
                      {m.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                  ))}
                  {p.members?.length > 3 && (
                    <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium">
                      +{p.members.length - 3}
                    </div>
                  )}
                  {(!p.members || p.members.length === 0) && (
                     <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-400">
                       0
                     </div>
                  )}
                </div>
                <Badge variant="outline" className={`capitalize ${p.priority === 'URGENT' ? 'text-red-500 border-red-200' : p.priority === 'HIGH' ? 'text-orange-500 border-orange-200' : ''}`}>
                  {p.priority.toLowerCase()}
                </Badge>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>

      {projectsList.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Folder className="h-12 w-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No projects found</h2>
          <p className="text-slate-500 mb-6 text-center max-w-sm">
            Try adjusting your search or filters, or create a new project.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center pt-6 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
            {getPageNumbers().map(pageNum => (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm"
            disabled={page === meta.lastPage}
            onClick={() => setPage(p => p + 1)}
          >
            Next
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
