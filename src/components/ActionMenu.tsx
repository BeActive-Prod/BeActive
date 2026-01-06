'use client';

import { useState, useEffect, useRef } from 'react';

interface ActionMenuProps {
  onNewTask: () => void;
  onShare: () => void;
  onSettings: () => void;
}

export default function ActionMenu({ onNewTask, onShare, onSettings }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { icon: '✨', label: 'New Task', action: onNewTask },
    { icon: '🔗', label: 'Share', action: onShare },
    { icon: '⚙️', label: 'Settings', action: onSettings },
  ];

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div ref={menuRef} className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        {/* Menu Items - appear above when open */}
        {isOpen && (
          <div className="flex flex-col gap-2">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => handleMenuItemClick(item.action)}
                className="h-16 flex items-center gap-3 px-5 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-md border bg-slate-800/90 border-slate-700/60 hover:border-slate-600 text-gray-200 hover:text-white font-semibold"
                style={{
                  animation: `slideInUp 0.35s ease-out ${index * 60}ms forwards`,
                  opacity: 0,
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* New Task Button - Always visible; expands with label when menu is open */}
        <button
          onClick={onNewTask}
          className={`relative overflow-hidden transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center text-white ${
            isOpen
              ? 'h-16 px-5 rounded-full bg-gradient-to-br from-purple-600 to-purple-500'
              : 'w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 hover:scale-110'
          }`}
          title="New Task (shortcut: N)"
        >
          <span className={`${isOpen ? 'text-xl font-semibold mr-2' : 'text-4xl font-bold leading-none'} drop-shadow-lg`}>
            +
          </span>
          {isOpen && <span className="text-sm font-semibold">New Task</span>}
        </button>

        {/* Menu Toggle Button - hamburger when closed, cross when open */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl transform ${
            isOpen
              ? 'bg-gradient-to-br from-slate-800 to-slate-700 scale-95'
              : 'bg-gradient-to-br from-slate-800 to-slate-700 hover:scale-110'
          } text-white group`}
          title={isOpen ? 'Close menu' : 'Open menu'}
        >
          <span
            className="text-3xl font-bold transition-transform duration-300 leading-none inline-block text-white drop-shadow-lg"
            style={{
              transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
            }}
          >
            {isOpen ? '✕' : '≡'}
          </span>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
