'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TodoList from '@/components/TodoList';
import { Todo } from '@/types';
import { getApiUrl } from '@/utils/apiUrl';

export default function SharePage() {
  const searchParams = useSearchParams();
  const listId = searchParams.get('list');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rolloverHour, setRolloverHour] = useState(4);
  const [rolloverMinute, setRolloverMinute] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch list data
  useEffect(() => {
    if (!listId || !mounted) return;

    const fetchList = async () => {
      try {
        setError(null);
        const response = await fetch(`${getApiUrl()}/api/lists/${listId}`);

        if (!response.ok) {
          throw new Error('List not found or is not public');
        }

        const data = await response.json();
        setTodos(data.todos || []);

        if (data.rollover_hour !== undefined) {
          setRolloverHour(data.rollover_hour);
          setRolloverMinute(data.rollover_minute);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
  }, [listId, mounted]);

  const sortedTodos = [...todos].sort((a, b) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSeconds = now.getSeconds();

    const rolloverInSeconds = rolloverHour * 3600 + rolloverMinute * 60;
    const nowInSeconds = currentHour * 3600 + currentMinute * 60 + currentSeconds;

    // Calculate time remaining for task A
    const deadlineAInSeconds = a.deadlineHour * 3600 + a.deadlineMinute * 60;
    let differenceA;
    if (nowInSeconds < rolloverInSeconds) {
      if (deadlineAInSeconds >= rolloverInSeconds) {
        differenceA = (deadlineAInSeconds - 24 * 3600) - nowInSeconds;
      } else {
        differenceA = deadlineAInSeconds - nowInSeconds;
      }
    } else {
      if (deadlineAInSeconds >= rolloverInSeconds) {
        differenceA = deadlineAInSeconds - nowInSeconds;
      } else {
        differenceA = (deadlineAInSeconds + 24 * 3600) - nowInSeconds;
      }
    }

    // Calculate time remaining for task B
    const deadlineBInSeconds = b.deadlineHour * 3600 + b.deadlineMinute * 60;
    let differenceB;
    if (nowInSeconds < rolloverInSeconds) {
      if (deadlineBInSeconds >= rolloverInSeconds) {
        differenceB = (deadlineBInSeconds - 24 * 3600) - nowInSeconds;
      } else {
        differenceB = deadlineBInSeconds - nowInSeconds;
      }
    } else {
      if (deadlineBInSeconds >= rolloverInSeconds) {
        differenceB = deadlineBInSeconds - nowInSeconds;
      } else {
        differenceB = (deadlineBInSeconds + 24 * 3600) - nowInSeconds;
      }
    }

    return differenceA - differenceB;
  });

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="text-white text-center">Loading shared list...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Shared List</h1>
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-6 py-4 rounded">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Shared Task List</h1>
          <p className="text-purple-300">View shared tasks (read-only)</p>
        </div>

        {/* Todo list */}
        <TodoList
          todos={sortedTodos}
          onToggle={() => {}} // Shared lists are read-only
          onDelete={() => {}} // Shared lists are read-only
          listId={listId || ''}
          readOnly={true}
        />
      </div>
    </main>
  );
}
