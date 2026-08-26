"use client";

import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Download } from "lucide-react";
import { format } from "date-fns";

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
      setCommentText("");
    }
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    }
  });

  if (!open || !taskId) return null;

  const t = task?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading task details...</div>
      ) : (
        <>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="uppercase">{t.priority}</Badge>
              <Badge variant="secondary">{t.status.replace('_', ' ')}</Badge>
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
                Comments ({t._count?.comments || 0})
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
                    <div key={c.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{c.author.firstName} {c.author.lastName}</span>
                        <span className="text-xs text-slate-500">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{c.content}</p>
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
                    id="file-upload" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        uploadAttachmentMutation.mutate(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" asChild className="cursor-pointer">
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </div>
                
                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                  {t.attachments?.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">{a.fileName}</span>
                        <span className="text-xs text-slate-500 uppercase">{a.mimeType.split('/')[1] || 'FILE'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" title="Download placeholder">
                          <Download className="h-4 w-4" />
                        </Button>
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
        </>
      )}
    </Dialog>
  );
}
