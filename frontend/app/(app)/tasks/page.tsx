"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { CheckSquare, Calendar, Clock, Search, Edit2, Trash2, LayoutList, LayoutDashboard, MessageSquare, Paperclip } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { BulkImportModal } from "@/components/tasks/BulkImportModal";
import { TaskDetailsModal } from "@/app/(app)/projects/[id]/board/TaskDetailsModal";
import KanbanBoard from "@/app/(app)/projects/[id]/board/KanbanBoard";

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // applied search
  
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks-global', page, statusFilter, priorityFilter, searchQuery],
    queryFn: async () => {
      let url = `/tasks?page=${page}&limit=20`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      if (priorityFilter !== "ALL") url += `&priority=${priorityFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      const res = await apiClient.get(url);
      return res.data;
    }
  });

  const tasks = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTaskIds(tasks.map((t: any) => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter(taskId => taskId !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: (updateData: any) => apiClient.patch(`/tasks/bulk/update`, { taskIds: selectedTaskIds, updateData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-global'] });
      setSelectedTaskIds([]);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedTaskIds.map(id => apiClient.delete(`/tasks/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-global'] });
      setSelectedTaskIds([]);
    }
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setPage(1);
  };

  // Pagination Logic
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-blue-500" />
            My Tasks
          </h1>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-sm flex items-center justify-center transition-colors ${viewMode === "board" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
              title="Board View"
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-sm flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
              title="List View"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3 w-full md:w-auto flex-1 mt-4 md:mt-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsBulkModalOpen(true)}>Bulk Upload</Button>
            <Button className="flex-1 sm:flex-none" onClick={() => setIsCreateModalOpen(true)}>Create Task</Button>
          </div>
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-auto flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              type="text" 
              placeholder="Search tasks..." 
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="flex-1 sm:flex-none sm:w-[130px]">
              <option value="ALL">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>

            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="flex-1 sm:flex-none sm:w-[140px]">
              <option value="ALL">All Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </Select>
          </div>
        </div>
      </div>

      {selectedTaskIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedTaskIds.length} task(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Select 
              value="" 
              onChange={(e) => {
                if(e.target.value) bulkUpdateMutation.mutate({ status: e.target.value });
              }} 
              className="w-[140px] h-8 text-sm"
              disabled={bulkUpdateMutation.isPending}
            >
              <option value="">Set Status...</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </Select>
            <Select 
              value="" 
              onChange={(e) => {
                if(e.target.value) bulkUpdateMutation.mutate({ priority: e.target.value });
              }} 
              className="w-[140px] h-8 text-sm"
              disabled={bulkUpdateMutation.isPending}
            >
              <option value="">Set Priority...</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to delete selected tasks?")) {
                  bulkDeleteMutation.mutate();
                }
              }}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className={`gap-4 overflow-x-auto ${viewMode === "board" ? "block" : "flex flex-col"}`}>
        {viewMode === "board" ? (
          <div className="h-[calc(100vh-220px)] min-h-[500px] min-w-max pb-4">
            <KanbanBoard initialTasks={tasks} />
          </div>
        ) : (
          <>
            {tasks.length > 0 && (
              <div className="flex items-center px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 cursor-pointer mr-4"
                  checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="text-sm text-slate-500 font-medium">Select All</span>
              </div>
            )}

            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <Card key={i} className="flex items-center h-24 px-6">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                </Card>
              ))
            ) : tasks.map((t: any) => (
              <Card key={t.id} className="hover:border-blue-500 transition-colors group">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 mt-1 rounded border-slate-300 cursor-pointer"
                      checked={selectedTaskIds.includes(t.id)}
                      onChange={() => handleSelectTask(t.id)}
                    />
                    <div>
                      <h3 
                        className="text-lg font-semibold group-hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => setViewingTaskId(t.id)}
                      >
                        {t.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-2">
                        <Link href={`/projects/${t.projectId}/board`} className="font-medium hover:underline text-slate-700 dark:text-slate-300">
                          {t.project?.name || "No Project"}
                        </Link>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "No due date"}
                        </div>
                        {t.estimatedHours && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {t.estimatedHours}h est.
                            </div>
                          </>
                        )}
                        <span>•</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1" title="Comments">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{t._count?.comments || 0}</span>
                          </div>
                          <div className="flex items-center gap-1" title="Attachments">
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{t._count?.attachments || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <Badge variant={t.status === 'DONE' ? 'done' : t.status === 'IN_PROGRESS' ? 'in_progress' : 'todo'} className="capitalize">
                      {t.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {t.priority.toLowerCase()}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => setEditingTask(t)}>
                      <Edit2 className="h-4 w-4 text-slate-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
        {tasks.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <CheckSquare className="h-12 w-12 text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No tasks found</h2>
            <p className="text-slate-500 mb-6 text-center max-w-sm">
              Try adjusting your filters or search term to find what you're looking for.
            </p>
          </div>
        )}
      </div>
      
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

      {editingTask && (
        <EditTaskModal 
          open={!!editingTask} 
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
        />
      )}

      <CreateTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <BulkImportModal
        open={isBulkModalOpen}
        onOpenChange={setIsBulkModalOpen}
      />

      <TaskDetailsModal
        taskId={viewingTaskId}
        open={!!viewingTaskId}
        onOpenChange={(open) => !open && setViewingTaskId(null)}
      />
    </div>
  );
}
