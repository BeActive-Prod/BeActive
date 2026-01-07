# Authentication & User Management Implementation Guide

## What's Been Implemented

### 1. **Database Schema Updates**
- Added `users` table with columns: `id`, `username`, `password`, `is_admin`, `created_at`, `updated_at`
- Added `user_id` and `is_public` columns to `lists` table
- Migration system automatically applies these changes

### 2. **Backend Authentication (server/)

#### New Files:
- **server/auth.ts** - JWT token generation, password hashing with bcrypt
- **server/middleware.ts** - Authentication and admin authorization middleware

#### New API Endpoints:

**Public Endpoints:**
- `GET /api/auth/admin-exists` - Check if admin user has been created
- `POST /api/auth/setup` - Create the first admin user
- `POST /api/auth/login` - User login

**Protected Endpoints:**
- `GET /api/auth/verify` - Verify current JWT token

**Admin-Only Endpoints:**
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PATCH /api/users/:userId/admin` - Toggle admin status
- `DELETE /api/users/:userId` - Delete user account

### 3. **Frontend Authentication (src/)

#### New Files:
- **src/contexts/AuthContext.tsx** - React context for authentication state management
- **src/app/login/page.tsx** - Login/Setup page
- **src/app/users/page.tsx** - User management admin panel
- **src/app/share/page.tsx** - Public shared list page (read-only)
- **src/components/ProtectedRoute.tsx** - Route protection component
- **.env.local** - Environment configuration

#### Updated Files:
- **src/app/layout.tsx** - Added AuthProvider and ProtectedRoute wrapper
- **src/app/page.tsx** - Added user info display and logout button, link to users panel
- **src/components/TodoList.tsx** - Added read-only mode support
- **src/components/TodoItem.tsx** - Added read-only mode support
- **src/types/index.ts** - Added User and AuthContextType interfaces

### 4. **Key Features**

#### First-Time Setup
- App automatically detects if no admin exists
- First user to register becomes the admin
- All subsequent users are created by admin

#### User Authentication
- JWT-based authentication (7-day expiry)
- Passwords hashed with bcrypt (10 salt rounds)
- Tokens stored in localStorage
- Automatic session persistence

#### Admin Panel
- View all users
- Create new users
- Toggle user admin status
- Delete user accounts
- Cannot modify own account

#### Data Isolation
- Each user has their own todo lists
- Users cannot see other users' todos
- Public shared links still work without login

#### Route Protection
- Login page redirects to home if already logged in
- Protected pages redirect to login if not authenticated
- Public routes: /login, /share
- Protected routes: /, /users (admin-only)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create or update `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Start the Application
```bash
npm run dev
```

This starts both:
- Next.js frontend on http://localhost:3000
- Express backend on http://localhost:3001

### 4. First Admin Setup
1. Open http://localhost:3000
2. You'll be redirected to /login
3. Fill in username and password for the first admin account
4. Click "Create Account"
5. You're now logged in!

### 5. Create Additional Users
1. Click "👥 Users" button in top-right
2. Click "Add New User"
3. Enter username and password
4. New user can now login with these credentials

## User Flows

### Admin User Flow
1. Admin logs in
2. Can see "👥 Users" button
3. Can create, promote, demote, or delete users
4. Has full todo management for own lists

### Regular User Flow
1. User logs in with credentials created by admin
2. Regular todo management
3. Cannot see "👥 Users" button
4. Cannot access admin panel
5. Can still share todo lists via public links

### Public Share Flow
1. Share link: `http://localhost:3000/share?list=LIST_ID`
2. Accessible without login
3. Read-only view of tasks
4. Cannot modify tasks

## Database Migrations

The migration system automatically:
1. Creates users table on first run
2. Adds user_id and is_public columns to lists
3. Tracks applied migrations to avoid re-running

View migration status:
- Check `migrations` table in SQLite
- Server logs show applied migrations on startup

## Security Considerations

### For Development
- Default JWT_SECRET is provided in .env.local
- Fine for local development

### For Production
1. **Change JWT_SECRET**
   ```
   JWT_SECRET=your-long-random-secret-key-min-32-chars
   ```

2. **Use HTTPS**
   - Never transmit tokens over HTTP in production
   - Configure reverse proxy (nginx) with SSL

3. **Environment Variables**
   - Store sensitive values in environment
   - Never commit .env.local to git

4. **Password Policy**
   - Consider adding minimum password requirements
   - Add password reset functionality (future enhancement)

5. **Token Expiry**
   - Currently set to 7 days
   - Configurable in server/auth.ts

## Troubleshooting

### "Admin already exists" on login
- Admin user has already been created
- This is expected behavior
- Log in with your admin credentials

### "Invalid username or password"
- Check spelling (case-sensitive)
- Verify credentials with admin
- Ask admin to reset your account

### Token expired
- Log out and log in again
- Tokens are valid for 7 days
- Consider implementing refresh tokens (future enhancement)

### Can't access Users panel
- Only admins can access this page
- Ask your admin to promote your account

### Shared list shows "not found"
- List ID might be incorrect
- List might have been deleted
- Owner might not have shared it publicly

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] User profiles
- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Permission-based access to shared lists
- [ ] User invitation system
- [ ] Activity history

## API Documentation

### Authentication Endpoints

#### Check Admin Exists
```
GET /api/auth/admin-exists

Response:
{
  "adminExists": false
}
```

#### Setup First Admin
```
POST /api/auth/setup
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "username": "admin",
    "isAdmin": true
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user_456",
    "username": "user@example.com",
    "isAdmin": false
  }
}
```

#### Verify Token
```
GET /api/auth/verify
Authorization: Bearer eyJhbGc...

Response:
{
  "user": {
    "userId": "user_123",
    "username": "admin",
    "isAdmin": true
  }
}
```

### User Management Endpoints (Admin Only)

#### Get All Users
```
GET /api/users
Authorization: Bearer eyJhbGc...

Response:
[
  {
    "id": "user_123",
    "username": "admin",
    "isAdmin": true,
    "createdAt": "2024-01-07T..."
  },
  {
    "id": "user_456",
    "username": "john",
    "isAdmin": false,
    "createdAt": "2024-01-08T..."
  }
]
```

#### Create User
```
POST /api/users
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123"
}

Response:
{
  "id": "user_789",
  "username": "newuser",
  "isAdmin": false
}
```

#### Toggle Admin Status
```
PATCH /api/users/:userId/admin
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "isAdmin": true
}

Response:
{
  "success": true
}
```

#### Delete User
```
DELETE /api/users/:userId
Authorization: Bearer eyJhbGc...

Response:
{
  "success": true
}
```

## File Structure

```
BeActive/
├── server/
│   ├── auth.ts (NEW)
│   ├── middleware.ts (NEW)
│   ├── migrations.ts (UPDATED)
│   ├── db.ts
│   └── index.ts (UPDATED)
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx (NEW)
│   │   ├── users/
│   │   │   └── page.tsx (NEW)
│   │   ├── share/
│   │   │   └── page.tsx (NEW)
│   │   ├── layout.tsx (UPDATED)
│   │   └── page.tsx (UPDATED)
│   ├── components/
│   │   ├── ProtectedRoute.tsx (NEW)
│   │   ├── TodoItem.tsx (UPDATED)
│   │   └── TodoList.tsx (UPDATED)
│   ├── contexts/
│   │   └── AuthContext.tsx (NEW)
│   ├── types/
│   │   └── index.ts (UPDATED)
│   └── hooks/
│       └── useSharedList.ts
├── .env.local (NEW)
├── package.json (UPDATED)
└── AUTHENTICATION.md (NEW)
```
