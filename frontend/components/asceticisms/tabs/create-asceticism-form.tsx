"use client";

import { useState } from "react";
import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import { useQueryClient } from "@tanstack/react-query";
import { asceticismKeys } from "@/hooks/use-asceticisms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  createAsceticism,
  joinAsceticism,
} from "@/lib/services/asceticismService";
import {
  Sparkles,
  Droplet,
  Utensils,
  Moon,
  Book,
  Heart,
  Dumbbell,
  Brain,
  Leaf,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

// Predefined categories with icons and colors
const CATEGORIES = [
  {
    value: "fasting",
    label: "Fasting",
    icon: Utensils,
    color: "text-orange-500",
  },
  { value: "prayer", label: "Prayer", icon: Heart, color: "text-rose-500" },
  {
    value: "meditation",
    label: "Meditation",
    icon: Brain,
    color: "text-purple-500",
  },
  { value: "sleep", label: "Sleep", icon: Moon, color: "text-indigo-500" },
  { value: "study", label: "Study", icon: Book, color: "text-blue-500" },
  {
    value: "exercise",
    label: "Exercise",
    icon: Dumbbell,
    color: "text-green-500",
  },
  {
    value: "abstinence",
    label: "Abstinence",
    icon: Droplet,
    color: "text-cyan-500",
  },
  { value: "nature", label: "Nature", icon: Leaf, color: "text-emerald-500" },
  {
    value: "energy",
    label: "Energy Work",
    icon: Zap,
    color: "text-yellow-500",
  },
  { value: "custom", label: "Custom", icon: Sparkles, color: "text-pink-500" },
];

const TRACKING_TYPES = [
  {
    value: "BOOLEAN",
    label: "Yes/No (Daily Completion)",
    description: "Track whether you completed the practice each day",
  },
  {
    value: "NUMERIC",
    label: "Numeric (Count/Duration)",
    description:
      "Track a number (e.g., minutes, repetitions, glasses of water)",
  },
  {
    value: "TEXT",
    label: "Text (Journal Entry)",
    description: "Write notes or reflections for each day",
  },
];

export default function CreateAsceticismForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const disabled = !session || !userId;

  const { openSignInDialog } = useAsceticismStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    customCategory: "",
    type: "BOOLEAN" as "BOOLEAN" | "NUMERIC" | "TEXT",
    icon: "",
    startDate: "",
    endDate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("You must be logged in to create a practice");
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a title for your practice");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    if (formData.category === "custom" && !formData.customCategory.trim()) {
      toast.error("Please enter a custom category name");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalCategory =
        formData.category === "custom"
          ? formData.customCategory
          : formData.category;

      const selectedCategoryData = CATEGORIES.find(
        (c) => c.value === formData.category,
      );
      const iconName = selectedCategoryData?.icon.name || "Sparkles";

      // Create the asceticism
      const newAsceticism = await createAsceticism({
        title: formData.title,
        description: formData.description || undefined,
        category: finalCategory,
        type: formData.type,
        icon: iconName,
        creatorId: userId,
      });

      // Automatically join the user to the newly created asceticism
      await joinAsceticism(
        userId,
        newAsceticism.id,
        undefined,
        formData.startDate || undefined,
        formData.endDate || undefined,
      );

      toast.success("Practice created successfully!", {
        description: "You can start tracking your progress now",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        customCategory: "",
        type: "BOOLEAN",
        icon: "",
        startDate: "",
        endDate: "",
      });

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({
        queryKey: asceticismKeys.templates(),
      });
    } catch (error) {
      console.error("Failed to create asceticism:", error);
      toast.error("Failed to create practice", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = CATEGORIES.find(
    (c) => c.value === formData.category,
  );
  const CategoryIcon = selectedCategory?.icon || Sparkles;

  return (
    <Card className="max-w-2xl mx-auto">
      {disabled && (
        <div className=" border-b p-8 text-center">
          <Sparkles
            size={48}
            className="mx-auto mb-4 text-primary opacity-60"
          />
          <p className="text-lg font-medium mb-2">Create Your Own Practices</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Design custom ascetic practices tailored to your spiritual journey.
            Sign in to start creating.
          </p>
          <Button onClick={openSignInDialog} size="lg">
            Sign In to Create
          </Button>
        </div>
      )}
      <CardHeader className={cn("space-y-2", disabled && "pt-8")}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linear-to-br from-amber-500 to-orange-500 rounded-lg shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Create Custom Practice</CardTitle>
            <CardDescription>
              Design your own ascetic practice tailored to your spiritual
              journey
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Practice Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Morning Cold Shower, 40-Day Fast, Daily Rosary"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="text-base"
              required
              disabled={disabled}
            />
            <p className="text-sm text-muted-foreground">
              Give your practice a clear, meaningful name
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose, rules, or guidelines for this practice..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="min-h-25 text-base resize-none"
              disabled={disabled}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Add details about what this practice involves
            </p>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label htmlFor="category" className="text-base font-semibold">
              Category <span className="text-destructive">*</span>
            </Label>

            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className={`h-4 w-4 ${cat.color}`} />
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Category Input */}
            {formData.category === "custom" && (
              <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="customCategory" className="text-sm font-medium">
                  Custom Category Name
                </Label>
                <Input
                  id="customCategory"
                  placeholder="Enter your custom category"
                  value={formData.customCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, customCategory: e.target.value })
                  }
                  className="text-base"
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          {/* Tracking Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Tracking Type <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TRACKING_TYPES.map((type) => {
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: type.value as "BOOLEAN" | "NUMERIC" | "TEXT",
                      })
                    }
                    disabled={disabled}
                    className={`
                      text-left p-4 rounded-lg border-2 transition-all h-full
                      ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      }
                      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-sm ${
                            isSelected ? "text-primary" : ""
                          }`}
                        >
                          {type.label}
                        </span>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration / Dates */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Duration (Optional)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setFormData({
                      ...formData,
                      startDate: newStartDate,
                      // Clear end date if it's now before the new start date
                      endDate: formData.endDate && formData.endDate < newStartDate ? "" : formData.endDate,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || undefined}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value });
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Set a specific timeframe for this practice
            </p>
          </div>

          {/* Preview */}
          {formData.title && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-base font-semibold">Preview</Label>
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        className={`h-5 w-5 ${
                          selectedCategory?.color || "text-primary"
                        }`}
                      />
                      <Badge variant="secondary">
                        {formData.category === "custom"
                          ? formData.customCategory || "Custom"
                          : selectedCategory?.label || "Uncategorized"}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {
                        TRACKING_TYPES.find(
                          (t) => t.value === formData.type,
                        )?.label.split(" ")[0]
                      }
                    </Badge>
                  </div>
                  <CardTitle>{formData.title}</CardTitle>
                  {formData.description && (
                    <CardDescription className="line-clamp-2">
                      {formData.description}
                    </CardDescription>
                  )}
                  {(formData.startDate || formData.endDate) && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium">Duration:</span>
                      {formData.startDate
                        ? new Date(
                            formData.startDate + "T00:00:00",
                          ).toLocaleDateString()
                        : "Now"}
                      {" - "}
                      {formData.endDate
                        ? new Date(
                            formData.endDate + "T00:00:00",
                          ).toLocaleDateString()
                        : "Ongoing"}
                    </div>
                  )}
                </CardHeader>
              </Card>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setFormData({
                title: "",
                description: "",
                category: "",
                customCategory: "",
                type: "BOOLEAN",
                icon: "",
                startDate: "",
                endDate: "",
              });
            }}
            disabled={isSubmitting || disabled}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            className="flex-1 gap-2 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            disabled={isSubmitting || disabled}
          >
            {isSubmitting ? (
              <>Creating...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Create Practice
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
