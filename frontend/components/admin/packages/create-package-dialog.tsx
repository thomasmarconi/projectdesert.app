"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  createPackageAction,
  updatePackageAction,
} from "@/lib/actions/packageActions";
import {
  PackageResponse,
  PackageItemInput,
  PackageCreate,
} from "@/lib/services/packageService";
import { getAsceticismsAction } from "@/lib/actions/asceticismActions";
import { Asceticism } from "@/lib/services/asceticismService";
import { ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CreatePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPackage?: PackageResponse | null;
  onSuccess?: () => void;
}

export default function CreatePackageDialog({
  open,
  onOpenChange,
  editingPackage,
  onSuccess,
}: CreatePackageDialogProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAsceticisms, setSelectedAsceticisms] = useState<
    PackageItemInput[]
  >([]);
  const [availableAsceticisms, setAvailableAsceticisms] = useState<
    Asceticism[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      loadAsceticisms();
    }
  }, [open]);

  useEffect(() => {
    if (editingPackage) {
      setTitle(editingPackage.title);
      setDescription(editingPackage.description || "");
      setSelectedAsceticisms(
        editingPackage.items.map((item) => ({
          asceticismId: item.asceticismId,
          order: item.order,
          notes: item.notes,
        })),
      );
    } else {
      resetForm();
    }
  }, [editingPackage]);

  const loadAsceticisms = async () => {
    try {
      const data = await getAsceticismsAction();
      setAvailableAsceticisms(data);
    } catch (error) {
      console.error("Failed to load asceticisms:", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedAsceticisms([]);
    setSearchQuery("");
  };

  const isSelected = (asceticismId: number) => {
    return selectedAsceticisms.some(
      (item) => item.asceticismId === asceticismId,
    );
  };

  const getSelectedOrder = (asceticismId: number) => {
    const index = selectedAsceticisms.findIndex(
      (item) => item.asceticismId === asceticismId,
    );
    return index >= 0 ? index + 1 : null;
  };

  const handleToggleAsceticism = (asceticismId: number) => {
    if (isSelected(asceticismId)) {
      // Remove from selection
      setSelectedAsceticisms(
        selectedAsceticisms.filter(
          (item) => item.asceticismId !== asceticismId,
        ),
      );
    } else {
      // Add to selection
      setSelectedAsceticisms([
        ...selectedAsceticisms,
        {
          asceticismId,
          order: selectedAsceticisms.length,
        },
      ]);
    }
  };

  const handleMoveUp = (asceticismId: number) => {
    const currentIndex = selectedAsceticisms.findIndex(
      (item) => item.asceticismId === asceticismId,
    );
    if (currentIndex <= 0) return;

    const newItems = [...selectedAsceticisms];
    [newItems[currentIndex - 1], newItems[currentIndex]] = [
      newItems[currentIndex],
      newItems[currentIndex - 1],
    ];
    newItems.forEach((item, idx) => {
      item.order = idx;
    });
    setSelectedAsceticisms(newItems);
  };

  const handleMoveDown = (asceticismId: number) => {
    const currentIndex = selectedAsceticisms.findIndex(
      (item) => item.asceticismId === asceticismId,
    );
    if (currentIndex === -1 || currentIndex === selectedAsceticisms.length - 1)
      return;

    const newItems = [...selectedAsceticisms];
    [newItems[currentIndex], newItems[currentIndex + 1]] = [
      newItems[currentIndex + 1],
      newItems[currentIndex],
    ];
    newItems.forEach((item, idx) => {
      item.order = idx;
    });
    setSelectedAsceticisms(newItems);
  };

  const handleSavePackage = async () => {
    if (!session?.user?.email) return;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (selectedAsceticisms.length === 0) {
      toast.error("Please add at least one asceticism");
      return;
    }

    try {
      const packageData: PackageCreate = {
        title: title.trim(),
        description: description.trim() || undefined,
        items: selectedAsceticisms,
      };

      if (editingPackage) {
        await updatePackageAction(
          editingPackage.id,
          packageData,
          session.user.email,
        );
        toast.success("Package updated successfully");
      } else {
        await createPackageAction(packageData, session.user.email);
        toast.success("Package created successfully");
      }

      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save package",
      );
      console.error(error);
    }
  };

  const filteredAsceticisms = availableAsceticisms.filter((asc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asc.title.toLowerCase().includes(query) ||
      asc.category.toLowerCase().includes(query) ||
      asc.description?.toLowerCase().includes(query)
    );
  });

  // Sort: selected items first (by order), then unselected items
  const sortedAsceticisms = [...filteredAsceticisms].sort((a, b) => {
    const aSelected = isSelected(a.id);
    const bSelected = isSelected(b.id);

    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    if (aSelected && bSelected) {
      const aOrder = getSelectedOrder(a.id) || 0;
      const bOrder = getSelectedOrder(b.id) || 0;
      return aOrder - bOrder;
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingPackage ? "Edit Package" : "Create Package"}
          </DialogTitle>
          <DialogDescription>
            Add a collection of asceticisms that users can add to their account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Beginner's Spiritual Journey"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this package includes..."
              rows={2}
            />
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label>
                Select Asceticisms * ({selectedAsceticisms.length} selected)
              </Label>
            </div>

            <Input
              placeholder="Search asceticisms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />

            <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-2">
              <div className="p-2 space-y-1">
                {sortedAsceticisms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No asceticisms found
                  </div>
                ) : (
                  sortedAsceticisms.map((asc) => {
                    const selected = isSelected(asc.id);
                    const order = getSelectedOrder(asc.id);

                    return (
                      <div
                        key={asc.id}
                        className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                          selected
                            ? "bg-primary/5 border-primary/20"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => handleToggleAsceticism(asc.id)}
                          className="mt-1"
                        />

                        {selected && (
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMoveUp(asc.id)}
                              disabled={order === 1}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMoveDown(asc.id)}
                              disabled={order === selectedAsceticisms.length}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {!selected && (
                          <div className="w-6 flex items-center justify-center">
                            <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {selected && (
                              <Badge variant="secondary" className="text-xs">
                                #{order}
                              </Badge>
                            )}
                            <span className="font-medium truncate">
                              {asc.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {asc.category}
                            </Badge>
                            {asc.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                {asc.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSavePackage}>
            {editingPackage ? "Update Package" : "Create Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
