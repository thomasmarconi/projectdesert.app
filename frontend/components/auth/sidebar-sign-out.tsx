import { signOut } from "@/auth";
import { LogOut } from "lucide-react";

export function SidebarSignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
      className="w-full"
    >
      <button
        type="submit"
        className="flex items-center w-full gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign out</span>
      </button>
    </form>
  );
}
