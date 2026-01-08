import { signIn } from "@/auth";
import { LogIn } from "lucide-react";

export default function SidebarSignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
      className="w-full"
    >
      <button
        type="submit"
        className="flex items-center w-full gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <LogIn className="h-4 w-4" />
        <span>Sign in with Google</span>
      </button>
    </form>
  );
}
