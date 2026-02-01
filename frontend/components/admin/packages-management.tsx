"use client";

import { useState, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import {
  getAllPackagesAdminAction,
  createPackageAction,
  updatePackageAction,
  publishPackageAction,
  deletePackageAction,
} from "@/lib/actions/packageActions";
import {
  PackageResponse,
  PackageItemInput,
  PackageCreate,
} from "@/lib/services/packageService";
import { getAsceticismsAction } from "@/lib/actions/asceticismActions";
import { Asceticism } from "@/lib/services/asceticismService";
import { Package, Plus, Edit, Trash2, Eye, EyeOff, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PackagesManagementPage() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState<PackageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageResponse | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null);

  // Form state
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

  const loadPackages = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      const data = await getAllPackagesAdminAction(session.user.email);
      setPackages(data);
    } catch (error) {
      toast.error("Failed to load packages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      loadPackages();
      // Only load asceticisms once or when session changes
      // loadAsceticisms is defined below, so we can't add it to deps easily without moving it
      // For now we'll leave it as is per user request scope, but ideally both should be moved up or into useEffect
    }
  }, [session, loadPackages]);

  // To fix the structure properly, I should move loadAsceticisms up as well or ignore linter if that was the plan.
  // But wait, the user's error says: "The 'loadPackages' function makes the dependencies of useEffect Hook (at line 100) change on every render."
  // So wrapping loadPackages is the directive.

  // NOTE: I will wrap it and proceed. I will leave useEffect body mostly but I might need to adjust if I want to be clean.
  // Actually, loadAsceticisms is called there.

  useEffect(() => {
    if (session?.user?.email) {
      loadPackages();
      loadAsceticisms();
    }
  }, [session, loadPackages]);

  useEffect(() => {
    if (session?.user?.email) {
      loadPackages();
      loadAsceticisms();
    }
  }, [session, loadPackages]);

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

  const openCreateDialog = () => {
    resetForm();
    setEditingPackage(null);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (pkg: PackageResponse) => {
    setTitle(pkg.title);
    setDescription(pkg.description || "");
    setSelectedAsceticisms(
      pkg.items.map((item) => ({
        asceticismId: item.asceticismId,
        order: item.order,
        notes: item.notes,
      })),
    );
    setEditingPackage(pkg);
    setCreateDialogOpen(true);
  };

  const handleAddAsceticism = () => {
    if (!selectedAsceticismId) return;

    const asceticismId = parseInt(selectedAsceticismId);

    // Check if already added
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
    // Update order values
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
    // Update order values
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

      setCreateDialogOpen(false);
      resetForm();
      loadPackages();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save package",
      );
      console.error(error);
    }
  };

  const handleTogglePublish = async (pkg: PackageResponse) => {
    if (!session?.user?.email) return;

    try {
      const result = await publishPackageAction(pkg.id, session.user.email);
      toast.success(
        result.isPublished
          ? "Package published successfully"
          : "Package unpublished successfully",
      );
      loadPackages();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to toggle publish status",
      );
      console.error(error);
    }
  };

  const handleDeletePackage = async () => {
    if (!session?.user?.email || !packageToDelete) return;

    try {
      await deletePackageAction(packageToDelete, session.user.email);
      toast.success("Package deleted successfully");
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete package";
      toast.error(message);
      console.error(error);
    }
  };

  const getAsceticismById = (id: number) => {
    return availableAsceticisms.find((a) => a.id === id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asceticism Packages</h1>
          <p className="text-muted-foreground">
            Create and manage packages of asceticisms for users to browse and
            add
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Package
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <CardTitle className="text-lg">{pkg.title}</CardTitle>
                </div>
                {pkg.isPublished ? (
                  <Badge variant="default">Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              <CardDescription>
                {pkg.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {pkg.itemCount} asceticism{pkg.itemCount !== 1 ? "s" : ""}
              </div>
              <div className="mt-2 space-y-1">
                {pkg.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-sm">
                    • {item.asceticism.title}
                  </div>
                ))}
                {pkg.itemCount > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{pkg.itemCount - 3} more
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTogglePublish(pkg)}
              >
                {pkg.isPublished ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(pkg)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPackageToDelete(pkg.id);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No packages yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first package to get started
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Package
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Edit Package" : "Create Package"}
            </DialogTitle>
            <DialogDescription>
              Add a collection of asceticisms that users can add to their
              account
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
                <Label>
                  Selected Asceticisms ({selectedAsceticisms.length})
                </Label>
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
                setCreateDialogOpen(false);
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              package.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePackage}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
