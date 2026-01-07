'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Todo } from '@/types';
import { getApiUrl } from '@/utils/apiUrl';

export function useSharedList(listId?: string) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    const apiUrl = getApiUrl();
    console.log('🔄 Initializing list:', currentListId, 'API URL:', apiUrl);

    if (currentListId === '__new__') {
      // Create new list on first load
      fetch(`${apiUrl}/api/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Tasks' }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log('✅ New list created:', data.id);
          setCurrentListId(data.id);
          localStorage.setItem('beactive-list-id', data.id);
        })
        .catch((e) => console.error('❌ Failed to create list:', e));
    } else {
      // Fetch existing list
      fetch(`${apiUrl}/api/lists/${currentListId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log('✅ Fetched list with', data.todos?.length || 0, 'todos');
          setTodos(data.todos || []);
        })
        .catch((e) => console.error('❌ Failed to fetch list:', e));
    }
  }, [isInitialized, currentListId]);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!currentListId || currentListId === '__new__') return;

    const isProd = process.env.NODE_ENV === 'production';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl: string;

    if (!isProd) {
      // In development: use the same host as the frontend, but on port 3001
      const host = window.location.hostname;
      wsUrl = `${wsProtocol}//${host}:3001/api/ws`;
    } else {
      // In production: use the Nginx proxy
      wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;
    }

    try {
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        wsRef.current = websocket;
        setWs(websocket);
        websocket.send(JSON.stringify({ type: 'subscribe', listId: currentListId }));
      };

      websocket.onmessage = (event) => {
        try {
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
            const apiUrl = getApiUrl();
            fetch(`${apiUrl}/api/lists/${currentListId}`)
              .then((res) => res.json())
              .then((listData) => {
                setTodos(listData.todos || []);
              })
              .catch((e) => console.error('Failed to refresh after rollover:', e));
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

      websocket.onclose = () => {
        console.log('⚠️ WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 3000);
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setIsConnected(false);
    }
  }, [currentListId]);

  // WebSocket connection effect
  useEffect(() => {
    if (!currentListId || currentListId === '__new__') return;

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [currentListId, connectWebSocket]);

  // Handle page visibility - reconnect when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page is now visible - checking WebSocket connection');

        // If WebSocket is closed, reconnect immediately
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('🔄 WebSocket not connected, reconnecting...');

          // Clear any pending reconnection timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          // Reconnect immediately
          connectWebSocket();
        } else {
          console.log('✅ WebSocket already connected');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectWebSocket]);

  const addTodo = useCallback(
    (title: string, deadlineHour: number, deadlineMinute: number) => {
      if (!currentListId) return;

      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/api/lists/${currentListId}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, deadlineHour, deadlineMinute }),
      });
    },
    [currentListId]
  );

  const updateTodo = useCallback(
    (id: string, updates: Partial<Todo>) => {
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    },
    []
  );

  const deleteTodo = useCallback((id: string) => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/api/todos/${id}`, { method: 'DELETE' });
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
    apiUrl: getApiUrl(),
    isConnected,
  };
}