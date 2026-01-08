import { BrowsePackagesPage } from "@/components/packages/browse-packages-page";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarInset>
      <div className="container mx-auto p-6">
        <BrowsePackagesPage />
      </div>
    </SidebarInset>
  );
}
