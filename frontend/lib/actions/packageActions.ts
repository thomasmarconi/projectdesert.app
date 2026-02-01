"use server";

import {
  createPackage,
  getAllPackagesAdmin,
  updatePackage,
  publishPackage,
  deletePackage,
  browsePublishedPackages,
  getPackageDetails,
  addPackageToAccount,
  type PackageResponse,
  type PackageCreate,
  type PackageUpdate,
} from "@/lib/services/packageService";

export async function createPackageAction(
  packageData: PackageCreate,
  userEmail: string,
): Promise<PackageResponse> {
  return createPackage(packageData, userEmail);
}

export async function getAllPackagesAdminAction(
  userEmail: string,
): Promise<PackageResponse[]> {
  return getAllPackagesAdmin(userEmail);
}

export async function updatePackageAction(
  packageId: number,
  packageData: PackageUpdate,
  userEmail: string,
): Promise<PackageResponse> {
  return updatePackage(packageId, packageData, userEmail);
}

export async function publishPackageAction(
  packageId: number,
  userEmail: string,
): Promise<PackageResponse> {
  return publishPackage(packageId, userEmail);
}

export async function deletePackageAction(
  packageId: number,
  userEmail: string,
): Promise<{ success: boolean }> {
  return deletePackage(packageId, userEmail);
}

export async function browsePublishedPackagesAction(): Promise<
  PackageResponse[]
> {
  return browsePublishedPackages();
}

export async function getPackageDetailsAction(
  packageId: number,
): Promise<PackageResponse> {
  return getPackageDetails(packageId);
}

export async function addPackageToAccountAction(
  packageId: number,
  userEmail: string,
): Promise<{
  success: boolean;
  message: string;
  addedCount: number;
  skippedCount: number;
  totalInPackage: number;
}> {
  return addPackageToAccount(packageId, userEmail);
}
