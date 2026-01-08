import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import crypto from 'crypto';
import db, { initializeDatabase } from './db';
import { hashPassword, comparePassword, generateToken } from './auth';
import { authMiddleware, adminMiddleware } from './middleware';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Store connected clients per list
const listSubscribers = new Map<string, Set<any>>();

// WebSocket connection
wss.on('connection', (ws: any) => {
  let currentListId: string | null = null;

    // Handle errors gracefully
  ws.on('error', (error: any) => {
    console.error('WebSocket error:', error.code, error.message);
    // Don't rethrow - just log and continue
  });

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'subscribe') {
        currentListId = data.listId;
        if (currentListId && !listSubscribers.has(currentListId)) {
          listSubscribers.set(currentListId, new Set());
        }
        if (currentListId) {
          listSubscribers.get(currentListId)!.add(ws);
          ws.send(JSON.stringify({ type: 'subscribed', listId: currentListId }));
        }
      }
    } catch (e) {
      console.error('WebSocket error:', e);
    }
  });

  ws.on('close', () => {
    if (currentListId && listSubscribers.has(currentListId)) {
      listSubscribers.get(currentListId)!.delete(ws);
    }
  });
});

// Helper to broadcast changes
function broadcastToList(listId: string, message: any) {
  if (listSubscribers.has(listId)) {
    const subscribers = listSubscribers.get(listId)!;
    subscribers.forEach((client) => {
      if (client.readyState === 1) {
        // OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
}

// ==================== AUTHENTICATION ENDPOINTS ====================

// Check if admin exists
app.get('/api/auth/admin-exists', (req: any, res: any) => {
  try {
    const admin = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
    res.json({ adminExists: !!admin });
  } catch (e) {
    console.error('Admin check error:', e);
    // If table doesn't exist, return adminExists: false (no admin)
    res.json({ adminExists: false });
  }
});

// Setup - Create first admin user
app.post('/api/auth/setup', async (req: any, res: any) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if any admin exists
    const adminExists = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
    if (adminExists) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const userId = `user_${Date.now()}`;
    const stmt = db.prepare(
      'INSERT INTO users (id, username, password, is_admin) VALUES (?, ?, ?, ?)'
    );
    stmt.run(userId, username, hashedPassword, 1);

    // Generate token
    const token = generateToken({
      userId,
      username,
      isAdmin: true,
    });

    res.json({ token, user: { id: userId, username, isAdmin: true } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Login
app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin === 1,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1,
      },
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Verify token
app.get('/api/auth/verify', authMiddleware, (req: any, res: any) => {
  try {
    // Fetch current user data from database instead of trusting JWT
    const user = db.prepare('SELECT id, username, is_admin FROM users WHERE id = ?').get(req.user.userId) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user.id, username: user.username, isAdmin: user.is_admin === 1 } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Create invite link (admin only)
app.post('/api/invites', authMiddleware, adminMiddleware, (req: any, res: any) => {
  try {
    const { maxUses } = req.body;

    if (!maxUses || maxUses < 1) {
      return res.status(400).json({ error: 'Max uses must be at least 1' });
    }

    const inviteId = `invite_${Date.now()}`;
    const token = crypto.randomBytes(32).toString('hex');

    const stmt = db.prepare(
      'INSERT INTO invites (id, token, created_by, max_uses, current_uses) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(inviteId, token, req.user.userId, maxUses, 0);

    res.json({
      id: inviteId,
      token,
      maxUses,
      currentUses: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Get invites (admin only)
app.get('/api/invites', authMiddleware, adminMiddleware, (req: any, res: any) => {
  try {
    const invites = db.prepare(
      'SELECT id, token, max_uses, current_uses, created_at FROM invites WHERE created_by = ? ORDER BY created_at DESC'
    ).all(req.user.userId) as any[];

    res.json(
      invites.map((i) => ({
        id: i.id,
        token: i.token,
        maxUses: i.max_uses,
        currentUses: i.current_uses,
        createdAt: i.created_at,
        isActive: i.current_uses < i.max_uses,
      }))
    );
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Register with invite token
app.post('/api/auth/register', async (req: any, res: any) => {
  try {
    const { token, username, password } = req.body;

    if (!token || !username || !password) {
      return res.status(400).json({ error: 'Token, username, and password required' });
    }

    // Find invite
    const invite = db.prepare('SELECT * FROM invites WHERE token = ?').get(token) as any;
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite' });
    }

    // Check if invite still has uses
    if (invite.current_uses >= invite.max_uses) {
      return res.status(400).json({ error: 'This invite has reached its usage limit' });
    }

    // Check if username already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = `user_${Date.now()}`;
    db.prepare(
      'INSERT INTO users (id, username, password, is_admin) VALUES (?, ?, ?, ?)'
    ).run(userId, username, hashedPassword, 0);

    // Increment invite usage
    db.prepare('UPDATE invites SET current_uses = current_uses + 1 WHERE id = ?').run(invite.id);

    // Generate token
    const authToken = generateToken({
      userId,
      username,
      isAdmin: false,
    });

    res.status(201).json({
      token: authToken,
      user: {
        id: userId,
        username,
        isAdmin: false,
      },
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Delete invite (admin only)
app.delete('/api/invites/:inviteId', authMiddleware, adminMiddleware, (req: any, res: any) => {
  try {
    const { inviteId } = req.params;

    // Verify the invite belongs to the admin
    const invite = db.prepare('SELECT created_by FROM invites WHERE id = ?').get(inviteId) as any;
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Cannot delete another admin\'s invite' });
    }

    db.prepare('DELETE FROM invites WHERE id = ?').run(inviteId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Validate invite token (public endpoint)
app.get('/api/invites/validate/:token', (req: any, res: any) => {
  try {
    const { token } = req.params;

    const invite = db.prepare('SELECT id, token, max_uses, current_uses FROM invites WHERE token = ?').get(token) as any;
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or expired' });
    }

    if (invite.current_uses >= invite.max_uses) {
      return res.status(400).json({ error: 'This invite has reached its usage limit' });
    }

    res.json({ valid: true, maxUses: invite.max_uses, currentUses: invite.current_uses });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Get all users (admin only)
app.get('/api/users', authMiddleware, adminMiddleware, (req: any, res: any) => {
  try {
    const users = db.prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY created_at ASC').all() as any[];
    res.json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
        isAdmin: u.is_admin === 1,
        createdAt: u.created_at,
      }))
    );
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Create user (admin only)
app.post('/api/users', authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if username exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = `user_${Date.now()}`;
    const stmt = db.prepare(
      'INSERT INTO users (id, username, password, is_admin) VALUES (?, ?, ?, ?)'
    );
    stmt.run(userId, username, hashedPassword, 0);

    res.status(201).json({
      id: userId,
      username,
      isAdmin: false,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Update user admin status (admin only)
app.patch('/api/users/:userId/admin', authMiddleware, adminMiddleware, (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot change your own admin status' });
    }

    const stmt = db.prepare('UPDATE users SET is_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(isAdmin ? 1 : 0, userId);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Delete user (admin only)
app.delete('/api/users/:userId', authMiddleware, adminMiddleware, (req: any, res: any) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user and their lists/todos
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ==================== TEST & TODO/LIST ENDPOINTS ====================

// Test API endpoint
app.get('/api/test', (req: any, res: any) => {
   res.json({ message: 'API test successful', timestamp: new Date().toISOString() });
 });

// Create or get list
app.post('/api/lists', (req: any, res: any) => {
  const { id, name } = req.body;
  try {
    const listId = id || `list_${Date.now()}`;
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO lists (id, name) VALUES (?, ?)'
    );
    stmt.run(listId, name || 'My Tasks');
    res.json({ id: listId });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Get list with todos
app.get('/api/lists/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const list = db
      .prepare('SELECT * FROM lists WHERE id = ?')
      .get(id) as any;
    if (!list) return res.status(404).json({ error: 'List not found' });

    const todos = (db
      .prepare('SELECT * FROM todos WHERE list_id = ? ORDER BY deadline_hour, deadline_minute ASC')
      .all(id) as any[]).map((todo) => ({
        id: todo.id,
        title: todo.title,
        deadlineHour: todo.deadline_hour,
        deadlineMinute: todo.deadline_minute,
        completed: todo.completed === 1,
        completedDate: todo.completed_date,
        completedHour: todo.completed_hour,
        completedMinute: todo.completed_minute,
        completedSecond: todo.completed_second,
        createdAt: todo.created_at,
      }));

    res.json({ ...list, todos });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Add todo
app.post('/api/lists/:listId/todos', (req: any, res: any) => {
  try {
    const { listId } = req.params;
    const {
      id,
      title,
      deadlineHour,
      deadlineMinute,
    } = req.body;

    const todoId = id || `todo_${Date.now()}`;
    const stmt = db.prepare(
      'INSERT INTO todos (id, list_id, title, deadline_hour, deadline_minute) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(todoId, listId, title, deadlineHour, deadlineMinute);

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(todoId) as any;
    const formattedTodo = {
      id: todo.id,
      title: todo.title,
      deadlineHour: todo.deadline_hour,
      deadlineMinute: todo.deadline_minute,
      completed: todo.completed === 1,
      completedDate: todo.completed_date,
      completedHour: todo.completed_hour,
      completedMinute: todo.completed_minute,
      createdAt: todo.created_at,
    };
    broadcastToList(listId, { type: 'todo-added', todo: formattedTodo });
    res.json(formattedTodo);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Update todo
app.patch('/api/todos/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const {
      completed,
      completedDate,
      completedHour,
      completedMinute,
      completedSecond,
    } = req.body;

    const updates = [];
    const values = [];

    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }
    if (completedDate !== undefined) {
      updates.push('completed_date = ?');
      values.push(completedDate);
    }
    if (completedHour !== undefined) {
      updates.push('completed_hour = ?');
      values.push(completedHour);
    }
    if (completedMinute !== undefined) {
      updates.push('completed_minute = ?');
      values.push(completedMinute);
    }
    if (completedSecond !== undefined) {
      updates.push('completed_second = ?');
      values.push(completedSecond);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`
    );
    stmt.run(...values);

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as any;
    const formattedTodo = {
      id: todo.id,
      title: todo.title,
      deadlineHour: todo.deadline_hour,
      deadlineMinute: todo.deadline_minute,
      completed: todo.completed === 1,
      completedDate: todo.completed_date,
      completedHour: todo.completed_hour,
      completedMinute: todo.completed_minute,
      completedSecond: todo.completed_second,
      createdAt: todo.created_at,
    };
    const listId = todo.list_id;
    broadcastToList(listId, { type: 'todo-updated', todo: formattedTodo });
    res.json(formattedTodo);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Delete todo
app.delete('/api/todos/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as any;
    
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    stmt.run(id);

    broadcastToList(todo.list_id, { type: 'todo-deleted', id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Get rollover time for a list
app.get('/api/lists/:id/rollover', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const list = db.prepare('SELECT rollover_hour, rollover_minute FROM lists WHERE id = ?').get(id) as any;
    if (!list) return res.status(404).json({ error: 'List not found' });
    res.json({ rolloverHour: list.rollover_hour, rolloverMinute: list.rollover_minute });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Update rollover time for a list
app.put('/api/lists/:id/rollover', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { rolloverHour, rolloverMinute } = req.body;
    
    const stmt = db.prepare('UPDATE lists SET rollover_hour = ?, rollover_minute = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(rolloverHour, rolloverMinute, id);
    
    res.json({ rolloverHour, rolloverMinute });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// Check every minute if any list needs rollover
setInterval(() => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Get all lists with this rollover time
    const lists = db.prepare('SELECT id FROM lists WHERE rollover_hour = ? AND rollover_minute = ?').all(currentHour, currentMinute) as any[];

    lists.forEach(list => {
      // Uncheck all completed tasks for this list
      const stmt = db.prepare('UPDATE todos SET completed = 0, completed_date = NULL, completed_hour = NULL, completed_minute = NULL, completed_second = NULL WHERE list_id = ? AND completed = 1');
      const result = stmt.run(list.id);

      if (result.changes > 0) {
        console.log(`Rollover: Unchecked ${result.changes} tasks for list ${list.id}`);
        
        // Broadcast to all connected clients for this list
        broadcastToList(list.id, { type: 'rollover', message: 'Tasks have been reset for the new day' });
      }
    });
  } catch (e) {
    console.error('Rollover error:', e);
  }
}, 60000); // Check every 60 seconds