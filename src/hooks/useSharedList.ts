'use client';

import { useState, useEffect, useCallback } from 'react';
import { Todo } from '@/types';

// Dynamically get API URL based on environment
const getApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // In development: talk directly to backend on 3001
    return 'http://localhost:3001';
  } else {
    // In production: use the proxy through Next.js
    return window.location.origin;
  }
};


const API_URL = getApiUrl();

export function useSharedList(listId?: string) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check URL params and localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlListId = params.get('list');
      const savedListId = localStorage.getItem('beactive-list-id');

      let resolvedListId: string | null = null;

      if (urlListId) {
        resolvedListId = urlListId;
        localStorage.setItem('beactive-list-id', urlListId);
      } else if (savedListId) {
        resolvedListId = savedListId;
      }

      if (resolvedListId) {
        setCurrentListId(resolvedListId);
      } else {
        setCurrentListId('__new__'); // Special marker to create new list
      }
      setIsInitialized(true);
    }
  }, []);

  // Initialize list - only after we've checked localStorage
  useEffect(() => {
    if (!isInitialized || !currentListId) return;

    if (currentListId === '__new__') {
      // Create new list on first load
      fetch(`${API_URL}/api/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Tasks' }),
      })
        .then((res) => res.json())
        .then((data) => {
          setCurrentListId(data.id);
          localStorage.setItem('beactive-list-id', data.id);
        });
    } else {
      // Fetch existing list
      fetch(`${API_URL}/api/lists/${currentListId}`)
        .then((res) => res.json())
        .then((data) => {
          setTodos(data.todos || []);
        })
        .catch((e) => console.error('Failed to fetch list:', e));
    }
  }, [isInitialized, currentListId]);

  // WebSocket connection
  useEffect(() => {
    if (!currentListId || currentListId === '__new__') return;

    const isProd = process.env.NODE_ENV === 'production';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl: string;

    if (!isProd) {
      wsUrl = `${wsProtocol}//localhost:3001`;
    } else {
      // In production: use the Nginx proxy
      wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;
    }


    const websocket = new WebSocket(wsUrl);
    let reconnectTimeout: NodeJS.Timeout;


    websocket.onopen = () => {
      websocket.send(JSON.stringify({ type: 'subscribe', listId: currentListId }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'todo-added') {
        setTodos((prev) => [data.todo, ...prev]);
      } else if (data.type === 'todo-updated') {
        setTodos((prev) =>
          prev.map((t) => (t.id === data.todo.id ? data.todo : t))
        );
      } else if (data.type === 'todo-deleted') {
        setTodos((prev) => prev.filter((t) => t.id !== data.id));
      } else if (data.type === 'rollover') {
        // Rollover happened - refresh all todos
        fetch(`${API_URL}/api/lists/${currentListId}`)
          .then((res) => res.json())
          .then((listData) => {
            setTodos(listData.todos || []);
          })
          .catch((e) => console.error('Failed to refresh after rollover:', e));
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket closed');
      // Attempt to reconnect after 3 seconds
      reconnectTimeout = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        // Trigger reconnection by resetting currentListId
      }, 3000);
    };

    setWs(websocket);

    return () => {
      clearTimeout(reconnectTimeout);
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [currentListId]);

  const addTodo = useCallback(
    (title: string, deadlineHour: number, deadlineMinute: number) => {
      if (!currentListId) return;

      fetch(`${API_URL}/api/lists/${currentListId}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, deadlineHour, deadlineMinute }),
      });
    },
    [currentListId]
  );

  const updateTodo = useCallback(
    (id: string, updates: Partial<Todo>) => {
      fetch(`${API_URL}/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    },
    []
  );

  const deleteTodo = useCallback((id: string) => {
    fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
  }, []);

  const generateShareLink = useCallback(() => {
    if (!currentListId || currentListId === '__new__') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?list=${currentListId}`;
  }, [currentListId]);

  const isSharedList = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return !!params.get('list');
  }, []);

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    generateShareLink,
    currentListId,
    isSharedList: isSharedList(),
    apiUrl: API_URL,
  };
}
