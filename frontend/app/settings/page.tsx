import SettingsPage from "@/components/settings/settings-page";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarInset>
      <div className="container mx-auto p-6">
        <SettingsPage />
      </div>
    </SidebarInset>
  );
}
