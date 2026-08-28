import { useState, useEffect } from "react";
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

const editTaskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional().or(z.literal("")),
  estimatedHours: z.string().optional().or(z.literal("")),
});

type EditTaskFormValues = z.infer<typeof editTaskSchema>;

export function EditTaskModal({ open, onOpenChange, task }: { open: boolean, onOpenChange: (open: boolean) => void, task: any }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const { data: project } = useQuery({
    queryKey: ['project', task?.projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${task?.projectId}`);
      return res.data;
    },
    enabled: !!task?.projectId && open
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      status: "TODO",
      priority: "MEDIUM"
    }
  });

  useEffect(() => {
    if (task && open) {
      setValue("title", task.title);
      setValue("description", task.description || "");
      setValue("status", task.status);
      setValue("priority", task.priority);
      setValue("assigneeId", task.assigneeId || "");
      setValue("dueDate", task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
      setValue("estimatedHours", task.estimatedHours ? String(task.estimatedHours) : "");
    }
  }, [task, open, setValue]);

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.patch(`/tasks/${task?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-global'] });
      queryClient.invalidateQueries({ queryKey: ['task', task?.id] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update task");
    }
  });

  const onSubmit = (data: EditTaskFormValues) => {
    setError(null);
    const payload: any = {
      ...data,
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate || null,
    };
    mutation.mutate(payload);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogDescription>Make changes to the task details.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
              {project?.data?.members?.filter((pm: any) => 
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
          <div className="space-y-1.5">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input id="estimatedHours" type="number" step="0.5" min="0" {...register("estimatedHours")} placeholder="e.g. 5" />
            {errors.estimatedHours && <span className="text-xs text-red-500">{errors.estimatedHours.message}</span>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
          {errors.dueDate && <span className="text-xs text-red-500">{errors.dueDate.message}</span>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
