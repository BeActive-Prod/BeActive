'use client';

import { useState, useRef, useEffect } from 'react';
import TimePicker from './TimePicker';

interface AddTodoModalProps {
  onAddTodo: (title: string, hour: number, minute: number) => void;
  onClose: () => void;
}

export default function AddTodoModal({ onAddTodo, onClose }: AddTodoModalProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState({ hour: 9, minute: 0 });
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Set default time to 1 hour from now, rounded to the next hour
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    // Round up to the next hour
    const roundedHour = oneHourLater.getMinutes() > 0 
      ? (oneHourLater.getHours() + 1) % 24 
      : oneHourLater.getHours();
    setTime({
      hour: roundedHour,
      minute: 0,
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    onAddTodo(title, time.hour, time.minute);
    setTitle('');
    // Reset to 1 hour from now, rounded to the next hour
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const roundedHour = oneHourLater.getMinutes() > 0 
      ? (oneHourLater.getHours() + 1) % 24 
      : oneHourLater.getHours();
    setTime({
      hour: roundedHour,
      minute: 0,
    });
    formRef.current?.reset();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border-2 border-slate-700 rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-5">Add New Task</h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Task Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your task..."
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Deadline
            </label>
            <TimePicker value={time} onChange={setTime} />
          </div>

          {error && (
            <div className="text-red-400 text-sm font-medium">
              ❌ {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
            >
              + Add Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-700 text-gray-300 font-semibold rounded-lg hover:bg-slate-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
