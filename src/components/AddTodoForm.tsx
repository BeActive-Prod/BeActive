'use client';

import { useState, useRef } from 'react';
import TimePicker from './TimePicker';

interface AddTodoFormProps {
  onAddTodo: (title: string, hour: number, minute: number) => void;
}

export default function AddTodoForm({ onAddTodo }: AddTodoFormProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState({ hour: 9, minute: 0 });
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    onAddTodo(title, time.hour, time.minute);
    setTitle('');
    setTime({ hour: 9, minute: 0 });
    formRef.current?.reset();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mb-8">
      <div className="bg-slate-800/50 border-2 border-slate-700 rounded-lg p-6 space-y-4">
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
            className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Daily Deadline (what time today?)
          </label>
          <TimePicker value={time} onChange={setTime} />
        </div>

        {error && (
          <div className="text-red-400 text-sm font-medium">
            ❌ {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
        >
          + Add Task
        </button>
      </div>
    </form>
  );
}
