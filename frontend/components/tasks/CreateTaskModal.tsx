import { useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Textarea } from "@/components/ui/textarea";

const createTaskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional().or(z.literal("")),
  estimatedHours: z.string().optional().or(z.literal("")),
  actualHours: z.string().optional().or(z.literal("")),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

export function CreateTaskModal({ open, onOpenChange, projectId, projectName, projectMembers }: { open: boolean, onOpenChange: (open: boolean) => void, projectId?: string, projectName?: string, projectMembers?: any[] }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const activeProjectId = projectId || selectedProjectId;

  const { data: myProjectsData } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const res = await apiClient.get('/projects');
      return res.data;
    },
    enabled: open && !projectId
  });

  const { data: selectedProjectData } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${selectedProjectId}`);
      return res.data;
    },
    enabled: open && !projectId && !!selectedProjectId
  });

  const activeProjectMembers = projectId ? projectMembers : (selectedProjectData?.data?.members || []);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: "TODO",
      priority: "MEDIUM"
    }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks-global'] });
      reset();
      setSelectedProjectId("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to create task");
    }
  });

  const onSubmit = (data: CreateTaskFormValues) => {
    setError(null);
    if (!activeProjectId) {
      setError("Please select a project.");
      return;
    }
    const payload: any = {
      ...data,
      projectId: activeProjectId,
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
    };
    if (!payload.assigneeId) delete payload.assigneeId;
    if (!payload.dueDate) delete payload.dueDate;
    if (!payload.estimatedHours) delete payload.estimatedHours;
    if (data.actualHours) payload.actualHours = parseFloat(data.actualHours);
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Add a new task to this project's board.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="e.g. Implement login API" />
            {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Project</Label>
              {projectId ? (
                <Input value={projectName} disabled className="bg-slate-50 dark:bg-slate-900" />
              ) : (
                <Select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                  <option value="">Select a project...</option>
                  {myProjectsData?.data?.data?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Reporter</Label>
              <Input value={user?.name || ''} disabled className="bg-slate-50 dark:bg-slate-900" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Add more details about the task..." rows={3} />
            {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </Select>
              {errors.status && <span className="text-xs text-red-500">{errors.status.message}</span>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" {...register("priority")}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
              {errors.priority && <span className="text-xs text-red-500">{errors.priority.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="assigneeId">Assign To</Label>
              <Select id="assigneeId" {...register("assigneeId")}>
                <option value="">Unassigned</option>
                {activeProjectMembers?.filter((pm: any) => 
                  user?.role?.name === 'Admin' || 
                  user?.role?.name === 'Super Admin' || 
                  user?.role?.name === 'Project Manager' || 
                  user?.role?.name === 'Team Lead' || 
                  pm.userId === user?.id
                ).map((pm: any) => (
                  <option key={pm.userId} value={pm.userId}>{pm.user.name}</option>
                ))}
              </Select>
              {errors.assigneeId && <span className="text-xs text-red-500">{errors.assigneeId.message}</span>}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && <span className="text-xs text-red-500">{errors.dueDate.message}</span>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimatedHours">Estimated (hrs)</Label>
              <Input id="estimatedHours" type="number" step="0.5" min="0" {...register("estimatedHours")} placeholder="e.g. 5" />
              {errors.estimatedHours && <span className="text-xs text-red-500">{errors.estimatedHours.message}</span>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="actualHours">Actual (hrs)</Label>
              <Input id="actualHours" type="number" step="0.5" min="0" {...register("actualHours")} placeholder="e.g. 4.5" />
              {errors.actualHours && <span className="text-xs text-red-500">{errors.actualHours.message}</span>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
    </Dialog>
  );
}
