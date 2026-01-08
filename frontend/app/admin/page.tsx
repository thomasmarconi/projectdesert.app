import AdminPage from "@/components/admin/admin-page";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarInset>
      <div className="container mx-auto p-6">
        <AdminPage />
      </div>
    </SidebarInset>
  );
}
