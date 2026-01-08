import AsceticismsPage from "@/components/asceticisms/asceticisms-page";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarInset>
      <div className="container mx-auto p-6">
        <AsceticismsPage />
      </div>
    </SidebarInset>
  );
}
