'use client';

import { useState, useEffect } from 'react';
import TodoList from '@/components/TodoList';
import AddTodoModal from '@/components/AddTodoModal';
import ShareModal from '@/components/ShareModal';
import SettingsModal from '@/components/SettingsModal';
import ActionMenu from '@/components/ActionMenu';
import { useSharedList } from '@/hooks/useSharedList';

export default function Home() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rolloverHour, setRolloverHour] = useState(4);
  const [rolloverMinute, setRolloverMinute] = useState(0);
  const { todos, addTodo, updateTodo, deleteTodo, generateShareLink, currentListId, isSharedList, apiUrl } =
    useSharedList();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Keyboard shortcut: Escape to close any open modal
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAddModal(false);
        setShowShareModal(false);
        setShowSettingsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    // Keyboard shortcut: 'n' to create new task
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea and no modal is already open
      if ((e.key === 'n' || e.key === 'N') && !showAddModal && !showShareModal && !showSettingsModal) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowAddModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAddModal, showShareModal, showSettingsModal]);

  useEffect(() => {
    if (currentListId && currentListId !== '__new__') {
      fetch(`${apiUrl}/api/lists/${currentListId}/rollover`)
        .then(res => res.json())
        .then(data => {
          setRolloverHour(data.rolloverHour);
          setRolloverMinute(data.rolloverMinute);
        })
        .catch(() => {
          // Default values already set
        });
    }
  }, [currentListId, apiUrl]);

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
      // Before rollover
      if (deadlineAInSeconds >= rolloverInSeconds) {
        // Task is after rollover (belongs to yesterday)
        differenceA = (deadlineAInSeconds - 24 * 3600) - nowInSeconds;
      } else {
        // Task is before rollover (today)
        differenceA = deadlineAInSeconds - nowInSeconds;
      }
    } else {
      // After rollover (today)
      if (deadlineAInSeconds >= rolloverInSeconds) {
        // Task is also after rollover (today)
        differenceA = deadlineAInSeconds - nowInSeconds;
      } else {
        // Task is before rollover (tomorrow)
        differenceA = (deadlineAInSeconds + 24 * 3600) - nowInSeconds;
      }
    }

    // Calculate time remaining for task B
    const deadlineBInSeconds = b.deadlineHour * 3600 + b.deadlineMinute * 60;
    let differenceB;
    if (nowInSeconds < rolloverInSeconds) {
      // Before rollover
      if (deadlineBInSeconds >= rolloverInSeconds) {
        // Task is after rollover (belongs to yesterday)
        differenceB = (deadlineBInSeconds - 24 * 3600) - nowInSeconds;
      } else {
        // Task is before rollover (today)
        differenceB = deadlineBInSeconds - nowInSeconds;
      }
    } else {
      // After rollover (today)
      if (deadlineBInSeconds >= rolloverInSeconds) {
        // Task is also after rollover (today)
        differenceB = deadlineBInSeconds - nowInSeconds;
      } else {
        // Task is before rollover (tomorrow)
        differenceB = (deadlineBInSeconds + 24 * 3600) - nowInSeconds;
      }
    }

    // Sort by time remaining (most overdue first, then least time remaining)
    return differenceA - differenceB;
  });

  const handleToggleTodo = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    updateTodo(id, {
      completed: !todo.completed,
      completedDate: !todo.completed ? today : undefined,
      completedHour: !todo.completed ? now.getHours() : undefined,
      completedMinute: !todo.completed ? now.getMinutes() : undefined,
      completedSecond: !todo.completed ? now.getSeconds() : undefined,
    });
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 md:py-6">
      <div className="max-w-3xl mx-auto pb-14 md:pb-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 md:mb-0 md:flex-col md:fixed md:top-6 md:left-6 md:z-40">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">BeActive</h1>
            <p className="text-sm text-purple-200">Deadline aware</p>
          </div>
          {isSharedList && (
            <div className="px-3 py-1 bg-blue-900/60 border border-blue-500/70 rounded-full w-fit">
              <span className="text-xs font-semibold text-blue-200">🔗 Shared List</span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="mt-2 md:mt-4">
          <TodoList
            todos={sortedTodos}
            onToggle={handleToggleTodo}
            onDelete={deleteTodo}
            listId={currentListId || ''}
            apiUrl={apiUrl}
          />
        </div>
        
        {/* Unified Action Menu */}
        <ActionMenu
          onNewTask={() => setShowAddModal(true)}
          onShare={() => setShowShareModal(true)}
          onSettings={() => setShowSettingsModal(true)}
        />

        {showAddModal && (
          <AddTodoModal 
            onAddTodo={addTodo} 
            onClose={() => setShowAddModal(false)}
          />
        )}

        {showShareModal && (
          <ShareModal
            shareLink={generateShareLink()}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {showSettingsModal && currentListId && currentListId !== '__new__' && (
          <SettingsModal
            listId={currentListId}
            apiUrl={apiUrl}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </div>
    </main>
  );
}
