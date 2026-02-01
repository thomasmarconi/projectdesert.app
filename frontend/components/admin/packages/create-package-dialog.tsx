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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, X } from "lucide-react";

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
  const [selectedAsceticismId, setSelectedAsceticismId] = useState<
    string | null
  >(null);

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
    setSelectedAsceticismId(null);
  };

  const handleAddAsceticism = () => {
    if (!selectedAsceticismId) return;

    const asceticismId = parseInt(selectedAsceticismId);

    if (
      selectedAsceticisms.some((item) => item.asceticismId === asceticismId)
    ) {
      toast.error("This asceticism is already in the package");
      return;
    }

    setSelectedAsceticisms([
      ...selectedAsceticisms,
      {
        asceticismId,
        order: selectedAsceticisms.length,
      },
    ]);
    setSelectedAsceticismId(null);
  };

  const handleRemoveAsceticism = (asceticismId: number) => {
    setSelectedAsceticisms(
      selectedAsceticisms.filter((item) => item.asceticismId !== asceticismId),
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...selectedAsceticisms];
    [newItems[index - 1], newItems[index]] = [
      newItems[index],
      newItems[index - 1],
    ];
    newItems.forEach((item, idx) => {
      item.order = idx;
    });
    setSelectedAsceticisms(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedAsceticisms.length - 1) return;
    const newItems = [...selectedAsceticisms];
    [newItems[index], newItems[index + 1]] = [
      newItems[index + 1],
      newItems[index],
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

  const getAsceticismById = (id: number) => {
    return availableAsceticisms.find((a) => a.id === id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPackage ? "Edit Package" : "Create Package"}
          </DialogTitle>
          <DialogDescription>
            Add a collection of asceticisms that users can add to their account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              rows={3}
            />
          </div>

          <div>
            <Label>Add Asceticisms *</Label>
            <div className="flex gap-2 mt-2">
              <Select
                value={selectedAsceticismId || undefined}
                onValueChange={setSelectedAsceticismId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an asceticism" />
                </SelectTrigger>
                <SelectContent>
                  {availableAsceticisms.map((asc) => (
                    <SelectItem key={asc.id} value={asc.id.toString()}>
                      {asc.title} ({asc.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAddAsceticism}
                disabled={!selectedAsceticismId}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedAsceticisms.length > 0 && (
            <div>
              <Label>Selected Asceticisms ({selectedAsceticisms.length})</Label>
              <div className="mt-2 space-y-2">
                {selectedAsceticisms.map((item, index) => {
                  const asc = getAsceticismById(item.asceticismId);
                  return (
                    <div
                      key={item.asceticismId}
                      className="flex items-center gap-2 p-2 border rounded"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="h-6 px-2"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedAsceticisms.length - 1}
                          className="h-6 px-2"
                        >
                          ↓
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{asc?.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {asc?.category}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveAsceticism(item.asceticismId)
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
