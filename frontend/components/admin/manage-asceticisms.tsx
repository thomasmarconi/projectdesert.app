"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getAsceticismsAction,
  createAsceticismAction,
  updateAsceticismAction,
  deleteAsceticismAction,
} from "@/lib/actions/asceticismActions";
import type { Asceticism } from "@/lib/services/asceticismService";
import {
  Sparkles,
  Plus,
  Edit,
  Trash2,
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
import { Spinner } from "@/components/ui/spinner";

// Predefined categories with icons
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
  { value: "reading", label: "Reading", icon: Book, color: "text-blue-500" },
  {
    value: "exercise",
    label: "Exercise",
    icon: Dumbbell,
    color: "text-green-500",
  },
  {
    value: "cold-exposure",
    label: "Cold Exposure",
    icon: Droplet,
    color: "text-cyan-500",
  },
  { value: "nature", label: "Nature", icon: Leaf, color: "text-emerald-500" },
  { value: "energy", label: "Energy", icon: Zap, color: "text-yellow-500" },
  { value: "other", label: "Other", icon: Sparkles, color: "text-gray-500" },
];

const TRACKING_TYPES = [
  { value: "BOOLEAN", label: "Yes/No (Completed or Not)" },
  { value: "NUMERIC", label: "Numeric (Count, Duration, etc.)" },
  { value: "TEXT", label: "Text (Notes, Journal)" },
];

export function ManageAsceticismsPage() {
  const { data: session } = useSession();
  const [asceticisms, setAsceticisms] = useState<Asceticism[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAsceticism, setEditingAsceticism] = useState<Asceticism | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [asceticismToDelete, setAsceticismToDelete] = useState<number | null>(
    null,
  );

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [trackingType, setTrackingType] = useState<
    "BOOLEAN" | "NUMERIC" | "TEXT"
  >("BOOLEAN");

  useEffect(() => {
    loadAsceticisms();
  }, []);

  const loadAsceticisms = async () => {
    try {
      setLoading(true);
      const data = await getAsceticismsAction();
      setAsceticisms(data);
    } catch (error) {
      toast.error("Failed to load asceticisms");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setTrackingType("BOOLEAN");
    setEditingAsceticism(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditClick = (asceticism: Asceticism) => {
    setTitle(asceticism.title);
    setDescription(asceticism.description || "");
    setCategory(asceticism.category);
    setTrackingType(asceticism.type as "BOOLEAN" | "NUMERIC" | "TEXT");
    setEditingAsceticism(asceticism);
    setCreateDialogOpen(true);
  };

  const handleSave = async () => {
    if (!session?.user?.email) {
      toast.error("You must be logged in");
      return;
    }

    if (!title || !category) {
      toast.error("Title and category are required");
      return;
    }

    try {
      const asceticismData = {
        title,
        description: description || undefined,
        category,
        type: trackingType,
        isTemplate: true,
      };

      if (editingAsceticism) {
        // Update existing
        await updateAsceticismAction(editingAsceticism.id, asceticismData);
        toast.success("Asceticism updated successfully");
      } else {
        // Create new
        await createAsceticismAction(asceticismData);
        toast.success("Asceticism created successfully");
      }

      setCreateDialogOpen(false);
      resetForm();
      loadAsceticisms();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save asceticism",
      );
      console.error(error);
    }
  };

  const handleDeleteClick = (id: number) => {
    setAsceticismToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!session?.user?.email || !asceticismToDelete) return;

    try {
      await deleteAsceticismAction(asceticismToDelete);
      toast.success("Asceticism deleted successfully");
      setDeleteDialogOpen(false);
      setAsceticismToDelete(null);
      loadAsceticisms();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete asceticism",
      );
      console.error(error);
    }
  };

  const getCategoryIcon = (categoryValue: string) => {
    const cat = CATEGORIES.find((c) => c.value === categoryValue);
    return cat ? cat.icon : Sparkles;
  };

  const getCategoryColor = (categoryValue: string) => {
    const cat = CATEGORIES.find((c) => c.value === categoryValue);
    return cat ? cat.color : "text-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Practice Templates</h1>
          <p className="text-muted-foreground">
            Create and manage asceticism templates that users can browse and add
            to their practices
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {asceticisms.map((asceticism) => {
          const CategoryIcon = getCategoryIcon(asceticism.category);
          const colorClass = getCategoryColor(asceticism.category);

          return (
            <Card key={asceticism.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 bg-primary/10 rounded-lg ${colorClass}`}
                    >
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {asceticism.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {asceticism.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="secondary">{asceticism.category}</Badge>
                  <Badge variant="outline">{asceticism.type}</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditClick(asceticism)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDeleteClick(asceticism.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {asceticisms.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No templates yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first asceticism template to get started
            </p>
            <Button className="mt-4" onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAsceticism
                ? "Edit Asceticism Template"
                : "Create Asceticism Template"}
            </DialogTitle>
            <DialogDescription>
              {editingAsceticism
                ? "Update the asceticism template that users can add to their practices"
                : "Create a new asceticism template that users can browse and add to their practices"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Daily Prayer, Cold Showers, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this practice..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${cat.color}`} />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking-type">Tracking Type *</Label>
              <Select
                value={trackingType}
                onValueChange={(value) =>
                  setTrackingType(value as "BOOLEAN" | "NUMERIC" | "TEXT")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tracking type" />
                </SelectTrigger>
                <SelectContent>
                  {TRACKING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAsceticism ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this asceticism template. Users who
              have already added this practice will keep it, but new users
              won&apos;t be able to browse and add it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
