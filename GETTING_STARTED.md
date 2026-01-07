# BeActive - Getting Started with Authentication

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

### 3. Create First Admin Account
1. Open http://localhost:3000 in your browser
2. You'll see the setup page
3. Enter desired username and password
4. Click "Create Account"
5. You're now logged in as admin!

## What's New

### Authentication System ✅
- JWT-based login/logout
- Secure password hashing with bcrypt
- Automatic session persistence
- Token expiry after 7 days

### User Management ✅
- Admin panel to manage users
- Create new user accounts
- Promote/demote users to/from admin
- Delete user accounts

### Data Isolation ✅
- Each user has separate todo lists
- Users can only see their own tasks
- Public shared links still work (read-only)

### Route Protection ✅
- Automatic redirect to login if not authenticated
- Automatic redirect to home if already logged in
- Public pages: /login, /share
- Protected pages: /, /users (admin-only)

## User Roles

### Admin
- Can manage user accounts
- Can create/promote/demote/delete users
- Full todo management
- Access to "👥 Users" panel

### Regular User
- Can manage their own todos
- Cannot access admin features
- Can share their lists via public links

## Common Tasks

### Create a New User (as Admin)
1. Click "👥 Users" button (top-right)
2. Click "Add New User"
3. Enter username and password
4. Click "Create User"
5. Share credentials with the new user

### Promote User to Admin
1. Go to "👥 Users" panel
2. Find the user in the list
3. Click "Make Admin"
4. User now has admin privileges

### Share Your Todo List
1. Click "Share" button in the app
2. Copy the share link
3. Send to anyone (they don't need to log in)
4. Shared list is read-only

### Logout
1. Click "Logout" button (top-right)
2. You'll be redirected to login page

## Environment Configuration

The `.env.local` file is already created with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key-change-in-production
```

**For Production:**
- Change `JWT_SECRET` to a long random string
- Update `NEXT_PUBLIC_API_URL` to your production domain
- Use HTTPS

## Database

- **Location**: `./data/beactive.db` (SQLite)
- **Tables**: 
  - `users` - User accounts and admin status
  - `lists` - Todo lists (now with user_id)
  - `todos` - Individual tasks
  - `migrations` - Migration tracking

Database is automatically created on first run with all necessary tables.

## Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Frontend (port 3000)
lsof -i :3000
# Backend (port 3001)
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### Token expired
- Just log out and log back in
- Fresh token valid for 7 days

### Cannot see Users panel
- Check that you're logged in as admin
- Only admins see the Users button

## API Reference

### Authentication
- `POST /api/auth/setup` - Create first admin
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/admin-exists` - Check if setup needed

### User Management (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PATCH /api/users/:userId/admin` - Toggle admin
- `DELETE /api/users/:userId` - Delete user

### Todos (Unchanged)
- `GET /api/lists/:id` - Get list with todos
- `POST /api/lists/:listId/todos` - Add todo
- `PATCH /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

All requests except setup/login/admin-exists need:
```
Authorization: Bearer <token>
```

## Next Steps

1. ✅ Create your admin account
2. ✅ Create a few regular user accounts
3. ✅ Test logging in with different users
4. ✅ Try sharing a todo list
5. ✅ Promote a user to admin
6. 📱 Deploy to production

## Support

For detailed documentation, see:
- `AUTHENTICATION.md` - Authentication system details
- `IMPLEMENTATION_GUIDE.md` - Full implementation guide
