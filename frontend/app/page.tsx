import HomePage from "@/components/home/home-page";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarInset>
      <HomePage />
    </SidebarInset>
  );
}
