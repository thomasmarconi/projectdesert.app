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
import { Badge } from "@/components/ui/badge";
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
  browsePublishedPackagesAction,
  addPackageToAccountAction,
} from "@/lib/actions/packageActions";
import { PackageResponse } from "@/lib/services/packageService";
import { Package, Plus, Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export function BrowsePackagesPage() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState<PackageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] =
    useState<PackageResponse | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [addingPackage, setAddingPackage] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await browsePublishedPackagesAction();
      setPackages(data);
    } catch (error) {
      toast.error("Failed to load packages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (pkg: PackageResponse) => {
    setSelectedPackage(pkg);
    setDetailsDialogOpen(true);
  };

  const handleAddToAccount = async (pkg: PackageResponse) => {
    if (!session?.user?.email) {
      toast.error("Please sign in to add packages");
      return;
    }

    try {
      setAddingPackage(true);
      const result = await addPackageToAccountAction(
        pkg.id,
        session.user.email,
      );

      if (result.addedCount > 0) {
        toast.success(result.message, {
          description: `${result.addedCount} new asceticism(s) added${
            result.skippedCount > 0
              ? `, ${result.skippedCount} already in your account`
              : ""
          }`,
        });
      } else {
        toast.info(
          "All asceticisms from this package are already in your account",
        );
      }

      setDetailsDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add package to account";
      toast.error(message);
      console.error(error);
    } finally {
      setAddingPackage(false);
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
      <div>
        <h1 className="text-3xl font-bold">Browse Asceticism Packages</h1>
        <p className="text-muted-foreground">
          Discover curated collections of practices to add to your spiritual
          journey
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{pkg.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {pkg.description || "A curated collection of practices"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary">
                  {pkg.itemCount} practice{pkg.itemCount !== 1 ? "s" : ""}
                </Badge>

                <div className="mt-3 space-y-1">
                  {pkg.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-3 w-3 text-muted-foreground" />
                      <span>{item.asceticism.title}</span>
                    </div>
                  ))}
                  {pkg.itemCount > 4 && (
                    <div className="text-sm text-muted-foreground pl-5">
                      +{pkg.itemCount - 4} more
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleViewDetails(pkg)}
              >
                View Details
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleAddToAccount(pkg)}
                disabled={!session?.user?.email}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Account
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No packages available
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back later for curated collections of practices
            </p>
          </CardContent>
        </Card>
      )}

      {/* Package Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPackage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedPackage.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedPackage.description ||
                    "A curated collection of practices"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">
                    Included Practices ({selectedPackage.itemCount})
                  </h3>
                  <div className="space-y-3">
                    {selectedPackage.items.map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {item.asceticism.title}
                              </CardTitle>
                              {item.asceticism.description && (
                                <CardDescription className="mt-1">
                                  {item.asceticism.description}
                                </CardDescription>
                              )}
                            </div>
                            <Badge variant="outline">
                              {item.asceticism.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        {item.notes && (
                          <CardContent className="py-2 pt-0">
                            <p className="text-sm text-muted-foreground italic">
                              {item.notes}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleAddToAccount(selectedPackage)}
                  disabled={addingPackage || !session?.user?.email}
                >
                  {addingPackage ? (
                    <>
                      <Spinner className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add All to Account
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
