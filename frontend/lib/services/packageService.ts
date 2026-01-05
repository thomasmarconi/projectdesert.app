const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PackageItemInput {
  asceticismId: number;
  order?: number;
  notes?: string;
}

export interface PackageCreate {
  title: string;
  description?: string;
  metadata?: any;
  items: PackageItemInput[];
}

export interface PackageUpdate {
  title?: string;
  description?: string;
  metadata?: any;
  items?: PackageItemInput[];
}

export interface AsceticismInfo {
  id: number;
  title: string;
  description?: string;
  category: string;
  icon?: string;
  type: string;
}

export interface PackageItemResponse {
  id: number;
  asceticismId: number;
  order: number;
  notes?: string;
  asceticism: AsceticismInfo;
}

export interface PackageResponse {
  id: number;
  title: string;
  description?: string;
  creatorId: number;
  isPublished: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  items: PackageItemResponse[];
  itemCount: number;
}

// Admin functions
export async function createPackage(
  packageData: PackageCreate,
  userEmail: string
): Promise<PackageResponse> {
  const response = await fetch(`${API_URL}/packages/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": userEmail,
    },
    body: JSON.stringify(packageData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create package");
  }

  return response.json();
}

export async function getAllPackagesAdmin(
  userEmail: string
): Promise<PackageResponse[]> {
  const response = await fetch(`${API_URL}/packages/admin/all`, {
    headers: {
      "X-User-Email": userEmail,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch packages");
  }

  return response.json();
}

export async function updatePackage(
  packageId: number,
  packageData: PackageUpdate,
  userEmail: string
): Promise<PackageResponse> {
  const response = await fetch(`${API_URL}/packages/${packageId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": userEmail,
    },
    body: JSON.stringify(packageData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update package");
  }

  return response.json();
}

export async function publishPackage(
  packageId: number,
  userEmail: string
): Promise<{ success: boolean; isPublished: boolean }> {
  const response = await fetch(`${API_URL}/packages/${packageId}/publish`, {
    method: "POST",
    headers: {
      "X-User-Email": userEmail,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to publish package");
  }

  return response.json();
}

export async function deletePackage(
  packageId: number,
  userEmail: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/packages/${packageId}`, {
    method: "DELETE",
    headers: {
      "X-User-Email": userEmail,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete package");
  }

  return response.json();
}

// User functions
export async function browsePublishedPackages(): Promise<PackageResponse[]> {
  const response = await fetch(`${API_URL}/packages/browse`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch packages");
  }

  return response.json();
}

export async function getPackageDetails(
  packageId: number
): Promise<PackageResponse> {
  const response = await fetch(`${API_URL}/packages/${packageId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch package details");
  }

  return response.json();
}

export async function addPackageToAccount(
  packageId: number,
  userEmail: string
): Promise<{
  success: boolean;
  message: string;
  addedCount: number;
  skippedCount: number;
  totalInPackage: number;
}> {
  const response = await fetch(
    `${API_URL}/packages/${packageId}/add-to-account`,
    {
      method: "POST",
      headers: {
        "X-User-Email": userEmail,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to add package to account");
  }

  return response.json();
}
