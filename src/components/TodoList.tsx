'use client';

import { useState, useEffect } from 'react';
import { Todo } from '@/types';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  listId: string;
  apiUrl: string;
  readOnly?: boolean;
}

export default function TodoList({ todos, onToggle, onDelete, listId, apiUrl, readOnly = false }: TodoListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [rolloverHour, setRolloverHour] = useState(4);
  const [rolloverMinute, setRolloverMinute] = useState(0);

  useEffect(() => {
    if (listId && listId !== '__new__') {
      fetch(`${apiUrl}/api/lists/${listId}/rollover`)
        .then(res => res.json())
        .then(data => {
          setRolloverHour(data.rolloverHour);
          setRolloverMinute(data.rolloverMinute);
        })
        .catch(() => {
          // Default values already set
        });
    }
  }, [listId, apiUrl]);

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  if (todos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No tasks yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Next Due Task - Prominently Displayed */}
      {activeTodos.length > 0 && (
        <div className="mb-8 pb-8 border-b-2 border-dashed border-purple-500/30">
          <div className="text-lg font-semibold text-purple-400 mb-3 uppercase tracking-wider">
            ⭐ Next Due Task
          </div>
          <TodoItem
            key={activeTodos[0].id}
            todo={activeTodos[0]}
            onToggle={onToggle}
            onDelete={onDelete}
            isNextDue={true}
            rolloverHour={rolloverHour}
            rolloverMinute={rolloverMinute}
            readOnly={readOnly}
          />
        </div>
      )}

      {/* Remaining Active Tasks */}
      {activeTodos.length > 1 && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            Other Tasks
          </div>
          {activeTodos.slice(1).map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              isNextDue={false}
              rolloverHour={rolloverHour}
              rolloverMinute={rolloverMinute}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {/* Completed Tasks Collapsible Section */}
      {completedTodos.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-gray-300 transition-colors"
          >
            <span className={`transform transition-transform ${showCompleted ? 'rotate-90' : ''}`}>
              ▶
            </span>
            Completed ({completedTodos.length})
          </button>

          {showCompleted && (
            <div className="space-y-2 mt-3 opacity-75">
              {completedTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  rolloverHour={rolloverHour}
                  rolloverMinute={rolloverMinute}
                  readOnly={readOnly}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
