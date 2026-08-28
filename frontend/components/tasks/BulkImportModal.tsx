import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function BulkImportModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: number, updated: number, errors: string[] } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const { data: myProjectsData } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const res = await apiClient.get('/projects');
      return res.data;
    },
    enabled: open
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) return;
      const response = await apiClient.get(`/tasks/bulk/template?projectId=${selectedProjectId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasks_template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('projectId', selectedProjectId);
      const res = await apiClient.post('/tasks/bulk/upload', formData, {
        headers: { 'Content-Type': undefined } // Let browser handle boundary
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-global'] });
      setFile(null);
    }
  });

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setSelectedProjectId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
        <DialogHeader>
          <DialogTitle>Bulk Upload Tasks</DialogTitle>
          <DialogDescription>
            Import multiple tasks at once using an Excel spreadsheet. You can create new tasks or update existing ones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!result ? (
            <>
              {/* Project Selection */}
              <div className="space-y-3">
                <Label>Select Project</Label>
                <Select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                  <option value="">Select a project...</option>
                  {myProjectsData?.data?.data?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>

              {/* Step 1 */}
              <div className={`space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 ${!selectedProjectId ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 h-5 w-5 rounded-full flex items-center justify-center text-xs">1</span>
                  Download Template
                </h3>
                <p className="text-sm text-slate-500">
                  Get the correctly formatted Excel file. It includes your Project IDs and User Emails in a reference tab.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => downloadTemplateMutation.mutate()}
                  disabled={downloadTemplateMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadTemplateMutation.isPending ? "Downloading..." : "Download Template"}
                </Button>
              </div>

              {/* Step 2 */}
              <div className={`space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 ${!selectedProjectId ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 h-5 w-5 rounded-full flex items-center justify-center text-xs">2</span>
                  Upload Data
                </h3>
                <p className="text-sm text-slate-500">
                  Fill in your tasks and upload the file below.
                </p>
                
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center bg-white dark:bg-slate-950">
                  <input
                    type="file"
                    id="excel-upload"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                    <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-blue-600 hover:underline">
                      {file ? file.name : "Click to select Excel file"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">.xlsx or .xls files only</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-900/50">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <h4 className="font-semibold">Upload Complete</h4>
                  <p className="text-sm">Created {result.created} new tasks, updated {result.updated} existing tasks.</p>
                </div>
              </div>
              
              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    Errors occurred ({result.errors.length})
                  </div>
                  <ul className="text-sm space-y-1 max-h-[150px] overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i} className="list-disc ml-4">{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="button" 
                disabled={!file || !selectedProjectId || uploadMutation.isPending}
                onClick={() => file && uploadMutation.mutate(file)}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Tasks"}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
    </Dialog>
  );
}
