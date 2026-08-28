"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useState, useEffect } from "react";

const editUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  mobile: z.string().min(10, "Invalid mobile number").optional().or(z.literal("")),
  roleId: z.string().optional(),
  accountStatus: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  profilePicture: z.string().optional().or(z.literal("")),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export function EditUserModal({ open, onOpenChange, user }: { open: boolean, onOpenChange: (open: boolean) => void, user: any }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data;
    }
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      accountStatus: "ACTIVE",
      profilePicture: ""
    }
  });

  const profilePicture = watch("profilePicture");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("profilePicture", reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (user && open) {
      reset({
        name: user.name,
        email: user.email,
        mobile: user.mobile || "",
        roleId: user.roleId || "",
        accountStatus: user.accountStatus || "ACTIVE",
        profilePicture: user.profilePicture || "",
        password: "", // Don't populate password
      });
    }
  }, [user, open, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditUserFormValues) => {
      // Remove empty password so we don't accidentally update it
      if (!data.password) delete data.password;
      return apiClient.patch(`/users/${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update user");
    }
  });

  const onSubmit = (data: EditUserFormValues) => {
    setError(null);
    if (!data.profilePicture) delete data.profilePicture;
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>Update the details of this user.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g. John Doe" />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" type="tel" {...register("mobile")} />
            {errors.mobile && <span className="text-xs text-red-500">{errors.mobile.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <div className="flex items-center gap-3">
              {profilePicture ? (
                <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-slate-200">
                  <img src={profilePicture} alt="Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs">
                  None
                </div>
              )}
              <Input 
                id="profilePicture" 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
            </div>
            {errors.profilePicture && <span className="text-xs text-red-500">{errors.profilePicture.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password (Optional)</Label>
            <Input id="password" type="password" placeholder="Leave blank to keep current" {...register("password")} />
            {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roleId">Role</Label>
            <Select id="roleId" {...register("roleId")} disabled={isLoadingRoles}>
              <option value="">Select a role (optional)</option>
              {rolesData?.data?.map((role: any) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
            {errors.roleId && <span className="text-xs text-red-500">{errors.roleId.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountStatus">Status</Label>
            <Select id="accountStatus" {...register("accountStatus")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
            {errors.accountStatus && <span className="text-xs text-red-500">{errors.accountStatus.message}</span>}
          </div>
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
