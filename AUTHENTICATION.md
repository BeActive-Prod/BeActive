# Authentication & User Management

## Overview

BeActive now includes a complete authentication system with user management and admin controls.

## Features

- **JWT-based Authentication**: Secure token-based authentication
- **User Accounts**: Each user has their own todo lists
- **Admin Panel**: Admins can manage users and permissions
- **First-time Setup**: Automatic setup wizard for the first admin user
- **Password Hashing**: Secure password storage using bcrypt

## Setup

### 1. First Admin User

When you first access the app, you'll be prompted to create an admin account. This first user will automatically be assigned admin privileges.

### 2. Creating Users

Admins can create new users from the User Management panel:

1. Click the **👥 Users** button in the top-right corner
2. Click **Add New User**
3. Enter username and password
4. Click **Create User**

### 3. Managing Permissions

From the User Management panel, admins can:

- **Make Admin**: Promote a user to admin
- **Remove Admin**: Demote an admin back to regular user
- **Delete User**: Remove a user account (their todos will be deleted)

## API Endpoints

### Authentication

- `POST /api/auth/admin-exists` - Check if admin user exists
- `POST /api/auth/setup` - Create first admin user
- `POST /api/auth/login` - Login with username and password
- `GET /api/auth/verify` - Verify current token

### User Management (Admin only)

- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PATCH /api/users/:userId/admin` - Toggle admin status
- `DELETE /api/users/:userId` - Delete user

## User Data Isolation

- Each user has their own separate todo lists
- Users can only see their own todos
- Admins cannot view or manage other users' todos
- Public shared links are still accessible without login

## Token Storage

The JWT token is stored in the browser's `localStorage` with the key `token`. The user information is stored with the key `user`.

## Security Notes

1. **Change JWT_SECRET**: Before deploying to production, change the `JWT_SECRET` environment variable
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiry**: Tokens expire after 7 days
4. **Password Hashing**: Passwords are hashed with bcrypt (10 salt rounds)

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Lists and Todos

Lists now have optional `user_id` and `is_public` fields:

```sql
ALTER TABLE lists ADD COLUMN user_id TEXT;
ALTER TABLE lists ADD COLUMN is_public BOOLEAN DEFAULT 0;
```

## Troubleshooting

### "Admin already exists" error

The admin user has already been created. Use the login page to log in.

### "Invalid username or password" error

Check that your username and password are correct. Passwords are case-sensitive.

### Token expired

You'll need to log in again. Tokens are valid for 7 days.

## Future Enhancements

- Password reset functionality
- Email verification
- User profiles
- More granular permissions
- Audit logging
