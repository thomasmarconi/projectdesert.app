import DailyReadingsPage from "@/components/daily-readings/daily-readings-page";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarInset>
      <div className="container mx-auto p-6">
        <DailyReadingsPage />
      </div>
    </SidebarInset>
  );
}
