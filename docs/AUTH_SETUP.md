# Authentication Setup Guide

This document explains how JWT-based authentication is configured in Project Desert.

## Overview

The application uses **JWT tokens** from NextAuth.js for secure API authentication. This ensures that only authenticated users with valid session tokens can access protected API endpoints.

## Architecture

```
Frontend (Next.js + NextAuth)
    ↓ (JWT Token in Authorization header)
Backend (FastAPI)
    ↓ (Verify JWT token)
Database (PostgreSQL)
```

## Setup Instructions

### 1. Environment Variables

Add the following to both your **frontend** and **backend** `.env` files:

#### Frontend `.env`
```bash
# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Database
DATABASE_HOST="localhost"
DATABASE_USER="postgres"
DATABASE_PASSWORD="your-password"
DATABASE_NAME="project_desert"

# API URL
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

#### Backend `.env`
```bash
# Database
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/project_desert"

# NextAuth Secret (MUST match frontend)
NEXTAUTH_SECRET="your-secret-key-here"  # Same as frontend!
```

> ⚠️ **CRITICAL**: The `NEXTAUTH_SECRET` must be **identical** in both frontend and backend for JWT verification to work.

### 2. Install Backend Dependencies

```bash
cd api
pip install -r requirements.txt
```

This installs:
- `PyJWT[crypto]` - JWT token verification
- `cryptography` - Cryptographic functions for JWT

### 3. Start the Services

```bash
# Terminal 1: Start Backend
cd api
uvicorn app.main:app --reload

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## How It Works

### Frontend (Next.js)

1. **User logs in** via Google OAuth using NextAuth
2. **NextAuth creates a JWT token** containing user info (email, id, role)
3. **Token is stored** in an HTTP-only cookie
4. **API requests** include the token in the `Authorization` header:
   ```typescript
   Authorization: Bearer <jwt-token>
   ```

#### Example Usage in Frontend

```typescript
import { createAuthClient } from "@/lib/apiClient";

// In a component or API route
const authClient = await createAuthClient();
const { data, error } = await authClient.GET("/admin/users");
```

The `createAuthClient()` function automatically:
- Retrieves the JWT token from cookies
- Adds it to the `Authorization` header
- Returns a typed API client

### Backend (FastAPI)

1. **Receives request** with `Authorization: Bearer <token>` header
2. **Extracts and verifies JWT** using `NEXTAUTH_SECRET`
3. **Decodes user email** from token payload
4. **Fetches user** from database
5. **Checks authorization** (role, ban status)
6. **Allows or denies** access

#### Example Usage in Backend

```python
from fastapi import Depends
from app.core.auth import get_current_user, require_admin
from app.models import User

# Any authenticated user
@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {"user": current_user}

# Admin only
@router.get("/admin/users")
async def get_users(admin: User = Depends(require_admin)):
    # admin is guaranteed to have UserRole.ADMIN
    return {"users": [...]}
```

## Authentication Functions

### `get_current_user()`
- Verifies JWT token
- Fetches user from database
- Checks if user is banned
- Returns authenticated `User` object
- Raises `401` if not authenticated
- Raises `403` if banned

### `require_admin()`
- Calls `get_current_user()` first
- Additionally checks if user role is `ADMIN`
- Raises `403` if not admin

### `require_moderator()`
- Calls `get_current_user()` first
- Checks if user role is `MODERATOR` or `ADMIN`
- Raises `403` if insufficient permissions

## Security Features

✅ **JWT tokens are cryptographically signed** - cannot be forged  
✅ **Tokens expire** - limited lifetime reduces risk  
✅ **HTTP-only cookies** - not accessible to JavaScript  
✅ **User ban checks** - banned users are immediately blocked  
✅ **Role-based access control** - admin/moderator/user levels  
✅ **CORS configured** - only allowed origins can make requests  

## Testing Authentication

### Test with curl

```bash
# 1. Get a JWT token from your browser's cookies
# In browser DevTools → Application → Cookies → localhost:3000
# Copy the value of "next-auth.session-token"

# 2. Make an authenticated request
curl -H "Authorization: Bearer <your-token>" \
     http://localhost:8000/admin/users
```

### Test in Frontend

```typescript
// This should work when logged in
const authClient = await createAuthClient();
const { data, error } = await authClient.GET("/admin/users");

if (error) {
  console.error("Not authorized:", error);
} else {
  console.log("Users:", data);
}
```

## Troubleshooting

### "Invalid token" error
- Verify `NEXTAUTH_SECRET` matches in frontend and backend
- Check that token hasn't expired
- Ensure token format is `Bearer <token>`

### "User not found" error
- User exists in NextAuth tables but not synced to User table
- Check database for user with that email

### "User is banned" error
- User's `isBanned` field is `true`
- Admin must unban the user

### CORS errors
- Add your frontend URL to `origins` in [main.py](../api/app/main.py)
- Default: `http://localhost:3000`

## Migration from Old System

The old system used an insecure `x-user-email` header that could be forged. The new JWT system:

- **Before**: Client sends `x-user-email: user@example.com`
- **After**: Client sends `Authorization: Bearer <signed-jwt-token>`

All routes have been updated to use the new authentication system. No manual migration is needed for existing users.

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
