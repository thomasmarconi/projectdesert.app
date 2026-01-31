# Quick Reference: Using the Typed API Client

## Import the Client

```typescript
import { client, getApiClient } from "@/lib/apiClient";
import type { components } from "@/types/api";
```

## Basic GET Request

```typescript
const { data, error } = await client.GET("/asceticisms/");

if (error) {
  console.error("Error:", error.detail);
  return;
}

// data is fully typed based on OpenAPI schema
console.log(data); // Asceticism[]
```

## GET with Query Parameters

```typescript
const { data, error } = await client.GET("/asceticisms/", {
  params: {
    query: {
      category: "prayer",
    },
  },
});
```

## GET with Path Parameters

```typescript
const { data, error } = await client.GET("/packages/{package_id}", {
  params: {
    path: {
      package_id: 123,
    },
  },
});
```

## POST Request

```typescript
const { data, error } = await client.POST("/asceticisms/join", {
  body: {
    userId: 1,
    asceticismId: 5,
    targetValue: 10,
  },
});
```

## Authenticated Requests

```typescript
// Create an authenticated client
const authClient = await getApiClient(userEmail);

// Use it for admin endpoints
const { data, error } = await authClient.GET("/admin/users");
```

## Using Types

```typescript
// Import component schemas
import type { components } from "@/types/api";

// Use them in your code
type UserResponse = components["schemas"]["UserResponse"];
type AsceticismCreate = components["schemas"]["AsceticismCreate"];

function processUser(user: UserResponse) {
  console.log(user.email); // Fully typed!
}
```

## Using Enums

```typescript
import { UserRole, TrackingType, AsceticismStatus } from "@/types/enums";

const role: UserRole = UserRole.ADMIN;
const type: TrackingType = TrackingType.BOOLEAN;
const status: AsceticismStatus = AsceticismStatus.ACTIVE;
```

## Error Handling

```typescript
const { data, error, response } = await client.GET("/asceticisms/");

if (error) {
  // error.detail contains the error message from the backend
  console.error("API Error:", error.detail);
  
  // response contains the full HTTP response
  console.error("Status:", response.status);
  
  throw new Error(error.detail || "Unknown error");
}

// data is guaranteed to be non-null here
return data;
```

## Common Patterns

### Server Actions (Next.js)

```typescript
"use server";

import { getApiClient } from "@/lib/apiClient";

export async function myServerAction() {
  const client = await getApiClient();
  
  const { data, error } = await client.POST("/some-endpoint", {
    body: { /* ... */ },
  });
  
  if (error) {
    throw new Error(error.detail);
  }
  
  return data;
}
```

### Client Components (React)

```typescript
"use client";

import { client } from "@/lib/apiClient";
import { useEffect, useState } from "react";

export function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      const { data, error } = await client.GET("/asceticisms/");
      if (!error) {
        setData(data);
      }
    }
    fetchData();
  }, []);
  
  return <div>{/* render data */}</div>;
}
```

### With React Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/apiClient";

export function useAsceticisms(category?: string) {
  return useQuery({
    queryKey: ["asceticisms", category],
    queryFn: async () => {
      const { data, error } = await client.GET("/asceticisms/", {
        params: category ? { query: { category } } : undefined,
      });
      
      if (error) {
        throw new Error(error.detail);
      }
      
      return data;
    },
  });
}
```

## Regenerating Types

When the backend API changes:

```bash
npm run generate:types
```

Or manually:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o types/api.ts
```

## Best Practices

1. ✅ Always use the typed client instead of raw `fetch`
2. ✅ Check both `data` and `error` in responses
3. ✅ Use `await getApiClient()` for authenticated endpoints (handles auth automatically)
4. ✅ Regenerate types after backend changes
5. ✅ Use type imports (`import type`) for type-only imports
6. ❌ Avoid `any` - the types are already generated
7. ❌ Don't hardcode API URLs - use the client

## IDE Support

The typed client provides full IntelliSense support:

- Endpoint paths are auto-completed
- Parameters are type-checked
- Request bodies are validated
- Response types are inferred

Just start typing and your IDE will guide you!
