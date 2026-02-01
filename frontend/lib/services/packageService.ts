import { getApiClient } from "@/lib/apiClient";
import type { components } from "@/types/api";

// Export API response types from OpenAPI schema
export type PackageResponse = components["schemas"]["PackageResponse"];
export type PackageCreate = components["schemas"]["PackageCreate"];
export type PackageUpdate = components["schemas"]["PackageUpdate"];
export type PackageItemInput = components["schemas"]["PackageItemInput"];
export type PackageItemResponse = components["schemas"]["PackageItemResponse"];
export type AsceticismInfo = components["schemas"]["AsceticismInfo"];

// Helper to extract error message from API response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getErrorMessage(detail: any, defaultMsg: string): string {
  if (!detail) return defaultMsg;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return detail.map((e: any) => e.msg).join(", ");
  }
  return defaultMsg;
}

// Admin functions
export async function createPackage(
  packageData: PackageCreate,
  userEmail: string,
): Promise<PackageResponse> {
  const client = await getApiClient(userEmail);

  const { data, error } = await client.POST("/packages/", {
    body: packageData,
  });

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to create package"));
  }

  return data!;
}

export async function getAllPackagesAdmin(
  userEmail: string,
): Promise<PackageResponse[]> {
  const client = await getApiClient(userEmail);

  const { data, error } = await client.GET("/packages/admin/all");

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to fetch packages"));
  }

  return data || [];
}

export async function updatePackage(
  packageId: number,
  packageData: PackageUpdate,
  userEmail: string,
): Promise<PackageResponse> {
  const client = await getApiClient(userEmail);

  const { data, error } = await client.PUT("/packages/{package_id}", {
    params: {
      path: {
        package_id: packageId,
      },
    },
    body: packageData,
  });

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to update package"));
  }

  return data!;
}

export async function publishPackage(
  packageId: number,
  userEmail: string,
): Promise<PackageResponse> {
  const client = await getApiClient(userEmail);

  const { data, error } = await client.POST("/packages/{package_id}/publish", {
    params: {
      path: {
        package_id: packageId,
      },
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to publish package"));
  }

  return data as unknown as PackageResponse;
}

export async function deletePackage(
  packageId: number,
  userEmail: string,
): Promise<{ success: boolean }> {
  const client = await getApiClient(userEmail);

  const { error } = await client.DELETE("/packages/{package_id}", {
    params: {
      path: {
        package_id: packageId,
      },
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to delete package"));
  }

  return { success: true };
}

// User functions
export async function browsePublishedPackages(): Promise<PackageResponse[]> {
  const client = await getApiClient();
  const { data, error } = await client.GET("/packages/browse");

  if (error) {
    throw new Error("Failed to fetch packages");
  }

  return data || [];
}

export async function getPackageDetails(
  packageId: number,
): Promise<PackageResponse> {
  const client = await getApiClient();
  const { data, error } = await client.GET("/packages/{package_id}", {
    params: {
      path: {
        package_id: packageId,
      },
    },
  });

  if (error) {
    throw new Error(
      getErrorMessage(error.detail, "Failed to fetch package details"),
    );
  }

  return data!;
}

export async function addPackageToAccount(
  packageId: number,
  userEmail: string,
): Promise<{
  success: boolean;
  message: string;
  addedCount: number;
  skippedCount: number;
  totalInPackage: number;
}> {
  const client = await getApiClient(userEmail);

  const { data, error } = await client.POST(
    "/packages/{package_id}/add-to-account",
    {
      params: {
        path: {
          package_id: packageId,
        },
      },
    },
  );

  if (error) {
    throw new Error(
      getErrorMessage(error.detail, "Failed to add package to account"),
    );
  }

  return data as unknown as {
    success: boolean;
    message: string;
    addedCount: number;
    skippedCount: number;
    totalInPackage: number;
  };
}
