import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({ open, onOpenChange, onConfirm, isDeleting }: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="text-red-600">Delete User</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this user? This action cannot be undone and will remove their access to the system.
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
