'use client';

import { useState, useEffect } from 'react';
import TodoList from '@/components/TodoList';
import AddTodoModal from '@/components/AddTodoModal';
import ShareModal from '@/components/ShareModal';
import SettingsModal from '@/components/SettingsModal';
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
    const rolloverInMinutes = rolloverHour * 60 + rolloverMinute;
    const timeA = a.deadlineHour * 60 + a.deadlineMinute;
    const timeB = b.deadlineHour * 60 + b.deadlineMinute;
    
    // Calculate time since rollover for each task
    // If time is before rollover, add 24 hours (next day)
    const aSinceRollover = timeA >= rolloverInMinutes ? timeA - rolloverInMinutes : timeA + 24 * 60 - rolloverInMinutes;
    const bSinceRollover = timeB >= rolloverInMinutes ? timeB - rolloverInMinutes : timeB + 24 * 60 - rolloverInMinutes;
    
    return aSinceRollover - bSinceRollover;
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header - Fixed to side */}
        <div className="fixed top-6 left-6 z-40">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">BeActive</h1>
            <p className="text-sm text-purple-300">Deadline aware</p>
          </div>
          {isSharedList && (
            <div className="mt-4 px-3 py-1 bg-blue-900/50 border border-blue-500 rounded-full w-fit">
              <span className="text-xs font-semibold text-blue-300">🔗 Shared List</span>
            </div>
          )}
        </div>

        {/* Share Button - Fixed to side */}
        <button
          onClick={() => setShowShareModal(true)}
          className="fixed top-6 right-6 z-40 px-4 py-2 bg-slate-700 border border-slate-600 text-gray-300 font-semibold rounded-lg hover:bg-slate-600 transition-all"
          title="Share this list"
        >
          🔗 Share
        </button>

        {/* Settings Button - Fixed to side below share */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="fixed top-20 right-6 z-40 px-4 py-2 bg-slate-700 border border-slate-600 text-gray-300 font-semibold rounded-lg hover:bg-slate-600 transition-all"
          title="Settings"
        >
          ⚙️ Settings
        </button>

        {/* Main content - starts at top */}
        <div className="mt-2">
          <TodoList
            todos={sortedTodos}
            onToggle={handleToggleTodo}
            onDelete={deleteTodo}
            listId={currentListId || ''}
            apiUrl={apiUrl}
          />
        </div>

        {/* Floating Action Button - Large with Text */}
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-8 right-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-full hover:from-purple-700 hover:to-purple-600 transition-all duration-200 transform hover:scale-110 shadow-lg text-lg flex items-center gap-2"
          title="Add new task"
        >
          <span className="text-2xl">+</span>
          New Task
        </button>

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
