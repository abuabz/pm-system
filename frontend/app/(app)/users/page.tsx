"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Trash2, Plus, Users, User, Search } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function UsersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // State for Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<string | null>(null);

  // Fetch Roles for filter dropdown
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data;
    }
  });

  // Fetch Users
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, searchQuery, statusFilter, roleFilter],
    queryFn: async () => {
      let url = `/users?page=${page}&limit=10`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      if (roleFilter !== "ALL") url += `&roleId=${roleFilter}`;
      
      const res = await apiClient.get(url);
      return res.data;
    }
  });

  const usersList = data?.data?.data || [];
  const meta = data?.data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDeleteModalOpen(false);
      setSelectedUserForDelete(null);
    }
  });

  if (user?.role?.name !== "Super Admin" && user?.role?.name !== "Admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  const confirmDelete = (id: string) => {
    setSelectedUserForDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (u: any) => {
    setSelectedUserForEdit(u);
    setIsEditModalOpen(true);
  };

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
          <Users className="h-6 w-6 text-blue-500" />
          User Management
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            type="text" 
            placeholder="Search by name or email..." 
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-full sm:w-[150px]">
            <option value="ALL">All Roles</option>
            {rolesData?.data?.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>

          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full sm:w-[140px]">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : usersList.map((u: Record<string, any>) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden mr-3">
                      {u.profilePicture ? (
                        <img src={u.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    {u.name}
                  </div>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role?.name === 'Super Admin' || u.role?.name === 'Admin' ? 'default' : 'secondary'}>
                    {u.role?.name || 'User'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.accountStatus === 'ACTIVE' ? 'success' : 'warning'}>
                    {u.accountStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(u)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => confirmDelete(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {usersList.length === 0 && !isLoading && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No users found</h2>
            <p className="text-slate-500 max-w-sm">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center pt-2 gap-2">
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

      <CreateUserModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      <EditUserModal 
        open={isEditModalOpen} 
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedUserForEdit(null);
        }} 
        user={selectedUserForEdit}
      />

      <DeleteConfirmationModal 
        open={isDeleteModalOpen} 
        onOpenChange={setIsDeleteModalOpen} 
        onConfirm={() => selectedUserForDelete && deleteMutation.mutate(selectedUserForDelete)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
