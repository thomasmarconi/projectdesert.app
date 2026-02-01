import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { UserRole } from "@/types/enums";
import { SidebarInset } from "@/components/ui/sidebar";
import { auth } from "@/auth";
import { PackagesManagementPage } from "@/components/admin/packages/packages-management";

export default async function AdminPackagesPage() {
  const session = await auth();

  // Check if user is logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Check if user is admin
  if (session.user.role !== UserRole.ADMIN) {
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
        <PackagesManagementPage />
      </div>
    </SidebarInset>
  );
}
