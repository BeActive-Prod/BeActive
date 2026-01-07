'use client';

import { useState, useEffect } from 'react';
import TimePicker from './TimePicker';

interface SettingsModalProps {
  onClose: () => void;
  listId: string;
  apiUrl: string;
}

export default function SettingsModal({ onClose, listId, apiUrl }: SettingsModalProps) {
  const [rolloverHour, setRolloverHour] = useState(4);
  const [rolloverMinute, setRolloverMinute] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch current rollover time
    fetch(`${apiUrl}/api/lists/${listId}/rollover`)
      .then(res => res.json())
      .then(data => {
        setRolloverHour(data.rolloverHour);
        setRolloverMinute(data.rolloverMinute);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [listId, apiUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/lists/${listId}/rollover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolloverHour, rolloverMinute }),
      });
      onClose();
      // Reload page to apply new rollover time
      window.location.reload();
    } catch (e) {
      console.error('Failed to save settings', e);
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400 text-sm mb-6">
          Set the time when your day resets and all tasks are unchecked
        </p>

        {loading ? (
          <div className="text-gray-400 text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Day Rollover Time
              </label>
              <TimePicker
                value={{ hour: rolloverHour, minute: rolloverMinute }}
                onChange={(time) => {
                  setRolloverHour(time.hour);
                  setRolloverMinute(time.minute);
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                Tasks will reset and become unchecked at this time each day
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
