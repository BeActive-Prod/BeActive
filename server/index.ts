import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import db, { initializeDatabase } from './db';

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