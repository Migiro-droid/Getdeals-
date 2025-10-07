// Unauthorized Access Dialog Component
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldX } from "lucide-react";

interface UnauthorizedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  requiredRole?: string;
}

export function UnauthorizedDialog({
  open,
  onOpenChange,
  message,
  requiredRole,
}: UnauthorizedDialogProps) {
  const defaultMessage = "You do not have permission to view this section.";
  const roleMessage = requiredRole 
    ? `This section requires ${requiredRole} access.`
    : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <ShieldX className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              Unauthorized Access
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-2">
            <p>{message || defaultMessage}</p>
            {roleMessage && <p className="text-sm text-muted-foreground">{roleMessage}</p>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
