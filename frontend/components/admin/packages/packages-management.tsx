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
import { Badge } from "@/components/ui/badge";
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
  publishPackageAction,
  deletePackageAction,
} from "@/lib/actions/packageActions";
import { PackageResponse } from "@/lib/services/packageService";
import { Package, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import CreatePackageDialog from "./create-package-dialog";

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
    }
  }, [session, loadPackages]);

  const openCreateDialog = () => {
    setEditingPackage(null);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (pkg: PackageResponse) => {
    setEditingPackage(pkg);
    setCreateDialogOpen(true);
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
      loadPackages();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete package";
      toast.error(message);
      console.error(error);
    }
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

      <CreatePackageDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        editingPackage={editingPackage}
        onSuccess={loadPackages}
      />

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
