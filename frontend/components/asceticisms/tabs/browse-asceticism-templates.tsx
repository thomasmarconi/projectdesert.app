"use client";

import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import { UserAsceticism } from "@/lib/services/asceticismService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Utensils,
  Heart,
  Brain,
  Moon,
  Book,
  Dumbbell,
  Droplet,
  Leaf,
  Zap,
  Sparkles,
  Check,
  Hash,
  FileText,
  X,
} from "lucide-react";
import {
  useAsceticismTemplates,
  useUserAsceticisms,
} from "@/hooks/use-asceticisms";
import { useSession } from "next-auth/react";

export default function BrowseAsceticismTemplates() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // TanStack Query hooks
  const { data: templates = [] } = useAsceticismTemplates();

  const { data: userAsceticisms = [] } = useUserAsceticisms(
    userId,
    undefined,
    undefined,
    true,
  );

  console.log(userAsceticisms, templates);

  const { openJoinDialog, openRemoveDialog } = useAsceticismStore();
  // Create a map of asceticism ID to user asceticism for quick lookup
  // Prioritize non-archived asceticisms (there can be multiple UserAsceticism records per asceticismId)
  const joinedMap = new Map<number, UserAsceticism>();
  userAsceticisms.forEach((ua) => {
    if (ua.asceticismId) {
      const existing = joinedMap.get(ua.asceticismId);
      // Only set if: no existing entry, OR existing is archived but new one is not
      if (
        !existing ||
        (existing.status === "ARCHIVED" && ua.status !== "ARCHIVED")
      ) {
        joinedMap.set(ua.asceticismId, ua);
      }
    }
  });

  // Separate templates into two groups:
  // - Available: not tracking OR archived (can be reactivated)
  // - Currently Tracking: all non-archived asceticisms (ACTIVE, PAUSED, COMPLETED)
  const availableTemplates = templates.filter((t) => {
    const ua = joinedMap.get(t.id);
    return !ua || ua.status === "ARCHIVED"; // Show if not tracking or archived
  });
  const trackingTemplates = templates.filter((t) => {
    const ua = joinedMap.get(t.id);
    return ua && ua.status !== "ARCHIVED"; // Show all non-archived user asceticisms
  });

  // Helper to convert category to title case
  function toTitleCase(str: string): string {
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Get the icon component for a category
  function getCategoryIcon(category: string, className?: string) {
    const iconMap: Record<string, React.ElementType> = {
      fasting: Utensils,
      prayer: Heart,
      meditation: Brain,
      sleep: Moon,
      reading: Book,
      exercise: Dumbbell,
      "cold-exposure": Droplet,
      nature: Leaf,
      energy: Zap,
      other: Sparkles,
    };

    const IconComponent = iconMap[category.toLowerCase()] || Sparkles;
    return <IconComponent className={className} />;
  }

  // Get the icon for asceticism type
  function getTypeIcon(type: string, className?: string) {
    const iconMap: Record<string, React.ElementType> = {
      BOOLEAN: Check,
      NUMERIC: Hash,
      TEXT: FileText,
    };

    const IconComponent = iconMap[type] || Check;
    return <IconComponent className={className} />;
  }

  return (
    <div className="space-y-6">
      {/* Available Practices Section */}
      {availableTemplates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Available Practices
            </h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {availableTemplates.map((t) => (
              <div
                key={t.id}
                className="group flex items-center gap-3 p-3 rounded-lg border transition-all hover:border-primary/50 hover:bg-accent/50"
              >
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                  {getCategoryIcon(t.category, "w-5 h-5")}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm truncate">
                      {t.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {t.description || "No description available."}
                  </p>
                </div>

                {/* Badges */}
                <div className="shrink-0 flex items-center gap-1.5">
                  <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                    {toTitleCase(t.category)}
                  </Badge>
                  <Badge variant="outline" className="h-6 px-2 text-[10px]">
                    {getTypeIcon(t.type, "w-2.5 h-2.5 mr-1 inline")}
                    {t.type}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <Button
                    onClick={() => openJoinDialog(t)}
                    size="sm"
                    className="h-8 px-3 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-xs">Add</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currently Tracking Section */}
      {trackingTemplates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Currently Tracking
            </h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {trackingTemplates.map((t) => {
              const userAsceticism = joinedMap.get(t.id);

              return (
                <div
                  key={t.id}
                  className="group flex items-center gap-3 p-3 rounded-lg border bg-accent/30 border-primary/30"
                >
                  {/* Icon */}
                  <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
                    {getCategoryIcon(t.category, "w-5 h-5")}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm truncate">
                        {t.title}
                      </h3>
                      <Badge
                        variant="default"
                        className="h-5 px-1.5 text-[10px] font-medium"
                      >
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {t.description || "No description available."}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                      {toTitleCase(t.category)}
                    </Badge>
                    <Badge variant="outline" className="h-6 px-2 text-[10px]">
                      {getTypeIcon(t.type, "w-2.5 h-2.5 mr-1 inline")}
                      {t.type}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {userAsceticism && (
                      <Button
                        onClick={() =>
                          openRemoveDialog(userAsceticism.id, t.title)
                        }
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
          <p className="text-sm">
            No templates found. Contact an admin about creating some.
          </p>
        </div>
      )}
    </div>
  );
}
