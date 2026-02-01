# Authentication Architecture

This document explains the complete authentication flow from frontend to backend, including how JWT tokens are created, transmitted, and verified.

---

## Table of Contents

1. [Overview](#overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Token Creation Flow](#token-creation-flow)
4. [Backend Authentication](#backend-authentication)
5. [Database Schema Integration](#database-schema-integration)
6. [Complete Request Flow](#complete-request-flow)

---

## Overview

Our authentication system uses:
- **NextAuth.js** for session management in the frontend
- **JWT (JSON Web Tokens)** for API authentication
- **FastAPI dependencies** for route protection
- **PostgreSQL** for user data storage

### Key Principle
**All API calls requiring authentication must go through Server Actions**, which run on the Next.js server where they can access the NextAuth session and create JWT tokens.

---

## Frontend Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                   │
│  - React Components                                          │
│  - React Query Hooks                                         │
│  - Cannot access NextAuth session                            │
│  - Cannot create JWT tokens                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   SERVER ACTIONS LAYER                       │
│  - Files marked "use server"                                 │
│  - Bridge between client and services                        │
│  - Callable from client components                           │
│  - Execute on Next.js server                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  - Business logic                                            │
│  - API client creation                                       │
│  - HTTP requests to backend                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND                            │
│  - Route handlers                                            │
│  - JWT verification                                          │
│  - Database operations                                       │
└─────────────────────────────────────────────────────────────┘
```

### File Organization

```
frontend/
├── components/              # Client components (browser)
│   ├── asceticisms/
│   │   └── asceticisms-page.tsx
│   ├── packages/
│   └── daily-readings/
│
├── hooks/                   # React Query hooks (browser)
│   └── use-asceticisms.ts
│
├── lib/
│   ├── actions/            # Server Actions (server-side)
│   │   ├── asceticismActions.ts
│   │   ├── packageActions.ts
│   │   └── dailyReadingsActions.ts
│   │
│   ├── services/           # API services (server-side)
│   │   ├── asceticismService.ts
│   │   ├── packageService.ts
│   │   ├── dailyReadingsService.ts
│   │   └── adminService.ts
│   │
│   └── apiClient.ts        # JWT creation & HTTP client
│
└── auth.ts                 # NextAuth configuration
```

---

## Token Creation Flow

### Step 1: Client Component Calls Server Action

**Example: Loading user's asceticisms**

```typescript
// hooks/use-asceticisms.ts (CLIENT-SIDE)
import { getUserAsceticismsAction } from "@/lib/actions/asceticismActions";

export function useUserAsceticisms(userId, startDate, endDate) {
  return useQuery({
    queryKey: ["asceticisms", userId, startDate, endDate],
    queryFn: () => getUserAsceticismsAction(userId, startDate, endDate),
    enabled: !!userId,
  });
}
```

### Step 2: Server Action Executes on Server

```typescript
// lib/actions/asceticismActions.ts (SERVER-SIDE)
"use server";

import { getUserAsceticisms } from "@/lib/services/asceticismService";

export async function getUserAsceticismsAction(
  userId: number,
  startDate?: string,
  endDate?: string,
  includeArchived: boolean = true
) {
  // This runs on the Next.js server
  return getUserAsceticisms(userId, startDate, endDate, includeArchived);
}
```

### Step 3: Service Function Gets API Client

```typescript
// lib/services/asceticismService.ts (SERVER-SIDE)
import { getApiClient } from "@/lib/apiClient";

export async function getUserAsceticisms(
  userId: number,
  startDate?: string,
  endDate?: string,
  includeArchived: boolean = true
) {
  // Get authenticated client (this is where JWT is created)
  const client = await getApiClient();
  
  const { data, error } = await client.GET("/asceticisms/my", {
    params: {
      query: { userId, startDate, endDate, includeArchived }
    }
  });

  if (error) throw new Error("Failed to fetch user asceticisms");
  return data || [];
}
```

### Step 4: API Client Creates JWT

```typescript
// lib/apiClient.ts (SERVER-SIDE ONLY)
import jwt from "jsonwebtoken";
import { auth } from "@/auth";

async function getJWTToken(userEmail?: string): Promise<string | null> {
  // Only runs on server (typeof window === "undefined")
  if (typeof window === "undefined") {
    // 1. Get NextAuth session
    const session = await auth();
    if (!session || !session.user) return null;

    // 2. Verify user email if provided
    if (userEmail && session.user.email !== userEmail) return null;

    // 3. Get shared secret
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("NEXTAUTH_SECRET is not set");
      return null;
    }

    // 4. Create JWT token for backend
    const token = jwt.sign(
      {
        email: session.user.email,
        id: session.user.id,
        role: session.user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      secret,
      { algorithm: "HS256" } // Same algorithm backend expects
    );

    return token;
  }
  
  return null; // Client-side returns null
}

export async function getApiClient(userEmail?: string) {
  const token = await getJWTToken(userEmail);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return createClient<paths>({
    baseUrl: API_URL,
    headers,
  });
}
```

### Why Two Tokens?

1. **NextAuth Session Token** (encrypted in HTTP-only cookie)
   - Created by NextAuth
   - Used for Next.js session management
   - Browser sends this automatically
   - Next.js decrypts it with `auth()`

2. **API JWT Token** (in Authorization header)
   - Created by us in `getApiClient()`
   - Used for backend API authentication
   - Sent explicitly in each API request
   - Backend verifies it with same secret

**Both use `NEXTAUTH_SECRET`** so the backend can verify tokens we create.

---

## Backend Authentication

### Directory Structure

```
api/
├── app/
│   ├── main.py              # FastAPI app
│   ├── core/
│   │   ├── auth.py          # Authentication utilities
│   │   ├── config.py        # Configuration
│   │   └── database.py      # Database connection
│   ├── models/
│   │   └── __init__.py      # SQLModel database models
│   └── schemas/
│       └── *.py             # Pydantic schemas for API
```

### Step 1: Request Arrives at Backend

```python
# api/app/api/routes/asceticisms.py
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.models import User

router = APIRouter()

@router.get("/asceticisms/my")
async def list_user_asceticisms(
    user_id: int = Query(..., alias="userId"),
    current_user: User = Depends(get_current_user),  # ← Auth dependency
    session: Session = Depends(get_session)
):
    """Get all asceticisms for a specific user."""
    
    # Check authorization: users can only view their own data
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot view another user's asceticisms")
    
    # Query database and return data
    statement = select(UserAsceticism).where(UserAsceticism.userId == user_id)
    user_asceticisms = session.exec(statement).all()
    return user_asceticisms
```

### Step 2: JWT Verification in Dependency

```python
# api/app/core/auth.py
import jwt
from fastapi import Header, HTTPException, Depends
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.config import settings
from app.models import User

def verify_jwt_token(token: str) -> dict:
    """
    Verify and decode a JWT token.
    
    Args:
        token: The JWT token string
        
    Returns:
        The decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Decode using same secret and algorithm as frontend
        payload = jwt.decode(
            token,
            settings.NEXTAUTH_SECRET,  # Same secret as frontend!
            algorithms=["HS256"],       # Same algorithm as frontend!
            options={"verify_exp": True}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_user(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    This is used as a FastAPI dependency to protect routes.
    
    Args:
        authorization: Bearer token from Authorization header
        session: Database session
        
    Returns:
        The authenticated User object
        
    Raises:
        HTTPException: If authentication fails
    """
    # 1. Check Authorization header exists
    if not authorization:
        raise HTTPException(
            status_code=401, 
            detail="Not authenticated: Authorization header missing"
        )

    # 2. Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>",
        )
    token = parts[1]

    # 3. Verify and decode token
    payload = verify_jwt_token(token)

    # 4. Get user email from token
    user_email = payload.get("email")
    if not user_email:
        raise HTTPException(status_code=401, detail="Token does not contain email")

    # 5. Look up user in database
    statement = select(User).where(User.email == user_email)
    user = session.exec(statement).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # 6. Check if user is banned
    if user.isBanned:
        raise HTTPException(status_code=403, detail="User is banned")

    # 7. Return user object (now available in route handler)
    return user
```

### Step 3: Admin-Only Routes

```python
# api/app/core/auth.py
async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that requires user to be an admin.
    Uses get_current_user, then checks role.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user


# Usage in routes
@router.post("/admin/users/ban")
async def ban_user(
    current_user: User = Depends(require_admin),  # ← Admin-only
    session: Session = Depends(get_session)
):
    """Only admins can ban users"""
    # ...
```

---

## Database Schema Integration

### Models vs Schemas

**Models** (`api/app/models/__init__.py`) - Database tables
- SQLModel classes
- Define table structure
- Used for database queries
- Include relationships

**Schemas** (`api/app/schemas/*.py`) - API data shapes
- Pydantic classes
- Define API request/response format
- Validation rules
- Type hints for TypeScript generation

### User Model (Database)

```python
# api/app/models/__init__.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum
from typing import Optional

class UserRole(str, Enum):
    """User role enumeration"""
    USER = "user"
    ADMIN = "admin"

class User(SQLModel, table=True):
    """User model - stored in database"""
    __tablename__ = "users"
    
    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Authentication fields
    email: str = Field(unique=True, index=True)
    emailVerified: Optional[datetime] = None
    
    # Profile fields
    name: Optional[str] = None
    image: Optional[str] = None
    
    # Authorization fields
    role: UserRole = Field(default=UserRole.USER)
    isBanned: bool = Field(default=False)
    
    # Timestamps
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user_asceticisms: list["UserAsceticism"] = Relationship(back_populates="user")
```

### User Schema (API)

```python
# api/app/schemas/admin.py
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserResponse(BaseModel):
    """Schema for user data in API responses"""
    id: int
    email: EmailStr
    name: str | None
    image: str | None
    role: str
    isBanned: bool
    createdAt: str
    updatedAt: str
    
    # Configuration
    class Config:
        from_attributes = True  # Allow creating from SQLModel objects
```

### How They Work Together

```python
# In a route handler
@router.get("/admin/users", response_model=list[UserResponse])
async def get_all_users(
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session)
):
    # 1. Query using Model (database operation)
    statement = select(User)
    users = session.exec(statement).all()
    
    # 2. FastAPI automatically converts Model → Schema
    #    Uses response_model to serialize User objects to UserResponse
    return users  # FastAPI handles the conversion
```

### Asceticism Example

```python
# api/app/models/__init__.py
class Asceticism(SQLModel, table=True):
    """Asceticism template or custom asceticism"""
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    type: TrackingType
    isTemplate: bool = Field(default=True)
    creatorId: Optional[int] = Field(default=None, foreign_key="users.id")
    
    # Relationships
    user_asceticisms: list["UserAsceticism"] = Relationship(back_populates="asceticism")
    creator: Optional["User"] = Relationship()


class UserAsceticism(SQLModel, table=True):
    """Link between user and asceticism - tracks commitment"""
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="users.id")
    asceticismId: int = Field(foreign_key="asceticisms.id")
    status: AsceticismStatus = Field(default=AsceticismStatus.ACTIVE)
    startDate: datetime
    endDate: Optional[datetime] = None
    
    # Relationships
    user: User = Relationship(back_populates="user_asceticisms")
    asceticism: Asceticism = Relationship(back_populates="user_asceticisms")
    logs: list["AsceticismLog"] = Relationship(back_populates="user_asceticism")
```

### Schema Definitions

```python
# api/app/schemas/asceticisms.py
class AsceticismResponse(BaseModel):
    """Schema for asceticism in API responses"""
    id: int
    title: str
    description: str | None
    category: str | None
    icon: str | None
    type: str
    isTemplate: bool
    creatorId: int | None
    createdAt: str
    updatedAt: str


class UserAsceticismWithDetails(BaseModel):
    """Schema for user asceticism with full details"""
    id: int
    userId: int
    asceticismId: int
    status: str
    startDate: str
    endDate: str | None
    targetValue: int | None
    
    # Nested data
    asceticism: AsceticismResponse
    logs: list[LogResponse]
```

---

## Complete Request Flow

Let's trace a complete request from click to response:

### Request: Load User's Asceticisms

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "My Commitments"                                 │
│    Component: AsceticismsPage                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. REACT QUERY HOOK (Client-side)                               │
│    File: hooks/use-asceticisms.ts                               │
│    Function: useUserAsceticisms(userId, startDate, endDate)     │
│    Calls: getUserAsceticismsAction(...)                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SERVER ACTION (Next.js Server)                               │
│    File: lib/actions/asceticismActions.ts                       │
│    Function: getUserAsceticismsAction(...)                      │
│    Calls: getUserAsceticisms(...) from service                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SERVICE FUNCTION (Next.js Server)                            │
│    File: lib/services/asceticismService.ts                      │
│    Function: getUserAsceticisms(...)                            │
│                                                                  │
│    Step 4a: Get API Client                                      │
│    const client = await getApiClient()                          │
│    ↓                                                             │
│    File: lib/apiClient.ts                                       │
│    - Calls auth() to get NextAuth session                       │
│    - Extracts user data (email, id, role)                       │
│    - Creates JWT with jwt.sign(payload, SECRET, {alg: HS256})   │
│    - Returns HTTP client with Authorization header              │
│                                                                  │
│    Step 4b: Make HTTP Request                                   │
│    client.GET("/asceticisms/my", {                              │
│      params: { query: { userId, startDate, endDate } }          │
│      headers: { Authorization: "Bearer eyJhbGc..." }            │
│    })                                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓ HTTP Request
┌─────────────────────────────────────────────────────────────────┐
│ 5. FASTAPI RECEIVES REQUEST                                     │
│    Endpoint: GET /asceticisms/my?userId=1&startDate=...        │
│    Header: Authorization: Bearer eyJhbGc...                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. AUTH DEPENDENCY RUNS (api/app/core/auth.py)                 │
│    Function: get_current_user(authorization, session)           │
│                                                                  │
│    Step 6a: Extract token from header                           │
│    parts = authorization.split() → ["Bearer", "eyJhbGc..."]     │
│    token = parts[1]                                             │
│                                                                  │
│    Step 6b: Verify JWT                                          │
│    payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=HS256)│
│    → { email: "user@example.com", id: 1, role: "user", ... }   │
│                                                                  │
│    Step 6c: Look up user in database                            │
│    SELECT * FROM users WHERE email = 'user@example.com'         │
│    user = User(id=1, email="...", role="user", ...)            │
│                                                                  │
│    Step 6d: Check if banned                                     │
│    if user.isBanned: raise HTTPException(403)                   │
│                                                                  │
│    Returns: User object                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. ROUTE HANDLER EXECUTES                                       │
│    File: api/app/api/routes/asceticisms.py                     │
│    Function: list_user_asceticisms(user_id, current_user, ...)  │
│                                                                  │
│    Step 7a: Authorization check                                 │
│    if current_user.id != user_id and not admin:                 │
│        raise HTTPException(403)                                 │
│                                                                  │
│    Step 7b: Query database                                      │
│    SELECT * FROM user_asceticisms                               │
│    WHERE user_id = 1 AND status = 'active'                      │
│    JOIN asceticisms ON ...                                      │
│    LEFT JOIN asceticism_logs ON ...                             │
│                                                                  │
│    Returns: List[UserAsceticism] (SQLModel objects)             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. FASTAPI SERIALIZATION                                        │
│    FastAPI converts SQLModel → Schema (Pydantic)                │
│    UserAsceticism models → UserAsceticismWithDetails schemas    │
│    Returns JSON response                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓ HTTP Response
┌─────────────────────────────────────────────────────────────────┐
│ 9. SERVICE RECEIVES RESPONSE                                    │
│    File: lib/services/asceticismService.ts                      │
│    const { data, error } = await client.GET(...)                │
│    return data || []                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. SERVER ACTION RETURNS TO CLIENT                             │
│     File: lib/actions/asceticismActions.ts                      │
│     return getUserAsceticisms(...)                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 11. REACT QUERY CACHES & RETURNS DATA                           │
│     File: hooks/use-asceticisms.ts                              │
│     Data stored in cache, component re-renders                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 12. UI DISPLAYS DATA                                            │
│     Component: AsceticismsPage                                  │
│     Renders list of user's asceticisms                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Frontend Security

1. **Never expose secrets in client code**
   - `NEXTAUTH_SECRET` only accessible server-side
   - JWT creation only in server functions

2. **HTTP-only cookies**
   - NextAuth session stored in HTTP-only cookie
   - JavaScript cannot access it

3. **Server Actions**
   - All sensitive operations must use `"use server"`
   - Ensures code runs on server, not browser

### Backend Security

1. **JWT Verification**
   - Every protected route verifies JWT signature
   - Checks token expiration
   - Validates token structure

2. **User Lookup**
   - JWT contains email, but we verify user exists in DB
   - Checks if user is banned

3. **Authorization Checks**
   - Routes check if user has permission
   - Users can only access their own data (unless admin)

4. **Database Constraints**
   - Foreign keys ensure referential integrity
   - Unique constraints prevent duplicates
   - Default values for security-sensitive fields

---

## Environment Variables

### Frontend (.env.local)

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Database (for NextAuth adapter)
DATABASE_HOST=localhost
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=your-db-name

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Auth (MUST match frontend!)
NEXTAUTH_SECRET=your-secret-key-here

```

**Critical**: `NEXTAUTH_SECRET` must be identical in both frontend and backend!

---

## Common Issues & Debugging

### Issue: "Authorization header missing"

**Cause**: Service function called from client-side code

**Solution**: Ensure all API calls go through Server Actions
```typescript
// ❌ WRONG - Called from client component
import { getUserAsceticisms } from "@/lib/services/asceticismService";

// ✅ CORRECT - Call Server Action instead
import { getUserAsceticismsAction } from "@/lib/actions/asceticismActions";
```

### Issue: "Token has expired"

**Cause**: JWT expired (24 hour expiration)

**Solution**: 
- User needs to refresh page (will create new JWT)
- Or adjust expiration in `apiClient.ts`

### Issue: "Invalid token"

**Cause**: `NEXTAUTH_SECRET` mismatch between frontend and backend

**Solution**:
- Verify both `.env.local` (frontend) and `.env` (backend) have same secret
- Restart both servers after changing secrets

### Issue: "User not found"

**Cause**: JWT contains email that doesn't exist in database

**Solution**:
- Check user is properly created during OAuth sign-in
- Verify NextAuth adapter is working correctly

---

## Testing Authentication

### Manual Testing

1. **Sign in via Google OAuth**
   - Click "Sign In" button
   - Complete Google authentication
   - Check you're redirected back

2. **Verify JWT creation**
   - Open browser DevTools → Network tab
   - Make an API call (e.g., load asceticisms)
   - Look for `Authorization: Bearer ...` header in request

3. **Test authorization**
   - Try accessing another user's data (should fail)
   - Try admin-only route as non-admin (should fail)

### Backend Testing

```python
# Test JWT verification directly
from app.core.auth import verify_jwt_token

token = "eyJhbGc..."
payload = verify_jwt_token(token)
print(payload)  # Should print user data
```

### Frontend Testing

```typescript
// Add logging in apiClient.ts
console.log("Session:", session ? "exists" : "null", session?.user?.email);
console.log("JWT token created successfully for", session.user.email);
console.log("Authorization header added to API client");
```

---

## Maintenance & Updates

### Adding New Protected Routes

1. **Backend**: Add dependency to route
   ```python
   @router.post("/new-endpoint")
   async def new_endpoint(
       current_user: User = Depends(get_current_user),  # Add this
       session: Session = Depends(get_session)
   ):
       # Route code
   ```

2. **Frontend**: Create service function
   ```typescript
   // lib/services/yourService.ts
   export async function newFunction() {
     const client = await getApiClient();
     return await client.POST("/new-endpoint");
   }
   ```

3. **Frontend**: Create server action
   ```typescript
   // lib/actions/yourActions.ts
   "use server";
   export async function newFunctionAction() {
     return newFunction();
   }
   ```

4. **Frontend**: Use in component
   ```typescript
   import { newFunctionAction } from "@/lib/actions/yourActions";
   // Call from component
   ```

### Rotating Secrets

1. Update `NEXTAUTH_SECRET` in both frontend and backend
2. Restart both servers
3. All users will need to sign in again

---

## Additional Resources

- [NextAuth.js Documentation](https://authjs.dev)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT.io](https://jwt.io) - JWT debugger
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)

---

## Summary

**Key Takeaways**:

1. ✅ All authenticated API calls must go through Server Actions
2. ✅ JWT tokens are created server-side using NextAuth session
3. ✅ Backend verifies JWT and looks up user in database
4. ✅ Models define database structure, Schemas define API format
5. ✅ `NEXTAUTH_SECRET` must match on frontend and backend

**Architecture Flow**:
```
Client Component → Server Action → Service → getApiClient → JWT Token → Backend API → Database
```
