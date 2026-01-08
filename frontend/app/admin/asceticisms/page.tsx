import { ManageAsceticismsPage } from "@/components/admin/manage-asceticisms";
import { getCurrentUser } from "@/lib/services/adminService";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { UserRole } from "@/lib/types/admin";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function AdminManageAsceticismsPage() {
  const currentUser = await getCurrentUser();

  // Check if user is logged in
  if (!currentUser) {
    redirect("/api/auth/signin");
  }

  // Check if user is banned
  if (currentUser.isBanned) {
    return (
      <SidebarInset>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Your account has been banned. Please contact support for
              assistance.
            </AlertDescription>
          </Alert>
        </div>
      </SidebarInset>
    );
  }

  // Check if user is admin
  if (currentUser.role !== UserRole.ADMIN) {
    return (
      <SidebarInset>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Unauthorized</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page. Admin access is
              required.
            </AlertDescription>
          </Alert>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <div className="container mx-auto p-6">
        <ManageAsceticismsPage />
      </div>
    </SidebarInset>
  );
}
