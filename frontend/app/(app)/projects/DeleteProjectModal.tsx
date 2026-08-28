import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteProjectModal({ open, onOpenChange, onConfirm, isDeleting }: DeleteProjectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="text-red-600 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Delete Project
        </DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this project? This action will archive the project and it will no longer be visible to team members.
        </DialogDescription>
      </DialogHeader>
      
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete User"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
