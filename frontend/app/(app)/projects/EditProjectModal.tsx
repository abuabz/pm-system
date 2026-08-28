"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

const editProjectSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  memberIds: z.array(z.string()).optional(),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

export function EditProjectModal({ open, onOpenChange, project }: { open: boolean, onOpenChange: (open: boolean) => void, project: any }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      priority: "MEDIUM",
      status: "ACTIVE",
      memberIds: []
    }
  });

  // When project changes, update form
  useEffect(() => {
    if (project && open) {
      reset({
        name: project.name,
        description: project.description || "",
        startDate: new Date(project.startDate).toISOString().split('T')[0],
        endDate: new Date(project.endDate).toISOString().split('T')[0],
        priority: project.priority,
        status: project.status,
        memberIds: project.members?.map((m: any) => m.userId) || []
      });
    }
  }, [project, open, reset]);

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users?limit=100');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (data: EditProjectFormValues) => apiClient.patch(`/projects/${project.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update project");
    }
  });

  const onSubmit = (data: EditProjectFormValues) => {
    // Ensure dates are correctly formatted as ISO or simple YYYY-MM-DD
    setError(null);
    mutation.mutate({
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogDescription>Update project details and manage team members.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" {...register("name")} placeholder="e.g. Website Redesign" />
          {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} placeholder="What is this project about?" />
          {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
            {errors.startDate && <span className="text-xs text-red-500">{errors.startDate.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" {...register("endDate")} />
            {errors.endDate && <span className="text-xs text-red-500">{errors.endDate.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" {...register("priority")}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
            {errors.priority && <span className="text-xs text-red-500">{errors.priority.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
            {errors.status && <span className="text-xs text-red-500">{errors.status.message}</span>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="memberIds">Project Members</Label>
          <div className="relative">
            {/* Selected tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {usersData?.data?.data
                ?.filter((u: any) => watch("memberIds")?.includes(u.id))
                .map((u: any) => (
                  <div key={u.id} className="flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-sm">
                    {u.name}
                    <button
                      type="button"
                      className="ml-1 hover:text-blue-500"
                      onClick={() => {
                        const current = watch("memberIds") || [];
                        setValue("memberIds", current.filter(id => id !== u.id));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>

            {/* Custom Searchable Select */}
            <div className="relative">
              <div 
                className="flex items-center justify-between min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-slate-950 focus-within:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:ring-slate-300 disabled:opacity-50"
              >
                <input 
                  type="text" 
                  placeholder="Search to add members..."
                  className="w-full bg-transparent outline-none border-none placeholder:text-slate-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)}
                  disabled={isLoadingUsers}
                />
                <ChevronsUpDown className="h-4 w-4 text-slate-500 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)} />
              </div>
              
              {isDropdownOpen && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  {usersData?.data?.data?.filter((u: any) => {
                    const fullName = `${u.name}`.toLowerCase();
                    return fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                  }).map((user: any) => {
                    const isSelected = watch("memberIds")?.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${isSelected ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                        onClick={() => {
                          const current = watch("memberIds") || [];
                          if (isSelected) {
                            setValue("memberIds", current.filter(id => id !== user.id));
                          } else {
                            setValue("memberIds", [...current, user.id]);
                          }
                          setSearchTerm('');
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    );
                  })}
                  {usersData?.data?.data?.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-slate-500">No users found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          {errors.memberIds && <span className="text-xs text-red-500">{errors.memberIds.message}</span>}
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
