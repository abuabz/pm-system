"use client";

import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Download, Edit2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { useAuthStore } from "@/store/use-auth-store";

export function TaskDetailsModal({ 
  taskId, 
  open, 
  onOpenChange 
}: { 
  taskId: string | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void 
}) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "attachments">("comments");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const currentUser = useAuthStore(state => state.user);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}`);
      return res.data;
    },
    enabled: !!taskId && open
  });

  const { data: comments } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}/comments`);
      return res.data;
    },
    enabled: !!taskId && open && activeTab === "comments"
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => apiClient.post(`/tasks/${taskId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setCommentText("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-global'] });
      onOpenChange(false);
    }
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      // Remove Content-Type so Axios sets it to multipart/form-data with the correct boundary
      const config = { headers: { 'Content-Type': undefined as any } };
      return apiClient.post(`/tasks/${taskId}/attachments`, formData, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiClient.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string, content: string }) => apiClient.patch(`/comments/${commentId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      setEditingCommentId(null);
      setEditCommentText("");
    }
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => apiClient.delete(`/attachments/${attachmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task? This cannot be undone.")) {
      deleteMutation.mutate(taskId as string);
    }
  };

  if (!open || !taskId) return null;

  const t = task?.data;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading task details...</div>
        ) : !t ? (
          <div className="p-12 text-center text-red-500">Task not found.</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="uppercase">{t.priority}</Badge>
                <Badge variant={t.status === 'DONE' ? 'done' : t.status === 'IN_PROGRESS' ? 'in_progress' : 'todo'}>{t.status.replace('_', ' ')}</Badge>
              </div>
            <DialogTitle className="text-xl">{t.title}</DialogTitle>
            <DialogDescription className="mt-4 text-slate-700 dark:text-slate-300">
              {t.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <button
                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'comments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                onClick={() => setActiveTab("comments")}
              >
                Comments ({comments?.data ? comments.data.length : (t._count?.comments || 0)})
              </button>
              <button
                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'attachments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                onClick={() => setActiveTab("attachments")}
              >
                Attachments ({t.attachments?.length || 0})
              </button>
            </div>

            {activeTab === "comments" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Add a comment..." 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button 
                    className="h-auto"
                    disabled={!commentText.trim() || commentMutation.isPending}
                    onClick={() => commentMutation.mutate(commentText)}
                  >
                    Post
                  </Button>
                </div>
                
                <div className="space-y-4 mt-4 max-h-[300px] overflow-y-auto pr-2">
                  {comments?.data?.map((c: any) => (
                    <div key={c.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{c.author.name}</span>
                        <span className="text-xs text-slate-500">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      
                      {editingCommentId === c.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea 
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button size="sm" onClick={() => updateCommentMutation.mutate({ commentId: c.id, content: editCommentText })} disabled={!editCommentText.trim() || updateCommentMutation.isPending}>
                              <Check className="h-4 w-4 mr-1" /> Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{c.content}</p>
                          {(currentUser?.id === c.author.id || (currentUser?.role as any)?.name === 'Super Admin' || (currentUser?.role as any)?.name === 'Admin') && (
                            <div className="flex gap-2 self-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-slate-500 hover:text-blue-600" onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-slate-500 hover:text-red-600" onClick={() => confirm("Delete comment?") && deleteCommentMutation.mutate(c.id)}>
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {comments?.data?.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-4">No comments yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "attachments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 border-dashed">
                  <span className="text-sm text-slate-500">Upload new attachment (max 5MB)</span>
                  <input 
                    type="file" 
                    id={`file-upload-${taskId}`}
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        uploadAttachmentMutation.mutate(e.target.files[0]);
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById(`file-upload-${taskId}`)?.click()}
                  >
                    Browse Files
                  </Button>
                </div>
                
                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                  {t.attachments?.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {a.mimeType?.startsWith('image/') ? (
                          <div className="h-10 w-10 shrink-0 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                            <img src={`http://localhost:3001${a.fileUrl}`} alt={a.fileName} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase truncate px-1">{a.mimeType?.split('/')[1] || 'FILE'}</span>
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate">{a.fileName}</span>
                          <span className="text-xs text-slate-500 uppercase">{a.mimeType?.split('/')[1] || 'FILE'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`http://localhost:3001${a.fileUrl}`} download={a.fileName} target="_blank" rel="noreferrer">
                          <Button type="button" variant="ghost" size="icon" title="Download attachment">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        {(currentUser?.id === a.uploaderId || (currentUser?.role as any)?.name === 'Super Admin' || (currentUser?.role as any)?.name === 'Admin') && (
                          <Button type="button" variant="ghost" size="icon" title="Delete attachment" className="text-slate-400 hover:text-red-500" onClick={() => confirm("Delete attachment?") && deleteAttachmentMutation.mutate(a.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {t.attachments?.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-4">No attachments yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex justify-between sm:justify-between items-center w-full">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Task"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </>
      )}
    </Dialog>
    {t && (
      <EditTaskModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        task={t} 
      />
    )}
    </>
  );
}
