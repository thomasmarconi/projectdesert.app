import { MessageCircle } from "lucide-react";

export default function SidebarFeedbackButton() {
  return (
    <a
      href="https://forms.gle/Vz88ngwzD6ewQooUA"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center w-full gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      <span>Report Feedback</span>
    </a>
  );
}
